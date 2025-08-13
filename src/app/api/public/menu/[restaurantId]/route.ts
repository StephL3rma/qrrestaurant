import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: params.restaurantId,
        available: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error("Failed to fetch menu items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}