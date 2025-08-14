import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true, stripeOnboarded: true }
    })

    if (!restaurant?.stripeAccountId) {
      return NextResponse.json({ 
        hasAccount: false,
        onboarded: false 
      })
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(restaurant.stripeAccountId)
    
    const isOnboarded = account.details_submitted && 
                       account.charges_enabled && 
                       account.payouts_enabled

    // Update database if status changed
    if (isOnboarded !== restaurant.stripeOnboarded) {
      await prisma.restaurant.update({
        where: { id: session.user.id },
        data: { stripeOnboarded: isOnboarded }
      })
    }

    return NextResponse.json({
      hasAccount: true,
      onboarded: isOnboarded,
      accountId: restaurant.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    })
  } catch (error) {
    console.error("Failed to check Stripe status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}