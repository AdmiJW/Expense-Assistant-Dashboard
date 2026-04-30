import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"

export type ChartGroupBy = "day" | "week" | "month"

export interface ChartTotal {
  key: string
  label: string
  total: number
}

function formatDayLabel(date: Date) {
  return format(date, "M月d日")
}

function formatMonthLabel(date: Date) {
  return format(date, "yyyy年M月")
}

export function getChartBucket(localDayStr: string, groupBy: ChartGroupBy): ChartTotal {
  const date = parseISO(`${localDayStr}T00:00:00`)

  if (groupBy === "week") {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    return {
      key: format(weekStart, "yyyy-MM-dd"),
      label: `${formatDayLabel(weekStart)}週`,
      total: 0,
    }
  }

  if (groupBy === "month") {
    const monthStart = startOfMonth(date)
    return {
      key: format(monthStart, "yyyy-MM"),
      label: formatMonthLabel(monthStart),
      total: 0,
    }
  }

  return {
    key: localDayStr,
    label: formatDayLabel(date),
    total: 0,
  }
}

export function getChartBuckets(
  startDateStr: string,
  endDateStr: string,
  groupBy: ChartGroupBy
): ChartTotal[] {
  const buckets: ChartTotal[] = []
  const end = parseISO(`${endDateStr}T00:00:00`)

  if (groupBy === "month") {
    let cursor = startOfMonth(parseISO(`${startDateStr}T00:00:00`))
    while (cursor <= end) {
      buckets.push(getChartBucket(format(cursor, "yyyy-MM-dd"), groupBy))
      cursor = addMonths(cursor, 1)
    }
    return buckets
  }

  if (groupBy === "week") {
    let cursor = startOfWeek(parseISO(`${startDateStr}T00:00:00`), { weekStartsOn: 1 })
    while (cursor <= end) {
      buckets.push(getChartBucket(format(cursor, "yyyy-MM-dd"), groupBy))
      cursor = addWeeks(cursor, 1)
    }
    return buckets
  }

  let cursor = parseISO(`${startDateStr}T00:00:00`)
  while (cursor <= end) {
    buckets.push(getChartBucket(format(cursor, "yyyy-MM-dd"), groupBy))
    cursor = addDays(cursor, 1)
  }
  return buckets
}

export function createEmptyChartTotals(
  startDateStr: string,
  endDateStr: string,
  groupBy: ChartGroupBy
): Map<string, ChartTotal> {
  return new Map(
    getChartBuckets(startDateStr, endDateStr, groupBy).map((bucket) => [
      bucket.key,
      bucket,
    ])
  )
}
