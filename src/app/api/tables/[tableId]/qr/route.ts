import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId: session.user.id
      }
    })

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(table.qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      url: table.qrCode,
      tableNumber: table.number
    })
  } catch (error) {
    console.error("Failed to generate QR code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}