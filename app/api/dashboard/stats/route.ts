export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDashboardStats } from "@/lib/db/expense-db"
import { DISPLAY_TIMEZONE } from "@/lib/timezone"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { startOfDay, startOfMonth, addMonths, addDays, format, parseISO } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get("from") // YYYY-MM-DD in display timezone
  const toParam = searchParams.get("to")     // YYYY-MM-DD in display timezone

  let rangeStart: string
  let rangeEnd: string
  let chartStartDateStr: string
  let chartEndDateStr: string

  if (fromParam && toParam) {
    // Custom range: from = start of fromParam day, to = end of toParam day
    const fromLocal = parseISO(fromParam + "T00:00:00")
    rangeStart = fromZonedTime(fromLocal, DISPLAY_TIMEZONE).toISOString()
    // rangeEnd is exclusive, so use start of next day after toParam
    const toNextDayLocal = addDays(parseISO(toParam + "T00:00:00"), 1)
    rangeEnd = fromZonedTime(toNextDayLocal, DISPLAY_TIMEZONE).toISOString()
    chartStartDateStr = fromParam
    chartEndDateStr = toParam
  } else {
    // Default: current month for totals, last 30 days for the chart
    const now = new Date()
    const nowLocal = toZonedTime(now, DISPLAY_TIMEZONE)
    const todayLocalStart = startOfDay(nowLocal)
    const monthLocalStart = startOfMonth(nowLocal)
    const nextMonthLocalStart = startOfMonth(addMonths(nowLocal, 1))
    const thirtyDaysAgoLocal = addDays(todayLocalStart, -29)

    rangeStart = fromZonedTime(monthLocalStart, DISPLAY_TIMEZONE).toISOString()
    rangeEnd = fromZonedTime(nextMonthLocalStart, DISPLAY_TIMEZONE).toISOString()
    chartStartDateStr = format(thirtyDaysAgoLocal, "yyyy-MM-dd")
    chartEndDateStr = format(todayLocalStart, "yyyy-MM-dd")
  }

  const stats = getDashboardStats({
    rangeStart,
    rangeEnd,
    chartStartDateStr,
    chartEndDateStr,
    timezone: DISPLAY_TIMEZONE,
  })

  return NextResponse.json({
    ...stats,
    chartStartDateStr,
    chartEndDateStr,
  })
}
