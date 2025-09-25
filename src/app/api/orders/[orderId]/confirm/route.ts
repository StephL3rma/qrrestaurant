import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPaymentLog } from "@/lib/paymentLogs"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // First, get the current order to check status and prevent double confirmation
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // PREVENT DOUBLE PAYMENT - Block if already confirmed/paid
    if (currentOrder.status === 'CONFIRMED' || currentOrder.status === 'PREPARING' ||
        currentOrder.status === 'READY' || currentOrder.status === 'DELIVERED') {

      await createPaymentLog({
        orderId,
        action: 'status_change',
        amount: currentOrder.total,
        paymentId: currentOrder.paymentId,
        previousStatus: currentOrder.status,
        newStatus: currentOrder.status, // No change
        metadata: {
          blockedAt: new Date().toISOString(),
          reason: 'Order already confirmed - double payment confirmation prevention',
          currentStatus: currentOrder.status,
          paymentMethod: currentOrder.paymentId?.startsWith('cash_') ? 'cash' : 'card'
        }
      })

      return NextResponse.json({
        error: "Order already confirmed. Payment has been processed.",
        status: currentOrder.status,
        message: "This order is already confirmed and cannot be changed."
      }, { status: 409 })
    }

    // Log the confirmation action
    await createPaymentLog({
      orderId,
      action: 'status_change',
      amount: currentOrder.total,
      paymentId: currentOrder.paymentId,
      previousStatus: currentOrder.status,
      newStatus: 'CONFIRMED',
      metadata: {
        confirmedAt: new Date().toISOString(),
        paymentMethod: currentOrder.paymentId?.startsWith('cash_') ? 'cash' : 'card',
        confirmedBy: 'stripe_webhook_or_success_page',
        previousStatus: currentOrder.status
      }
    })

    // Update order status to CONFIRMED
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
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

    // Here you could add webhook/notification logic to inform the restaurant
    // For now, we'll just return the updated order

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to confirm order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}