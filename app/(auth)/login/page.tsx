"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  async function completeSignIn(username: string, password: string) {
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      toast.error("使用者名稱或密碼錯誤")
      return
    }

    router.push("/")
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const username = (form.elements.namedItem("username") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    await completeSignIn(username, password)
    setLoading(false)
  }

  async function handleDemoSignIn() {
    setDemoLoading(true)
    await completeSignIn("demo", "demo123")
    setDemoLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">支出追蹤系統</CardTitle>
          <CardDescription>請登入以繼續</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">使用者名稱</Label>
              <Input id="username" name="username" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading || demoLoading}>
              {loading ? "登入中..." : "登入"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || demoLoading}
              onClick={handleDemoSignIn}
            >
              {demoLoading ? "進入展示帳號中..." : "使用展示帳號"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
