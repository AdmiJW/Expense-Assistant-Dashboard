"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfWeek, startOfMonth, subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardCharts } from "@/components/dashboard-charts"
import { TrendingDown, CalendarDays, Calendar, Loader2 } from "lucide-react"

const DISPLAY_TIMEZONE = process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE ?? "Asia/Kuala_Lumpur"

type Preset = "today" | "week" | "month" | "30days" | "custom"

interface Stats {
  rangeTotal: number
  dailyTotals: { day: string; total: number }[]
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

  if (preset === "today") {
    return { from: today, to: today }
  }
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
  const [customFrom, setCustomFrom] = useState(() => {
    const nowLocal = toZonedTime(new Date(), DISPLAY_TIMEZONE)
    return format(startOfMonth(nowLocal), "yyyy-MM-dd")
  })
  const [customTo, setCustomTo] = useState(todayInTz)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const getRange = useCallback((): { from: string; to: string } => {
    if (preset === "custom") {
      return { from: customFrom, to: customTo }
    }
    return getPresetRange(preset) ?? { from: customFrom, to: customTo }
  }, [preset, customFrom, customTo])

  const fetchStats = useCallback(async () => {
    const { from, to } = getRange()
    if (!from || !to) return
    setLoading(true)
    const res = await fetch(`/api/dashboard/stats?from=${from}&to=${to}`)
    if (res.ok) {
      setStats(await res.json())
    }
    setLoading(false)
  }, [getRange])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preset !== "custom") fetchStats()
  }, [preset, fetchStats])

  function handleCustomApply() {
    if (customFrom && customTo) fetchStats()
  }

  const { from, to } = getRange()
  const rangeLabel = from === to ? from : `${from} ~ ${to}`

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">儀表板</h1>
        <p className="text-xs text-muted-foreground mt-1">顯示時區：{DISPLAY_TIMEZONE}</p>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap gap-2 items-center">
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
          <div className="flex items-center gap-2 ml-1">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 w-36 text-sm"
            />
            <span className="text-muted-foreground text-sm">至</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 w-36 text-sm"
            />
            <Button size="sm" onClick={handleCustomApply} disabled={!customFrom || !customTo}>
              查詢
            </Button>
          </div>
        )}
      </div>

      {/* Metric card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              期間總支出
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">載入中…</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">{formatMoney(stats?.rangeTotal ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{rangeLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              支出筆數
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">載入中…</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">
                {stats?.categoryTotals.length ?? 0}{" "}
                <span className="text-lg font-medium text-muted-foreground">類別</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">本期間涵蓋類別數</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>載入圖表資料…</span>
        </div>
      ) : (
        <DashboardCharts
          dailyTotals={stats?.dailyTotals ?? []}
          categoryTotals={stats?.categoryTotals ?? []}
          rangeLabel={rangeLabel}
        />
      )}
    </div>
  )
}
