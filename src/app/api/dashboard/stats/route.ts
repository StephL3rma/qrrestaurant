import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const restaurantId = session.user.id

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch all stats in parallel
    const [menuItemsCount, tablesCount, todaysOrdersCount] = await Promise.all([
      // Count menu items for this restaurant
      prisma.menuItem.count({
        where: {
          restaurantId: restaurantId
        }
      }),

      // Count tables for this restaurant
      prisma.table.count({
        where: {
          restaurantId: restaurantId
        }
      }),

      // Count today's orders for this restaurant
      prisma.order.count({
        where: {
          restaurantId: restaurantId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ])

    return NextResponse.json({
      menuItemsCount,
      tablesCount,
      todaysOrdersCount
    })
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}