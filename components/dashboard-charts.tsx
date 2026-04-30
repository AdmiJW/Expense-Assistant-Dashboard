"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Car,
  CircleEllipsis,
  Coffee,
  Gamepad2,
  HeartPulse,
  House,
  Plane,
  ShoppingBag,
  Smartphone,
  Utensils,
  type LucideIcon,
} from "lucide-react"
import { EXPENSE_CATEGORIES } from "@/lib/categories"
import { formatChineseDate, formatCompactChineseDate } from "@/lib/date-format"

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
  "#a3e635",
]

const CATEGORY_ICONS: Record<(typeof EXPENSE_CATEGORIES)[number], LucideIcon> = {
  食物: Utensils,
  飲料: Coffee,
  交通: Car,
  購物: ShoppingBag,
  娛樂: Gamepad2,
  居家: House,
  數位產品: Smartphone,
  醫療: HeartPulse,
  旅行: Plane,
  其他: CircleEllipsis,
}

interface DailyTotal {
  day: string
  total: number
}

interface CategoryTotal {
  category: string
  total: number
}

interface Props {
  dailyTotals: DailyTotal[]
  categoryTotals: CategoryTotal[]
  rangeLabel?: string
}

export function DashboardCharts({ dailyTotals, categoryTotals, rangeLabel }: Props) {
  const dayCount = dailyTotals.length
  const tickInterval = dayCount <= 7 ? 0 : dayCount <= 14 ? 1 : 4
  const categoryTotal = categoryTotals.reduce((sum, item) => sum + item.total, 0)

  function getCategoryIcon(category: string) {
    return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? CircleEllipsis
  }

  function getCategoryColor(index: number) {
    return COLORS[index % COLORS.length]
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
          {rangeLabel ? `每日支出 · ${rangeLabel}` : "近 30 天每日支出"}
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyTotals} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) => formatCompactChineseDate(value)}
              interval={tickInterval}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `RM${value}`} />
            <Tooltip
              formatter={(value) => [`RM ${Number(value).toFixed(2)}`, "支出"]}
              labelFormatter={(label) => `日期：${formatChineseDate(String(label))}`}
            />
            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
          {rangeLabel ? `支出分類 · ${rangeLabel}` : "本月支出分類"}
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
                    {categoryTotals.map((_, index) => (
                      <Cell key={index} fill={getCategoryColor(index)} />
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
              {categoryTotals.map((item, index) => {
                const Icon = getCategoryIcon(item.category)
                const percent = categoryTotal > 0 ? (item.total / categoryTotal) * 100 : 0
                return (
                  <div
                    key={item.category}
                    className="flex items-center gap-3 rounded-md border bg-background/70 px-3 py-2"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: getCategoryColor(index) }}
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
                          style={{
                            width: `${percent}%`,
                            backgroundColor: getCategoryColor(index),
                          }}
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
