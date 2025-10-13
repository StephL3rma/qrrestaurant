import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "super-admin-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; email: string; role: string }
    if (decoded.role !== "SUPER_ADMIN") {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = verifyToken(request)
    if (!admin) {
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
