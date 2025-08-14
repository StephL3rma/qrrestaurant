import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tables = await prisma.table.findMany({
      where: {
        restaurantId: session.user.id
      },
      orderBy: {
        number: 'asc'
      }
    })

    return NextResponse.json(tables)
  } catch (error) {
    console.error("Failed to fetch tables:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { number, capacity } = await request.json()

    if (!number) {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 })
    }

    // Generate unique QR code string
    const qrCode = `${process.env.NEXTAUTH_URL}/menu/${session.user.id}/${number}`

    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: capacity ? parseInt(capacity) : null,
        qrCode,
        restaurantId: session.user.id
      }
    })

    return NextResponse.json(table)
  } catch (error: unknown) {
    console.error("Failed to create table:", error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: "Table number already exists" }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}