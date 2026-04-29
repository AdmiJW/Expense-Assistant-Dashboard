import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { findUserByUsername } from "@/lib/db/auth-db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "使用者名稱", type: "text" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

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
})
