import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, tableNumber, customerName, orderItems, total, deviceId } = await request.json()

    if (!restaurantId || !tableNumber || !customerName || !orderItems || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find the table
    const table = await prisma.table.findFirst({
      where: {
        restaurantId,
        number: parseInt(tableNumber)
      }
    })

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Create the order with order items
    const order = await prisma.order.create({
      data: {
        customerName,
        total: parseFloat(total),
        status: 'PENDING',
        restaurantId,
        tableId: table.id,
        deviceId: deviceId || null, // Store device ID for tracking
        orderItems: {
          create: orderItems.map((item: {quantity: number, price: string, menuItemId: string}) => ({
            quantity: item.quantity,
            price: parseFloat(item.price),
            menuItemId: item.menuItemId
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to create order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}