export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth, isDemoSession } from "@/auth"
import {
  getExpenseById,
  updateExpense,
  deleteExpense,
  getAttachmentsByExpenseId,
} from "@/lib/db/expense-db"
import { getDemoAttachmentsByExpenseId, getDemoExpenseById } from "@/lib/demo-data"
import { DEMO_WRITE_ERROR } from "@/lib/demo-constants"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (isDemoSession(session)) {
    const expense = getDemoExpenseById(id)
    if (!expense) return NextResponse.json({ error: "找不到記錄" }, { status: 404 })
    return NextResponse.json({
      ...expense,
      attachments: getDemoAttachmentsByExpenseId(id),
    })
  }

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
  if (isDemoSession(session)) {
    return NextResponse.json({ error: DEMO_WRITE_ERROR }, { status: 403 })
  }

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
  if (isDemoSession(session)) {
    return NextResponse.json({ error: DEMO_WRITE_ERROR }, { status: 403 })
  }

  const { id } = await params
  deleteExpense(id)
  return NextResponse.json({ ok: true })
}
