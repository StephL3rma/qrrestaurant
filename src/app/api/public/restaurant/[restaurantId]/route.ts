import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Failed to fetch restaurant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}