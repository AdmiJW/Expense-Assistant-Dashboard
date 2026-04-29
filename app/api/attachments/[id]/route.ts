export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAttachmentById, deleteAttachmentRow } from "@/lib/db/expense-db"
import { getAttachmentsDirPath } from "@/lib/paths"
import fs from "fs"
import path from "path"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const attachment = getAttachmentById(id)
  if (!attachment) return NextResponse.json({ error: "找不到附件" }, { status: 404 })

  const relativePath = attachment.file_path.replace(/^attachments[\\/]/, "")
  const filePath = path.join(getAttachmentsDirPath(), relativePath)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "檔案不存在" }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filePath)
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.original_filename)}"`,
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const attachment = getAttachmentById(id)
  if (!attachment) return NextResponse.json({ error: "找不到附件" }, { status: 404 })

  const relativePath = attachment.file_path.replace(/^attachments[\\/]/, "")
  const filePath = path.join(getAttachmentsDirPath(), relativePath)

  deleteAttachmentRow(id)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  return NextResponse.json({ ok: true })
}
