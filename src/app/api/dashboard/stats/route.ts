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
    const [menuItemsCount, tablesCount, todaysOrdersCount, todaysOrders] = await Promise.all([
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
      }),

      // Get today's orders with items for revenue and best seller
      prisma.order.findMany({
        where: {
          restaurantId: restaurantId,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          status: {
            in: ['DELIVERED', 'READY', 'PREPARING', 'CONFIRMED']
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      })
    ])

    // Calculate today's revenue
    const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0)

    // Calculate average ticket
    const averageTicket = todaysOrdersCount > 0 ? todaysRevenue / todaysOrdersCount : 0

    // Find best selling item today
    const itemSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {}

    todaysOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!itemSales[item.menuItemId]) {
          itemSales[item.menuItemId] = {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0
          }
        }
        itemSales[item.menuItemId].quantity += item.quantity
        itemSales[item.menuItemId].revenue += item.price * item.quantity
      })
    })

    const bestSellingItem = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)[0] || { name: 'No sales yet', quantity: 0, revenue: 0 }

    return NextResponse.json({
      menuItemsCount,
      tablesCount,
      todaysOrdersCount,
      todaysRevenue,
      averageTicket,
      bestSellingItem
    })
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}