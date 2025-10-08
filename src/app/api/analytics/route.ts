import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const period = searchParams.get("period") || "month" // day, week, month, year

    // Determine date range
    let start: Date
    let end: Date = new Date()

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      switch (period) {
        case "day":
          start = startOfDay(new Date())
          end = endOfDay(new Date())
          break
        case "week":
          start = subDays(new Date(), 7)
          break
        case "month":
          start = startOfMonth(new Date())
          end = endOfMonth(new Date())
          break
        case "year":
          start = subMonths(new Date(), 12)
          break
        default:
          start = startOfMonth(new Date())
      }
    }

    // Get all orders in date range
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.id,
        createdAt: {
          gte: start,
          lte: end
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

    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Revenue by day
    const revenueByDay: { [key: string]: number } = {}
    const ordersByDay: { [key: string]: number } = {}

    orders.forEach(order => {
      const day = format(new Date(order.createdAt), 'yyyy-MM-dd')
      revenueByDay[day] = (revenueByDay[day] || 0) + order.total
      ordersByDay[day] = (ordersByDay[day] || 0) + 1
    })

    // Revenue by hour
    const revenueByHour: { [key: number]: number } = {}
    const ordersByHour: { [key: number]: number } = {}

    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours()
      revenueByHour[hour] = (revenueByHour[hour] || 0) + order.total
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1
    })

    // Best selling items
    const itemSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {}

    orders.forEach(order => {
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

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        restaurantId: session.user.id,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: true
    })

    // Peak hours (hours with most orders)
    const peakHours = Object.entries(ordersByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: parseInt(hour), orders: count }))

    // Best days (days with most revenue)
    const bestDays = Object.entries(revenueByDay)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([date, revenue]) => ({ date, revenue, orders: ordersByDay[date] }))

    // Revenue trend (daily)
    const revenueTrend = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        revenue,
        orders: ordersByDay[date]
      }))

    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: ordersByHour[i] || 0,
      revenue: revenueByHour[i] || 0
    }))

    // Tables performance
    const tablePerformance = await prisma.order.groupBy({
      by: ['tableNumber'],
      where: {
        restaurantId: session.user.id,
        createdAt: {
          gte: start,
          lte: end
        },
        tableNumber: {
          not: null
        }
      },
      _count: true,
      _sum: {
        total: true
      }
    })

    const tableStats = tablePerformance
      .filter(t => t.tableNumber !== null)
      .map(t => ({
        tableNumber: t.tableNumber,
        orders: t._count,
        revenue: t._sum.total || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Calculate growth compared to previous period
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = subDays(start, periodDays)
    const previousEnd = subDays(end, periodDays)

    const previousOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.id,
        createdAt: {
          gte: previousStart,
          lte: previousEnd
        },
        status: {
          in: ['DELIVERED', 'READY', 'PREPARING', 'CONFIRMED']
        }
      }
    })

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const ordersGrowth = previousOrders.length > 0
      ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100
      : 0

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalOrders,
        totalRevenue,
        averageTicket,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10
      },
      revenueTrend,
      hourlyDistribution,
      topItems,
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s._count
      })),
      peakHours,
      bestDays,
      tableStats
    })
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
