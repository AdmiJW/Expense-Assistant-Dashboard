export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth, isDemoSession } from "@/auth"
import { findUserByUsername, updateUserPassword } from "@/lib/db/auth-db"
import { DEMO_WRITE_ERROR } from "@/lib/demo-constants"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (isDemoSession(session)) {
    return NextResponse.json({ error: DEMO_WRITE_ERROR }, { status: 403 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新密碼至少需要 6 個字元" }, { status: 400 })
  }

  const username = session.user?.name as string
  const user = findUserByUsername(username)
  if (!user) return NextResponse.json({ error: "使用者不存在" }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.hashed_password)
  if (!valid) return NextResponse.json({ error: "目前密碼不正確" }, { status: 400 })

  const hashed = await bcrypt.hash(newPassword, 10)
  updateUserPassword(user.id, hashed)

  return NextResponse.json({ ok: true })
}
