import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "super-admin-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (!superAdmin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = sign(
      {
        id: superAdmin.id,
        email: superAdmin.email,
        role: "SUPER_ADMIN"
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    )

    return NextResponse.json({
      token,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name
      }
    })
  } catch (error) {
    console.error("Super admin login failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
