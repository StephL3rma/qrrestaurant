import { NextRequest, NextResponse } from "next/server"
import { getServerStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { createPaymentLog } from "@/lib/paymentLogs"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            stripeAccountId: true,
            stripeOnboarded: true,
            platformFeePercent: true
          }
        },
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const totalAmount = Math.round(order.total * 100)
    const stripe = getServerStripe()

    // Check if restaurant has Stripe Connect set up
    if (!order.restaurant.stripeAccountId || !order.restaurant.stripeOnboarded) {
      // Create a simple payment intent for testing (money goes directly to platform)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {
          orderId: order.id,
          restaurantId: order.restaurantId,
          customerName: order.customerName || "Anonymous",
          restaurantName: order.restaurant.name,
          paymentType: "direct" // Indicates this is not using Stripe Connect
        }
      })

      // Log the card payment creation (direct payment)
      await createPaymentLog({
        orderId,
        action: 'card_payment',
        amount: order.total,
        paymentId: paymentIntent.id,
        previousStatus: order.status,
        newStatus: order.status, // No status change yet
        metadata: {
          paymentIntentCreated: new Date().toISOString(),
          paymentType: 'direct',
          platformFee: 0,
          stripePaymentIntentId: paymentIntent.id,
          note: 'Restaurant not onboarded to Stripe Connect'
        }
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    }

    // Calculate platform fee using restaurant's custom percentage
    const feePercent = order.restaurant.platformFeePercent || 1.0
    const platformFeeAmount = Math.round(order.total * 100 * (feePercent / 100))

    // Create payment intent with destination charge (money goes to restaurant)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: order.restaurant.stripeAccountId,
      },
      metadata: {
        orderId: order.id,
        restaurantId: order.restaurantId,
        customerName: order.customerName || "Anonymous",
        restaurantName: order.restaurant.name,
        paymentType: "connect" // Indicates this uses Stripe Connect
      }
    })

    // Log the card payment creation
    await createPaymentLog({
      orderId,
      action: 'card_payment',
      amount: order.total,
      paymentId: paymentIntent.id,
      previousStatus: order.status,
      newStatus: order.status, // No status change yet
      metadata: {
        paymentIntentCreated: new Date().toISOString(),
        paymentType: order.restaurant.stripeAccountId ? 'connect' : 'direct',
        platformFee: order.restaurant.stripeAccountId ? platformFeeAmount : 0,
        platformFeePercent: order.restaurant.platformFeePercent || 1.0,
        stripePaymentIntentId: paymentIntent.id
      }
    })

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: paymentIntent.id }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    console.error("Failed to create payment intent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}