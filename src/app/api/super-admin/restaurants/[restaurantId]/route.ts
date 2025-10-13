import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "super-admin-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; email: string; role: string }
    if (decoded.role !== "SUPER_ADMIN") {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const admin = verifyToken(request)
    if (!admin) {
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
