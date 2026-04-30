import { addDays, format, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import type {
  CategoryTotal,
  ChartGroupBy,
  ChartTotal,
  Expense,
  ExpenseAttachment,
  ExpenseFilters,
  ExpenseWithAttachmentCount,
} from "@/lib/db/expense-db"
import { DEMO_PASSWORD, DEMO_USERNAME } from "@/lib/demo-constants"
import { categoriesMatch, normalizeCategory } from "@/lib/categories"
import {
  createEmptyChartTotals,
  getChartBucket,
  getChartBuckets,
} from "@/lib/stats-buckets"

export { DEMO_PASSWORD, DEMO_USERNAME }

const descriptions = [
  ["食物", "早餐", "社區咖啡店"],
  ["食物", "午餐", "商務套餐"],
  ["飲料", "手搖飲", "少糖烏龍茶"],
  ["交通", "捷運加值", "通勤交通費"],
  ["購物", "生活用品", "補充日用品"],
  ["娛樂", "電影票", "週末放鬆"],
  ["居家", "清潔用品", "家務補貨"],
  ["數位產品", "雲端訂閱", "生產力工具"],
  ["醫療", "藥局", "保健用品"],
  ["旅行", "飯店訂金", "週末小旅行"],
] as const

export const DEMO_EXPENSES: ExpenseWithAttachmentCount[] = Array.from(
  { length: 72 },
  (_, index) => {
    const [category, subCategory, description] = descriptions[index % descriptions.length]
    const day = addDays(parseISO("2026-03-01T00:00:00"), index)
    const hour = 8 + (index % 12)
    const minute = (index * 7) % 60
    const date = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute))
    const amount = Number((8 + ((index * 17) % 180) + (index % 3) * 0.55).toFixed(2))
    const hasAttachment = index % 9 === 0

    return {
      id: `demo-expense-${String(index + 1).padStart(3, "0")}`,
      amount,
      category,
      sub_category: subCategory,
      description,
      remark: index % 4 === 0 ? "展示資料：模擬真實支出情境" : null,
      date: date.toISOString(),
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
      attachment_count: hasAttachment ? 1 : 0,
    }
  }
)

export const DEMO_ATTACHMENTS: ExpenseAttachment[] = DEMO_EXPENSES
  .filter((expense) => expense.attachment_count > 0)
  .map((expense, index) => ({
    id: `demo-attachment-${String(index + 1).padStart(3, "0")}`,
    expense_id: expense.id,
    file_path: `demo/demo-receipt-${index + 1}.txt`,
    original_filename: `demo-receipt-${index + 1}.txt`,
    mime_type: "text/plain; charset=utf-8",
    remark: "展示附件",
    created_at: expense.created_at,
  }))

function matchesFilters(expense: ExpenseWithAttachmentCount, filters: ExpenseFilters) {
  if (filters.search) {
    const needle = filters.search.toLowerCase()
    const haystack = [
      expense.category,
      expense.sub_category,
      expense.description,
      expense.remark,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  if (filters.dateFrom && expense.date < filters.dateFrom) return false
  if (filters.dateTo && expense.date > filters.dateTo) return false
  if (filters.category && !categoriesMatch(expense.category, filters.category)) return false
  if (filters.minAmount !== undefined && expense.amount < filters.minAmount) return false
  if (filters.maxAmount !== undefined && expense.amount > filters.maxAmount) return false
  return true
}

export function getDemoExpenses(
  page: number,
  limit: number,
  filters: ExpenseFilters = {}
): { rows: ExpenseWithAttachmentCount[]; total: number } {
  const filtered = DEMO_EXPENSES
    .filter((expense) => matchesFilters(expense, filters))
    .sort((a, b) => b.date.localeCompare(a.date))
  const offset = (page - 1) * limit

  return {
    rows: filtered.slice(offset, offset + limit),
    total: filtered.length,
  }
}

export function getDemoExpenseById(id: string): Expense | null {
  return DEMO_EXPENSES.find((expense) => expense.id === id) ?? null
}

export function getDemoAttachmentsByExpenseId(expenseId: string): ExpenseAttachment[] {
  return DEMO_ATTACHMENTS.filter((attachment) => attachment.expense_id === expenseId)
}

export function getDemoAttachmentById(id: string): ExpenseAttachment | null {
  return DEMO_ATTACHMENTS.find((attachment) => attachment.id === id) ?? null
}

export function getDemoDashboardStats(opts: {
  rangeStart: string
  rangeEnd: string
  chartStartDateStr: string
  chartEndDateStr: string
  timezone: string
  groupBy: ChartGroupBy
}): {
  rangeTotal: number
  chartTotals: ChartTotal[]
  categoryTotals: CategoryTotal[]
} {
  const rows = DEMO_EXPENSES.filter(
    (expense) => expense.date >= opts.rangeStart && expense.date < opts.rangeEnd
  )
  const rangeTotal = rows.reduce((sum, expense) => sum + expense.amount, 0)
  const chartMap = createEmptyChartTotals(
    opts.chartStartDateStr,
    opts.chartEndDateStr,
    opts.groupBy
  )
  const categoryMap = new Map<string, number>()

  for (const expense of rows) {
    const localDay = formatInTimeZone(new Date(expense.date), opts.timezone, "yyyy-MM-dd")
    const bucket = getChartBucket(localDay, opts.groupBy)
    if (chartMap.has(bucket.key)) {
      const current = chartMap.get(bucket.key)!
      chartMap.set(bucket.key, { ...current, total: current.total + expense.amount })
    }
    const category = normalizeCategory(expense.category)
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + expense.amount)
  }

  const buckets = getChartBuckets(opts.chartStartDateStr, opts.chartEndDateStr, opts.groupBy)
  const chartTotals = buckets.map((bucket) => chartMap.get(bucket.key) ?? bucket)
  const categoryTotals = Array.from(categoryMap, ([category, total]) => ({
    category,
    total,
  })).sort((a, b) => b.total - a.total)

  return {
    rangeTotal: Number(rangeTotal.toFixed(2)),
    chartTotals,
    categoryTotals,
  }
}

export function getDemoAttachmentText(attachment: ExpenseAttachment) {
  const expense = getDemoExpenseById(attachment.expense_id)
  const date = expense ? format(new Date(expense.date), "yyyy-MM-dd HH:mm") : "N/A"
  return [
    "Expense Dashboard Demo Attachment",
    "",
    `Attachment: ${attachment.original_filename}`,
    `Expense: ${expense?.description ?? "Demo expense"}`,
    `Amount: RM ${expense?.amount.toFixed(2) ?? "0.00"}`,
    `Date: ${date}`,
    "",
    "This is generated demo content and does not represent a real receipt.",
  ].join("\n")
}
