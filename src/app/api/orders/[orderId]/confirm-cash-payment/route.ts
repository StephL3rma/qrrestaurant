import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await params

    // Verify the order belongs to the authenticated restaurant and is pending cash payment
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: session.user.id,
        status: 'PENDING_CASH_PAYMENT'
      }
    })

    if (!existingOrder) {
      return NextResponse.json({
        error: "Order not found or not pending cash payment"
      }, { status: 404 })
    }

    // Confirm the cash payment - move to CONFIRMED status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED', // Kitchen can now start preparing
        updatedAt: new Date()
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

    return NextResponse.json({
      success: true,
      order,
      message: "Cash payment confirmed successfully"
    })
  } catch (error) {
    console.error("Failed to confirm cash payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}