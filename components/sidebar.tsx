import { signOut } from "@/auth"
import Link from "next/link"
import { LayoutDashboard, Receipt, Settings, LogOut, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

interface Props {
  userName?: string | null
}

export function Sidebar({ userName }: Props) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col sidebar-bg border-r border-sidebar-border">
      {/* Logo / title */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">支出追蹤</h1>
          <p className="text-xs text-sidebar-foreground/50 truncate max-w-[120px]">{userName ?? "用戶"}</p>
        </div>
      </div>
      <Separator className="bg-sidebar-border/50" />

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard className="h-4 w-4" />} label="儀表板" />
        <NavItem href="/expenses" icon={<Receipt className="h-4 w-4" />} label="支出帳本" />
        <NavItem href="/settings" icon={<Settings className="h-4 w-4" />} label="設定" />
      </nav>

      <Separator className="bg-sidebar-border/50" />

      {/* Bottom: theme toggle + logout */}
      <div className="px-3 py-3 flex items-center justify-between">
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            className="gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground text-sm"
          >
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </form>
        <ThemeToggle />
      </div>
    </aside>
  )
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
    >
      {icon}
      {label}
    </Link>
  )
}
