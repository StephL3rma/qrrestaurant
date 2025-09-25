import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getPaymentLogsSummary } from "@/lib/paymentLogs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await params

    // Get payment logs summary for the order
    const paymentSummary = await getPaymentLogsSummary(orderId)

    return NextResponse.json(paymentSummary)
  } catch (error) {
    console.error("Failed to fetch payment logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}