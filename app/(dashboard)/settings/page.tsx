"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Globe } from "lucide-react"

const DISPLAY_TIMEZONE = process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE ?? "Asia/Kuala_Lumpur"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)

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
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground mt-1">管理帳號與系統設定</p>
      </div>

      {/* Timezone info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            顯示時區
          </CardTitle>
          <CardDescription>
            系統目前使用以下時區顯示所有日期與時間
          </CardDescription>
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

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">修改密碼</CardTitle>
          <CardDescription>請確保新密碼至少 6 個字元</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">目前密碼</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">新密碼</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">確認新密碼</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "更新中…" : "更新密碼"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
