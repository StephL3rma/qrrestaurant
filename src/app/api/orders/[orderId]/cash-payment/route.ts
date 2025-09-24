import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Update order to indicate pending cash payment
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING_CASH_PAYMENT', // Waiting for restaurant confirmation
        paymentId: 'cash_payment_' + Date.now() // Mark as cash payment
      },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Order confirmed for cash payment"
    })
  } catch (error) {
    console.error("Failed to process cash payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}