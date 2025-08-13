import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: { status: "CONFIRMED" },
      include: {
        restaurant: {
          select: {
            name: true
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
      }
    })

    // Here you could add webhook/notification logic to inform the restaurant
    // For now, we'll just return the updated order
    
    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to confirm order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}