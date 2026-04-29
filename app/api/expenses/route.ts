export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getExpenses, createExpense } from "@/lib/db/expense-db"
import { EXPENSE_CATEGORIES } from "@/lib/categories"
import { randomUUID } from "crypto"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
  const search = searchParams.get("search") ?? undefined
  const dateFrom = searchParams.get("dateFrom") ?? undefined
  const dateTo = searchParams.get("dateTo") ?? undefined
  const category = searchParams.get("category") ?? undefined
  const minAmount = searchParams.get("minAmount") ? parseFloat(searchParams.get("minAmount")!) : undefined
  const maxAmount = searchParams.get("maxAmount") ? parseFloat(searchParams.get("maxAmount")!) : undefined

  const { rows, total } = getExpenses(page, limit, { search, dateFrom, dateTo, category, minAmount, maxAmount })
  return NextResponse.json({ rows, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { amount, category, sub_category, description, remark, date } = body

  if (!amount || !category || !description || !date) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 })
  }

  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "無效的支出類別" }, { status: 400 })
  }

  const expense = createExpense({
    id: randomUUID(),
    amount: parseFloat(amount),
    category,
    sub_category: sub_category || null,
    description,
    remark: remark || null,
    date,
  })

  return NextResponse.json(expense, { status: 201 })
}
