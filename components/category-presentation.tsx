"use client"

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
import { Badge } from "@/components/ui/badge"
import { EXPENSE_CATEGORIES, normalizeCategory } from "@/lib/categories"
import { cn } from "@/lib/utils"

interface CategoryPresentation {
  icon: LucideIcon
  color: string
  bg: string
  text: string
}

export const CATEGORY_PRESENTATION: Record<
  (typeof EXPENSE_CATEGORIES)[number],
  CategoryPresentation
> = {
  食物: { icon: Utensils, color: "#6366f1", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-300" },
  飲料: { icon: Coffee, color: "#0ea5e9", bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-300" },
  交通: { icon: Car, color: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300" },
  購物: { icon: ShoppingBag, color: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-300" },
  娛樂: { icon: Gamepad2, color: "#ec4899", bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-300" },
  居家: { icon: House, color: "#8b5cf6", bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-300" },
  數位產品: { icon: Smartphone, color: "#14b8a6", bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-300" },
  醫療: { icon: HeartPulse, color: "#ef4444", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-300" },
  旅行: { icon: Plane, color: "#3b82f6", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-300" },
  其他: { icon: CircleEllipsis, color: "#64748b", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-300" },
}

export function getCategoryPresentation(category: string): CategoryPresentation {
  const canonical = normalizeCategory(category)
  return (
    CATEGORY_PRESENTATION[canonical as keyof typeof CATEGORY_PRESENTATION] ?? {
      icon: CircleEllipsis,
      color: "#64748b",
      bg: "bg-slate-500/10",
      text: "text-slate-600 dark:text-slate-300",
    }
  )
}

export function CategoryBadge({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  const presentation = getCategoryPresentation(category)
  const Icon = presentation.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit gap-1 border-transparent px-2 py-0.5",
        presentation.bg,
        presentation.text,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {category}
    </Badge>
  )
}
