"use client"

import { useState } from "react"
import { Check, Globe, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useThemeColor } from "@/components/theme-color-provider"
import { THEME_COLORS } from "@/lib/theme-colors"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const DISPLAY_TIMEZONE = process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE ?? "Asia/Kuala_Lumpur"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const { color, setColor } = useThemeColor()

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement).value

    const currentPassword = getValue("currentPassword")
    const newPassword = getValue("newPassword")
    const confirmPassword = getValue("confirmPassword")

    if (newPassword !== confirmPassword) {
      toast.error("新密碼與確認密碼不一致")
      setLoading(false)
      return
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    setLoading(false)

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "更新失敗")
      return
    }

    toast.success("密碼已成功更新")
    form.reset()
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理帳號與系統設定</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            主題色彩
          </CardTitle>
          <CardDescription>選擇介面的主要強調色，會保存在目前瀏覽器。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEME_COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setColor(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm transition hover:bg-accent",
                  color === item.id && "border-primary ring-2 ring-ring/30"
                )}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: item.swatch }}
                >
                  {color === item.id && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            顯示時區
          </CardTitle>
          <CardDescription>系統目前使用以下時區顯示所有日期與時間。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
            <span className="font-mono text-sm font-medium">{DISPLAY_TIMEZONE}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            如需更改時區，請修改 <code className="font-mono">.env.local</code> 中的{" "}
            <code className="font-mono">DISPLAY_TIMEZONE</code> 環境變數後重新啟動伺服器。
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">修改密碼</CardTitle>
          <CardDescription>請確保新密碼至少 6 個字元。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">目前密碼</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">新密碼</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">確認新密碼</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "更新中..." : "更新密碼"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
