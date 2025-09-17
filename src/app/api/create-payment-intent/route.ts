import { NextRequest, NextResponse } from "next/server"
import { getServerStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

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
            stripeOnboarded: true
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
        metadata: {
          orderId: order.id,
          restaurantId: order.restaurantId,
          customerName: order.customerName || "Anonymous",
          restaurantName: order.restaurant.name,
          paymentType: "direct" // Indicates this is not using Stripe Connect
        }
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    }

    // Calculate platform fee (1% of total) for Stripe Connect
    const platformFeeAmount = Math.round(order.total * 100 * 0.01)

    // Create payment intent with destination charge (money goes to restaurant)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
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