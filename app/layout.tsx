import type { Metadata } from "next"
import { Noto_Sans_TC, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeColorProvider } from "@/components/theme-color-provider"

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "個人支出追蹤儀表板",
  description: "個人支出追蹤與管理系統",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSansTC.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ThemeColorProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeColorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
