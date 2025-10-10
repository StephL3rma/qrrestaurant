import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// SUPER ADMIN EMAIL
const SUPER_ADMIN_EMAIL = "stephllerma@icloud.com"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { restaurantId } = await params
    const { platformFeePercent, pricingTier, internalNotes } = await request.json()

    // Validate platformFeePercent
    if (platformFeePercent !== undefined) {
      if (platformFeePercent < 0 || platformFeePercent > 100) {
        return NextResponse.json(
          { error: "Platform fee must be between 0 and 100" },
          { status: 400 }
        )
      }
    }

    // Update restaurant
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(platformFeePercent !== undefined && { platformFeePercent }),
        ...(pricingTier !== undefined && { pricingTier }),
        ...(internalNotes !== undefined && { internalNotes })
      }
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Failed to update restaurant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
