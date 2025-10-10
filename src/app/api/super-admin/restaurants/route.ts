import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// SUPER ADMIN EMAIL - Solo esta persona puede acceder
const SUPER_ADMIN_EMAIL = "stephllerma@icloud.com"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all restaurants with statistics
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        platformFeePercent: true,
        pricingTier: true,
        stripeOnboarded: true,
        createdAt: true,
        internalNotes: true,
        _count: {
          select: {
            orders: true,
            menuItems: true,
            tables: true
          }
        },
        orders: {
          where: {
            status: {
              in: ['DELIVERED', 'READY', 'PREPARING', 'CONFIRMED']
            }
          },
          select: {
            total: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate revenue and platform earnings for each restaurant
    const restaurantsWithStats = restaurants.map(restaurant => {
      const totalRevenue = restaurant.orders.reduce((sum, order) => sum + order.total, 0)
      const platformEarnings = totalRevenue * (restaurant.platformFeePercent / 100)

      return {
        ...restaurant,
        totalRevenue,
        platformEarnings,
        orders: undefined // Remove orders array from response
      }
    })

    return NextResponse.json(restaurantsWithStats)
  } catch (error) {
    console.error("Failed to fetch restaurants:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
