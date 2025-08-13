import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: params.restaurantId
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