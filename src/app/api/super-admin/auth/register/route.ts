import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Esta ruta está disponible SOLO para crear el primer super admin
// Después deberías comentar/eliminar esta ruta por seguridad

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      )
    }

    // Check if super admin already exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Super admin already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create super admin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    return NextResponse.json({
      message: "Super admin created successfully",
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name
      }
    })
  } catch (error) {
    console.error("Failed to create super admin:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
