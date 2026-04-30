"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { EXPENSE_CATEGORIES, normalizeCategory } from "@/lib/categories"
import { getCategoryPresentation } from "@/components/category-presentation"

interface Expense {
  id: string
  amount: number
  category: string
  sub_category: string | null
  description: string
  remark: string | null
  date: string
}

interface Props {
  expense?: Expense
  timezone: string
  onSuccess: () => void
  onCancel: () => void
}

const schema = z.object({
  amount: z.string().min(1, "必填").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "請輸入有效金額"),
  date: z.string().min(1, "必填"),
  category: z.enum(EXPENSE_CATEGORIES, { error: "請選擇類別" }),
  sub_category: z.string().optional(),
  description: z.string().min(1, "必填"),
  remark: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function toLocalDatetimeValue(utcIso: string, tz: string): string {
  return formatInTimeZone(new Date(utcIso), tz, "yyyy-MM-dd'T'HH:mm")
}

export function ExpenseForm({ expense, timezone, onSuccess, onCancel }: Props) {
  const isEdit = !!expense

  const defaultDatetime = expense
    ? toLocalDatetimeValue(expense.date, timezone)
    : formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm")

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: expense ? String(expense.amount) : "",
      date: defaultDatetime,
      category: expense
        ? (normalizeCategory(expense.category) as (typeof EXPENSE_CATEGORIES)[number])
        : undefined,
      sub_category: expense?.sub_category ?? "",
      description: expense?.description ?? "",
      remark: expense?.remark ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    const utcDate = fromZonedTime(values.date, timezone).toISOString()

    const body = {
      amount: values.amount,
      category: values.category,
      sub_category: values.sub_category || null,
      description: values.description,
      remark: values.remark || null,
      date: utcDate,
    }

    const url = isEdit ? `/api/expenses/${expense.id}` : "/api/expenses"
    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "操作失敗")
      return
    }

    toast.success(isEdit ? "已更新支出記錄" : "已新增支出記錄")
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">金額 (RM) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...register("amount")}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">日期時間 *</Label>
          <Input
            id="date"
            type="datetime-local"
            {...register("date")}
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>類別 *</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇類別…" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const Icon = getCategoryPresentation(cat).icon
                    return (
                      <SelectItem key={cat} value={cat}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {cat}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sub_category">子類別</Label>
          <Input
            id="sub_category"
            placeholder="選填"
            {...register("sub_category")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">說明 *</Label>
        <Input
          id="description"
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remark">備註</Label>
        <Input
          id="remark"
          placeholder="選填"
          {...register("remark")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "儲存中…" : isEdit ? "更新" : "新增"}
        </Button>
      </div>
    </form>
  )
}
