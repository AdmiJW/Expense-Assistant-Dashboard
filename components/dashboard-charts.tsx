"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getCategoryPresentation } from "@/components/category-presentation"
import type { ChartGroupBy, ChartTotal } from "@/lib/stats-buckets"

interface CategoryTotal {
  category: string
  total: number
}

interface Props {
  chartTotals: ChartTotal[]
  categoryTotals: CategoryTotal[]
  chartType: "bar" | "line"
  groupBy: ChartGroupBy
  rangeLabel?: string
}

function getInterval(count: number) {
  if (count <= 8) return 0
  if (count <= 16) return 1
  return Math.ceil(count / 8)
}

function getGroupLabel(groupBy: ChartGroupBy) {
  if (groupBy === "week") return "每週支出"
  if (groupBy === "month") return "每月支出"
  return "每日支出"
}

export function DashboardCharts({
  chartTotals,
  categoryTotals,
  chartType,
  groupBy,
  rangeLabel,
}: Props) {
  const tickInterval = getInterval(chartTotals.length)
  const categoryTotal = categoryTotals.reduce((sum, item) => sum + item.total, 0)

  const axis = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={tickInterval} />
      <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `RM${value}`} />
      <Tooltip
        formatter={(value) => [`RM ${Number(value).toFixed(2)}`, "支出"]}
        labelFormatter={(label) => `期間：${label}`}
      />
    </>
  )

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
          {rangeLabel ? `${getGroupLabel(groupBy)} · ${rangeLabel}` : getGroupLabel(groupBy)}
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          {chartType === "line" ? (
            <LineChart data={chartTotals} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
              {axis}
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2, fill: "var(--card)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartTotals} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              {axis}
              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
          {rangeLabel ? `支出分類 · ${rangeLabel}` : "支出分類"}
        </h2>
        {categoryTotals.length === 0 ? (
          <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
            此期間暫無支出記錄
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="relative h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={4}
                    dataKey="total"
                    nameKey="category"
                    label={false}
                    labelLine={false}
                  >
                    {categoryTotals.map((item) => (
                      <Cell key={item.category} fill={getCategoryPresentation(item.category).color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const amount = Number(value)
                      const percent = categoryTotal > 0 ? (amount / categoryTotal) * 100 : 0
                      const category = item.payload?.category ?? "分類"
                      return [`RM ${amount.toFixed(2)} (${percent.toFixed(1)}%)`, category]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground">總計</span>
                <span className="text-lg font-bold">RM {categoryTotal.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">{categoryTotals.length} 類別</span>
              </div>
            </div>

            <div className="space-y-2">
              {categoryTotals.map((item) => {
                const presentation = getCategoryPresentation(item.category)
                const Icon = presentation.icon
                const percent = categoryTotal > 0 ? (item.total / categoryTotal) * 100 : 0
                return (
                  <div
                    key={item.category}
                    className="flex items-center gap-3 rounded-md border bg-background/70 px-3 py-2"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: presentation.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">{item.category}</span>
                        <span className="font-mono text-sm font-semibold">
                          RM {item.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percent}%`, backgroundColor: presentation.color }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-xs text-muted-foreground">
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
