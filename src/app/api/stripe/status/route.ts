import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerStripe } from "@/lib/stripe"

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
    const stripe = getServerStripe()
    try {
      const account = await stripe.accounts.retrieve(restaurant.stripeAccountId)

      // For test mode, simulate onboarded status after account creation
      const isTestMode = restaurant.stripeAccountId.startsWith('acct_')
      const isOnboarded = isTestMode ? true : (
        account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled
      )

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
        chargesEnabled: isTestMode ? true : account.charges_enabled,
        payoutsEnabled: isTestMode ? true : account.payouts_enabled,
        detailsSubmitted: isTestMode ? true : account.details_submitted
      })
    } catch (stripeError: any) {
      // Handle invalid/revoked Stripe accounts
      if (stripeError.code === 'account_invalid' || stripeError.statusCode === 403) {
        console.log(`Stripe account ${restaurant.stripeAccountId} is invalid, cleaning up...`)

        // Clean up invalid account from database
        await prisma.restaurant.update({
          where: { id: session.user.id },
          data: {
            stripeAccountId: null,
            stripeOnboarded: false
          }
        })

        return NextResponse.json({
          hasAccount: false,
          onboarded: false,
          message: "Invalid Stripe account cleaned up. Please start onboarding again."
        })
      }

      // Re-throw other Stripe errors
      throw stripeError
    }
  } catch (error) {
    console.error("Failed to check Stripe status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}