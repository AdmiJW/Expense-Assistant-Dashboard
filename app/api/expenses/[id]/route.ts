export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getExpenseById,
  updateExpense,
  deleteExpense,
  getAttachmentsByExpenseId,
} from "@/lib/db/expense-db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const expense = getExpenseById(id)
  if (!expense) return NextResponse.json({ error: "找不到記錄" }, { status: 404 })

  const attachments = getAttachmentsByExpenseId(id)
  return NextResponse.json({ ...expense, attachments })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed = ["amount", "category", "sub_category", "description", "remark", "date"]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] ?? null
  }
  if (updates.amount !== undefined) updates.amount = parseFloat(updates.amount as string)

  const expense = updateExpense(id, updates)
  if (!expense) return NextResponse.json({ error: "找不到記錄" }, { status: 404 })

  return NextResponse.json(expense)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  deleteExpense(id)
  return NextResponse.json({ ok: true })
}
