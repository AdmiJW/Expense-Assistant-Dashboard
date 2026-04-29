"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paperclip, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Attachment {
  id: string
  original_filename: string
  mime_type: string
  remark: string | null
}

interface Props {
  attachments: Attachment[]
  onDeleted: (id: string) => void
}

export function AttachmentList({ attachments, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, filename: string) {
    if (!confirm(`確定要刪除附件「${filename}」嗎？此操作無法復原。`)) return
    setDeletingId(id)
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" })
    setDeletingId(null)
    if (!res.ok) {
      toast.error("刪除附件失敗")
      return
    }
    toast.success("已刪除附件")
    onDeleted(id)
  }

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">此筆記錄沒有附件</p>
    )
  }

  return (
    <ul className="space-y-2">
      {attachments.map((att) => (
        <li
          key={att.id}
          className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{att.original_filename}</span>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {att.mime_type.split("/")[1]?.toUpperCase() ?? att.mime_type}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              asChild
            >
              <a href={`/api/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={deletingId === att.id}
              onClick={() => handleDelete(att.id, att.original_filename)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
