"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#3b82f6", "#a3e635",
]

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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">
          {rangeLabel ? `每日支出 · ${rangeLabel}` : "近 30 天每日支出"}
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyTotals} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
              interval={tickInterval}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `RM${v}`} />
            <Tooltip
              formatter={(value) => [`RM ${Number(value).toFixed(2)}`, "支出"]}
              labelFormatter={(label) => `日期：${label}`}
            />
            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">
          {rangeLabel ? `支出分類 · ${rangeLabel}` : "本月支出分類"}
        </h2>
        {categoryTotals.length === 0 ? (
          <div className="flex items-center justify-center h-65 text-muted-foreground text-sm">
            此期間暫無支出記錄
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryTotals}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="total"
                nameKey="category"
                label={false}
                labelLine={false}
              >
                {categoryTotals.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `RM ${Number(value).toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
