import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const tableNumber = searchParams.get('tableNumber')

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Find orders for this device at this restaurant/table
    const whereClause: any = {
      deviceId: deviceId,
    }

    // Optionally filter by restaurant and table
    if (restaurantId) {
      whereClause.restaurantId = restaurantId
    }

    if (tableNumber) {
      whereClause.table = {
        number: parseInt(tableNumber)
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            name: true
          }
        },
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
    console.error("Failed to fetch orders by device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}