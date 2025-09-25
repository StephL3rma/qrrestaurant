import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPaymentLog } from "@/lib/paymentLogs"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // First, get the current order to log the change
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // PREVENT DOUBLE PAYMENT - Block if already paid/confirmed
    if (currentOrder.status === 'CONFIRMED' || currentOrder.status === 'PREPARING' ||
        currentOrder.status === 'READY' || currentOrder.status === 'DELIVERED') {

      await createPaymentLog({
        orderId,
        action: 'back_to_payment',
        amount: currentOrder.total,
        previousStatus: currentOrder.status,
        newStatus: currentOrder.status, // No change
        metadata: {
          blockedAt: new Date().toISOString(),
          reason: 'Payment already confirmed - double payment prevention',
          currentStatus: currentOrder.status
        }
      })

      return NextResponse.json({
        error: "Payment already confirmed. Cannot change payment method.",
        status: currentOrder.status,
        message: "This order is already being processed by the restaurant."
      }, { status: 409 })
    }

    // Log the cash payment selection
    await createPaymentLog({
      orderId,
      action: 'cash_selected',
      amount: currentOrder.total,
      previousStatus: currentOrder.status,
      newStatus: 'PENDING_CASH_PAYMENT',
      metadata: {
        selectedAt: new Date().toISOString(),
        customerAction: 'selected_cash_payment'
      }
    })

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