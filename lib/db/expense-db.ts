import Database from "better-sqlite3"
import { formatInTimeZone } from "date-fns-tz"
import { getExpenseDbPath } from "@/lib/paths"

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
): { rows: Expense[]; total: number } {
  const db = getDb()
  const offset = (page - 1) * limit
  const { search, dateFrom, dateTo, category, minAmount, maxAmount } = filters

  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    const like = `%${search}%`
    conditions.push("(category LIKE ? OR sub_category LIKE ? OR description LIKE ? OR remark LIKE ?)")
    params.push(like, like, like, like)
  }
  if (dateFrom) { conditions.push("date >= ?"); params.push(dateFrom) }
  if (dateTo)   { conditions.push("date <= ?"); params.push(dateTo) }
  if (category) { conditions.push("category = ?"); params.push(category) }
  if (minAmount !== undefined) { conditions.push("amount >= ?"); params.push(minAmount) }
  if (maxAmount !== undefined) { conditions.push("amount <= ?"); params.push(maxAmount) }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const rows = db
    .prepare(`SELECT * FROM expenses ${where} ORDER BY date DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Expense[]

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM expenses ${where}`)
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

export interface DailyTotal {
  day: string
  total: number
}

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
}

function fillDailyTotals(
  sparse: DailyTotal[],
  startDateStr: string,
  endDateStr: string
): DailyTotal[] {
  const map = new Map(sparse.map((d) => [d.day, d.total]))
  const result: DailyTotal[] = []
  const cursor = new Date(startDateStr + "T00:00:00Z")
  const end = new Date(endDateStr + "T00:00:00Z")
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    result.push({ day: key, total: map.get(key) ?? 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

export function getDashboardStats(opts: DashboardStatsOptions): {
  rangeTotal: number
  dailyTotals: DailyTotal[]
  categoryTotals: CategoryTotal[]
} {
  const db = getDb()
  const { rangeStart, rangeEnd, chartStartDateStr, chartEndDateStr, timezone } = opts

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

  const localDailyTotals = new Map<string, number>()
  for (const row of dailyRows) {
    const day = formatInTimeZone(new Date(row.date), timezone, "yyyy-MM-dd")
    localDailyTotals.set(day, (localDailyTotals.get(day) ?? 0) + row.amount)
  }

  const sparseDailyTotals = Array.from(localDailyTotals, ([day, total]) => ({
    day,
    total,
  })).sort((a, b) => a.day.localeCompare(b.day))

  const dailyTotals = fillDailyTotals(sparseDailyTotals, chartStartDateStr, chartEndDateStr)

  const categoryTotals = db
    .prepare(
      `SELECT category, SUM(amount) as total
       FROM expenses WHERE date >= ? AND date < ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(rangeStart, rangeEnd) as CategoryTotal[]

  return { rangeTotal, dailyTotals, categoryTotals }
}
