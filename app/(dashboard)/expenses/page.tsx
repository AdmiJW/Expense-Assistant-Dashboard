import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DISPLAY_TIMEZONE } from "@/lib/timezone"
import { ExpenseTable } from "@/components/expense-table"

export default async function ExpensesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">支出帳本</h1>
        <p className="text-sm text-muted-foreground mt-1">
          顯示時區：{DISPLAY_TIMEZONE}
        </p>
      </div>
      <ExpenseTable timezone={DISPLAY_TIMEZONE} />
    </div>
  )
}
