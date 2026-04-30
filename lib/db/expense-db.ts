import Database from "better-sqlite3"
import { formatInTimeZone } from "date-fns-tz"
import { getExpenseDbPath } from "@/lib/paths"
import { getCategoryAliases, normalizeCategory } from "@/lib/categories"
import {
  createEmptyChartTotals,
  getChartBucket,
  getChartBuckets,
  type ChartGroupBy,
  type ChartTotal,
} from "@/lib/stats-buckets"

export interface Expense {
  id: string
  amount: number
  category: string
  sub_category: string | null
  description: string
  remark: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface ExpenseWithAttachmentCount extends Expense {
  attachment_count: number
}

export interface ExpenseAttachment {
  id: string
  expense_id: string
  file_path: string
  original_filename: string
  mime_type: string
  remark: string | null
  created_at: string
}

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(getExpenseDbPath())
    _db.pragma("journal_mode = WAL")
    _db.pragma("busy_timeout = 5000")
  }
  return _db
}

export interface ExpenseFilters {
  search?: string
  dateFrom?: string   // UTC ISO string
  dateTo?: string     // UTC ISO string
  category?: string
  minAmount?: number
  maxAmount?: number
}

export function getExpenses(
  page: number,
  limit: number,
  filters: ExpenseFilters = {}
): { rows: ExpenseWithAttachmentCount[]; total: number } {
  const db = getDb()
  const offset = (page - 1) * limit
  const { search, dateFrom, dateTo, category, minAmount, maxAmount } = filters

  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    const like = `%${search}%`
    conditions.push("(e.category LIKE ? OR e.sub_category LIKE ? OR e.description LIKE ? OR e.remark LIKE ?)")
    params.push(like, like, like, like)
  }
  if (dateFrom) { conditions.push("e.date >= ?"); params.push(dateFrom) }
  if (dateTo)   { conditions.push("e.date <= ?"); params.push(dateTo) }
  if (category) {
    const aliases = getCategoryAliases(category)
    conditions.push(`e.category IN (${aliases.map(() => "?").join(", ")})`)
    params.push(...aliases)
  }
  if (minAmount !== undefined) { conditions.push("e.amount >= ?"); params.push(minAmount) }
  if (maxAmount !== undefined) { conditions.push("e.amount <= ?"); params.push(maxAmount) }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const rows = db
    .prepare(
      `SELECT e.*, COALESCE(ac.attachment_count, 0) as attachment_count
       FROM expenses e
       LEFT JOIN (
         SELECT expense_id, COUNT(*) as attachment_count
         FROM expense_attachments
         GROUP BY expense_id
       ) ac ON ac.expense_id = e.id
       ${where}
       ORDER BY e.date DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as ExpenseWithAttachmentCount[]

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM expenses e ${where}`)
    .get(...params) as { total: number }

  return { rows, total }
}

export function getExpenseById(id: string): Expense | null {
  const db = getDb()
  return (
    (db.prepare("SELECT * FROM expenses WHERE id = ?").get(id) as Expense) ??
    null
  )
}

export function createExpense(
  data: Omit<Expense, "created_at" | "updated_at">
): Expense {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO expenses (id, amount, category, sub_category, description, remark, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.id,
    data.amount,
    data.category,
    data.sub_category ?? null,
    data.description,
    data.remark ?? null,
    data.date,
    now,
    now
  )
  return getExpenseById(data.id)!
}

export function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "created_at" | "updated_at">>
): Expense | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields = Object.keys(data)
    .map((k) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data)
  db.prepare(
    `UPDATE expenses SET ${fields}, updated_at = ? WHERE id = ?`
  ).run(...values, now, id)
  return getExpenseById(id)
}

export function deleteExpense(id: string): void {
  getDb().prepare("DELETE FROM expenses WHERE id = ?").run(id)
}

export function getAttachmentsByExpenseId(
  expenseId: string
): ExpenseAttachment[] {
  return getDb()
    .prepare("SELECT * FROM expense_attachments WHERE expense_id = ? ORDER BY created_at ASC")
    .all(expenseId) as ExpenseAttachment[]
}

export function getAttachmentById(id: string): ExpenseAttachment | null {
  return (
    (getDb()
      .prepare("SELECT * FROM expense_attachments WHERE id = ?")
      .get(id) as ExpenseAttachment) ?? null
  )
}

export function deleteAttachmentRow(id: string): void {
  getDb().prepare("DELETE FROM expense_attachments WHERE id = ?").run(id)
}

export type { ChartGroupBy, ChartTotal }

export interface CategoryTotal {
  category: string
  total: number
}

export interface DashboardStatsOptions {
  rangeStart: string        // UTC ISO — start of selected period (inclusive)
  rangeEnd: string          // UTC ISO — end of selected period (exclusive)
  chartStartDateStr: string // YYYY-MM-DD in display tz — first day shown on bar chart
  chartEndDateStr: string   // YYYY-MM-DD in display tz — last day shown on bar chart
  timezone: string
  groupBy: ChartGroupBy
}

export function getDashboardStats(opts: DashboardStatsOptions): {
  rangeTotal: number
  chartTotals: ChartTotal[]
  categoryTotals: CategoryTotal[]
} {
  const db = getDb()
  const { rangeStart, rangeEnd, chartStartDateStr, chartEndDateStr, timezone, groupBy } = opts

  const { rangeTotal } = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as rangeTotal FROM expenses WHERE date >= ? AND date < ?"
    )
    .get(rangeStart, rangeEnd) as { rangeTotal: number }

  const dailyRows = db
    .prepare(
      `SELECT date, amount
       FROM expenses WHERE date >= ? AND date < ?
       ORDER BY date ASC`
    )
    .all(rangeStart, rangeEnd) as Pick<Expense, "date" | "amount">[]

  const chartMap = createEmptyChartTotals(chartStartDateStr, chartEndDateStr, groupBy)
  for (const row of dailyRows) {
    const localDay = formatInTimeZone(new Date(row.date), timezone, "yyyy-MM-dd")
    const bucket = getChartBucket(localDay, groupBy)
    if (chartMap.has(bucket.key)) {
      const current = chartMap.get(bucket.key)!
      chartMap.set(bucket.key, { ...current, total: current.total + row.amount })
    }
  }

  const chartTotals = getChartBuckets(chartStartDateStr, chartEndDateStr, groupBy).map(
    (bucket) => chartMap.get(bucket.key) ?? bucket
  )

  const categoryRows = db
    .prepare(
      `SELECT category, SUM(amount) as total
       FROM expenses WHERE date >= ? AND date < ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(rangeStart, rangeEnd) as CategoryTotal[]

  const categoryMap = new Map<string, number>()
  for (const row of categoryRows) {
    const category = normalizeCategory(row.category)
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + row.total)
  }
  const categoryTotals = Array.from(categoryMap, ([category, total]) => ({
    category,
    total,
  })).sort((a, b) => b.total - a.total)

  return { rangeTotal, chartTotals, categoryTotals }
}
