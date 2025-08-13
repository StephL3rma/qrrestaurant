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

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.id,
        // Only show orders from today
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      include: {
        table: {
          select: {
            number: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Failed to fetch restaurant orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}