import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <DashboardShell />
}
