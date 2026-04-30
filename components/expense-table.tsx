"use client"

import { useState, useCallback, useEffect } from "react"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExpenseForm } from "@/components/expense-form"
import { AttachmentList } from "@/components/attachment-list"
import { toast } from "sonner"
import {
  Plus, MoreHorizontal, Pencil, Trash2, Paperclip, Search,
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
} from "lucide-react"
import { EXPENSE_CATEGORIES } from "@/lib/categories"

interface Attachment {
  id: string
  original_filename: string
  mime_type: string
  remark: string | null
}

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
  timezone: string
}

const PAGE_SIZE = 20

export function ExpenseTable({ timezone }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Search / universal filter
  const [searchInput, setSearchInput] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")

  // Advanced filter — draft state (what's shown in the panel)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftDateFrom, setDraftDateFrom] = useState("")
  const [draftDateTo, setDraftDateTo] = useState("")
  const [draftCategory, setDraftCategory] = useState("all")
  const [draftMinAmount, setDraftMinAmount] = useState("")
  const [draftMaxAmount, setDraftMaxAmount] = useState("")

  // Applied state (what's actually sent to API)
  const [appliedDateFrom, setAppliedDateFrom] = useState("")
  const [appliedDateTo, setAppliedDateTo] = useState("")
  const [appliedCategory, setAppliedCategory] = useState("all")
  const [appliedMinAmount, setAppliedMinAmount] = useState("")
  const [appliedMaxAmount, setAppliedMaxAmount] = useState("")

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [viewAttachmentsExpense, setViewAttachmentsExpense] = useState<Expense | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  const activeFilterCount = [
    appliedDateFrom || appliedDateTo,
    appliedCategory !== "all",
    appliedMinAmount || appliedMaxAmount,
  ].filter(Boolean).length

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (appliedSearch) params.set("search", appliedSearch)
    if (appliedDateFrom) params.set("dateFrom", fromZonedTime(appliedDateFrom + "T00:00:00", timezone).toISOString())
    if (appliedDateTo)   params.set("dateTo",   fromZonedTime(appliedDateTo + "T23:59:59", timezone).toISOString())
    if (appliedCategory !== "all") params.set("category", appliedCategory)
    if (appliedMinAmount) params.set("minAmount", appliedMinAmount)
    if (appliedMaxAmount) params.set("maxAmount", appliedMaxAmount)
    const res = await fetch(`/api/expenses?${params}`)
    if (res.ok) {
      const data = await res.json()
      setExpenses(data.rows)
      setTotal(data.total)
    }
    setLoading(false)
  }, [page, appliedSearch, appliedDateFrom, appliedDateTo, appliedCategory, appliedMinAmount, appliedMaxAmount, timezone])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses()
  }, [fetchExpenses])

  async function openAttachments(expense: Expense) {
    setViewAttachmentsExpense(expense)
    const res = await fetch(`/api/expenses/${expense.id}`)
    if (res.ok) {
      const data = await res.json()
      setAttachments(data.attachments ?? [])
    }
  }

  async function handleDelete(expense: Expense) {
    setDeleting(true)
    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" })
    setDeleting(false)
    setDeleteTarget(null)
    if (!res.ok) { toast.error("刪除失敗"); return }
    toast.success("已刪除支出記錄")
    fetchExpenses()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setAppliedSearch(searchInput)
  }

  function applyFilters() {
    setPage(1)
    setAppliedDateFrom(draftDateFrom)
    setAppliedDateTo(draftDateTo)
    setAppliedCategory(draftCategory)
    setAppliedMinAmount(draftMinAmount)
    setAppliedMaxAmount(draftMaxAmount)
  }

  function clearFilters() {
    setDraftDateFrom(""); setDraftDateTo("")
    setDraftCategory("all"); setDraftMinAmount(""); setDraftMaxAmount("")
    setAppliedDateFrom(""); setAppliedDateTo("")
    setAppliedCategory("all"); setAppliedMinAmount(""); setAppliedMaxAmount("")
    setPage(1)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function formatDate(utcIso: string) {
    return formatInTimeZone(new Date(utcIso), timezone, "yyyy/MM/dd HH:mm")
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="搜尋類別、說明…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button type="submit" size="icon" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={filtersOpen || activeFilterCount > 0 ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              篩選
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </form>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            新增支出
          </Button>
        </div>

        {/* Advanced filter panel */}
        {filtersOpen && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">開始日期</label>
                <Input
                  type="date"
                  value={draftDateFrom}
                  onChange={(e) => setDraftDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">結束日期</label>
                <Input
                  type="date"
                  value={draftDateTo}
                  onChange={(e) => setDraftDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">類別</label>
                <Select value={draftCategory} onValueChange={setDraftCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部類別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部類別</SelectItem>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">金額範圍 (RM)</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="最小"
                    value={draftMinAmount}
                    onChange={(e) => setDraftMinAmount(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="最大"
                    value={draftMaxAmount}
                    onChange={(e) => setDraftMaxAmount(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" />
                清除篩選
              </Button>
              <Button type="button" size="sm" onClick={applyFilters}>
                套用篩選
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>類別</TableHead>
              <TableHead>說明</TableHead>
              <TableHead className="text-right">金額 (RM)</TableHead>
              <TableHead>備註</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  載入中…
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {appliedSearch || activeFilterCount > 0 ? "找不到符合的記錄" : "尚無支出記錄"}
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(exp.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="outline" className="w-fit text-xs">{exp.category}</Badge>
                      {exp.sub_category && (
                        <span className="text-xs text-muted-foreground">{exp.sub_category}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-50 truncate text-sm">
                    {exp.description}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {exp.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-37.5 truncate text-sm text-muted-foreground">
                    {exp.remark ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAttachments(exp)}>
                          <Paperclip className="h-3.5 w-3.5 mr-2" />
                          查看附件
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditExpense(exp)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          編輯
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(exp)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {total} 筆{totalPages > 1 ? `，第 ${page} / ${totalPages} 頁` : ""}</span>
        {totalPages > 1 && (
          <div className="flex gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新增支出</DialogTitle></DialogHeader>
          <ExpenseForm
            timezone={timezone}
            onSuccess={() => { setCreateOpen(false); fetchExpenses() }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editExpense} onOpenChange={(o) => !o && setEditExpense(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>編輯支出</DialogTitle></DialogHeader>
          {editExpense && (
            <ExpenseForm
              expense={editExpense}
              timezone={timezone}
              onSuccess={() => { setEditExpense(null); fetchExpenses() }}
              onCancel={() => setEditExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Attachments Dialog */}
      <Dialog open={!!viewAttachmentsExpense} onOpenChange={(o) => !o && setViewAttachmentsExpense(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>附件清單</DialogTitle></DialogHeader>
          {viewAttachmentsExpense && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{viewAttachmentsExpense.description}</p>
              <AttachmentList
                attachments={attachments}
                onDeleted={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>確認刪除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            確定要刪除此筆支出記錄嗎？相關附件也將一併刪除，此操作無法復原。
          </p>
          {deleteTarget && (
            <p className="text-sm font-medium">{deleteTarget.description} — RM {deleteTarget.amount.toFixed(2)}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" disabled={deleting} onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              {deleting ? "刪除中…" : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
