import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 LOGIN ATTEMPT:", {
          email: credentials?.email,
          passwordLength: credentials?.password?.length
        })

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        console.log("🔍 Searching for restaurant with email:", credentials.email)

        let restaurant
        try {
          restaurant = await prisma.restaurant.findUnique({
            where: {
              email: credentials.email
            }
          })
          console.log("🔍 Prisma query completed successfully")
        } catch (error) {
          console.error("💥 Prisma query failed:", error)
          return null
        }

        if (!restaurant) {
          console.log("❌ Restaurant not found for email:", credentials.email)
          return null
        }

        console.log("✅ Restaurant found:", {
          id: restaurant.id,
          name: restaurant.name,
          email: restaurant.email,
          hashedPassword: restaurant.password.substring(0, 20) + "..."
        })

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          restaurant.password
        )

        console.log("🔑 Password comparison:", {
          inputPassword: credentials.password,
          isValid: isPasswordValid
        })

        if (!isPasswordValid) {
          console.log("❌ Invalid password")
          return null
        }

        return {
          id: restaurant.id,
          email: restaurant.email,
          name: restaurant.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}