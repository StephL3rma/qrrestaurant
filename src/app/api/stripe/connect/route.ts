import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if restaurant already has a Stripe account
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true, email: true, name: true }
    })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    if (restaurant.stripeAccountId) {
      return NextResponse.json({ error: "Stripe account already exists" }, { status: 400 })
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: restaurant.email,
      business_profile: {
        name: restaurant.name,
        product_description: 'Restaurant food delivery and pickup services'
      },
    })

    // Update restaurant with Stripe account ID
    await prisma.restaurant.update({
      where: { id: session.user.id },
      data: { stripeAccountId: account.id }
    })

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/payments/refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/payments/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url 
    })
  } catch (error) {
    console.error("Failed to create Stripe Connect account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}