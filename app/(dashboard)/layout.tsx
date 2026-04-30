import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, Wallet, X } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="relative flex h-screen overflow-hidden">
      <input id="mobile-sidebar-toggle" type="checkbox" className="peer sr-only" />

      <div className="hidden md:block">
        <Sidebar userName={session.user?.name} />
      </div>

      <label
        htmlFor="mobile-sidebar-toggle"
        className="fixed inset-0 z-40 hidden bg-black/45 backdrop-blur-sm peer-checked:block md:peer-checked:hidden"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] -translate-x-full transition-transform duration-200 peer-checked:translate-x-0 md:hidden">
        <div className="relative h-full">
          <label
            htmlFor="mobile-sidebar-toggle"
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="關閉選單"
          >
            <X className="h-4 w-4" />
          </label>
          <Sidebar userName={session.user?.name} />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto dashboard-bg">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:hidden">
          <label htmlFor="mobile-sidebar-toggle" aria-label="開啟選單">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
              <span>
                <Menu className="h-5 w-5" />
              </span>
            </Button>
          </label>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wallet className="h-4 w-4 text-primary" />
            支出追蹤
          </div>
          <div className="h-9 w-9" />
        </header>
        {children}
      </main>
    </div>
  )
}
