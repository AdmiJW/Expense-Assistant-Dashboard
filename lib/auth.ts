import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { findUserByUsername } from "@/lib/db/auth-db"
import { DEMO_PASSWORD, DEMO_USERNAME } from "@/lib/demo-constants"

export function isDemoSession(
  session: { user?: { isDemo?: boolean } } | null | undefined
): boolean {
  return Boolean(session?.user?.isDemo)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/auth",
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "使用者名稱", type: "text" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        if (
          credentials.username === DEMO_USERNAME &&
          credentials.password === DEMO_PASSWORD
        ) {
          return { id: "demo-user", name: DEMO_USERNAME, isDemo: true }
        }

        const user = findUserByUsername(credentials.username as string)
        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.hashed_password
        )
        if (!valid) return null

        return { id: user.id, name: user.username }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isDemo = Boolean(user.isDemo)
      }
      return token
    },
    async session({ session, token }) {
      session.user.isDemo = Boolean(token.isDemo)
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`

      try {
        const redirectUrl = new URL(url)
        if (redirectUrl.origin === baseUrl) return url
      } catch {
        return baseUrl
      }

      return baseUrl
    },
  },
})
