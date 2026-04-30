"use client"

import { useCallback, useEffect, useState } from "react"
import { format, startOfMonth, startOfWeek, subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { BarChart3, Calendar, CalendarDays, LineChart, Loader2, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DashboardCharts } from "@/components/dashboard-charts"
import { formatChineseDate } from "@/lib/date-format"
import type { ChartGroupBy, ChartTotal } from "@/lib/stats-buckets"

const DISPLAY_TIMEZONE = process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE ?? "Asia/Kuala_Lumpur"

type Preset = "today" | "week" | "month" | "30days" | "custom"
type ChartType = "bar" | "line"

interface Stats {
  rangeTotal: number
  chartTotals: ChartTotal[]
  categoryTotals: { category: string; total: number }[]
  chartStartDateStr: string
  chartEndDateStr: string
}

function formatMoney(amount: number) {
  return `RM ${amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function todayInTz(): string {
  return format(toZonedTime(new Date(), DISPLAY_TIMEZONE), "yyyy-MM-dd")
}

function getPresetRange(preset: Preset): { from: string; to: string } | null {
  if (preset === "custom") return null
  const nowLocal = toZonedTime(new Date(), DISPLAY_TIMEZONE)
  const today = format(nowLocal, "yyyy-MM-dd")

  if (preset === "today") return { from: today, to: today }
  if (preset === "week") {
    const weekStart = startOfWeek(nowLocal, { weekStartsOn: 1 })
    return { from: format(weekStart, "yyyy-MM-dd"), to: today }
  }
  if (preset === "month") {
    const monthStart = startOfMonth(nowLocal)
    return { from: format(monthStart, "yyyy-MM-dd"), to: today }
  }
  if (preset === "30days") {
    const start = subDays(nowLocal, 29)
    return { from: format(start, "yyyy-MM-dd"), to: today }
  }
  return null
}

const PRESET_LABELS: Record<Preset, string> = {
  today: "今日",
  week: "本週",
  month: "本月",
  "30days": "近 30 天",
  custom: "自訂",
}

export function DashboardShell() {
  const [preset, setPreset] = useState<Preset>("month")
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [groupBy, setGroupBy] = useState<ChartGroupBy>("day")
  const [customFrom, setCustomFrom] = useState(() => {
    const nowLocal = toZonedTime(new Date(), DISPLAY_TIMEZONE)
    return format(startOfMonth(nowLocal), "yyyy-MM-dd")
  })
  const [customTo, setCustomTo] = useState(todayInTz)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const getRange = useCallback((): { from: string; to: string } => {
    if (preset === "custom") return { from: customFrom, to: customTo }
    return getPresetRange(preset) ?? { from: customFrom, to: customTo }
  }, [preset, customFrom, customTo])

  const fetchStats = useCallback(async () => {
    const { from, to } = getRange()
    if (!from || !to) return
    setLoading(true)
    const params = new URLSearchParams({ from, to, groupBy })
    const res = await fetch(`/api/dashboard/stats?${params}`)
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }, [getRange, groupBy])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preset !== "custom") fetchStats()
  }, [preset, fetchStats])

  function handleCustomApply() {
    if (customFrom && customTo) fetchStats()
  }

  const { from, to } = getRange()
  const rangeLabel =
    from === to ? formatChineseDate(from) : `${formatChineseDate(from)} ~ ${formatChineseDate(to)}`

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">儀表板</h1>
        <p className="mt-1 text-xs text-muted-foreground">顯示時區：{DISPLAY_TIMEZONE}</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "week", "month", "30days", "custom"] as Preset[]).map((p) => (
            <Button
              key={p}
              variant={preset === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPreset(p)}
              className="gap-1.5"
            >
              {p === "custom" && <Calendar className="h-3.5 w-3.5" />}
              {PRESET_LABELS[p]}
            </Button>
          ))}

          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-2 md:ml-1">
              <Input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="h-8 w-[calc(50%-1.5rem)] min-w-36 text-sm sm:w-36"
              />
              <span className="text-sm text-muted-foreground">至</span>
              <Input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="h-8 w-[calc(50%-1.5rem)] min-w-36 text-sm sm:w-36"
              />
              <Button className="w-full sm:w-auto" size="sm" onClick={handleCustomApply} disabled={!customFrom || !customTo}>
                查詢
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-md border bg-card p-1">
            {(["day", "week", "month"] as ChartGroupBy[]).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={groupBy === value ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => setGroupBy(value)}
              >
                {value === "day" ? "每日" : value === "week" ? "每週" : "每月"}
              </Button>
            ))}
          </div>
          <div className="flex rounded-md border bg-card p-1">
            <Button
              type="button"
              size="sm"
              variant={chartType === "bar" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              長條
            </Button>
            <Button
              type="button"
              size="sm"
              variant={chartType === "line" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => setChartType("line")}
            >
              <LineChart className="h-3.5 w-3.5" />
              折線
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">期間總支出</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">載入中...</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">{formatMoney(stats?.rangeTotal ?? 0)}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{rangeLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">支出筆數</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">載入中...</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">
                {stats?.categoryTotals.length ?? 0}{" "}
                <span className="text-lg font-medium text-muted-foreground">類別</span>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">本期間涵蓋類別數</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>載入圖表資料...</span>
        </div>
      ) : (
        <DashboardCharts
          chartTotals={stats?.chartTotals ?? []}
          categoryTotals={stats?.categoryTotals ?? []}
          rangeLabel={rangeLabel}
          chartType={chartType}
          groupBy={groupBy}
        />
      )}
    </div>
  )
}
