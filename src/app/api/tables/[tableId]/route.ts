import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tableId } = await params
    const { number, capacity } = await request.json()

    if (!number) {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 })
    }

    // Verify the table belongs to the authenticated restaurant
    const existingTable = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId: session.user.id
      }
    })

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Check if the new number conflicts with another table (unless it's the same table)
    const conflictingTable = await prisma.table.findFirst({
      where: {
        restaurantId: session.user.id,
        number: parseInt(number),
        id: { not: tableId }
      }
    })

    if (conflictingTable) {
      return NextResponse.json({ error: "A table with this number already exists" }, { status: 400 })
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: {
        number: parseInt(number),
        capacity: capacity ? parseInt(capacity) : null
      }
    })

    return NextResponse.json(table)
  } catch (error) {
    console.error("Failed to update table:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tableId } = await params

    // Verify the table belongs to the authenticated restaurant
    const existingTable = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId: session.user.id
      }
    })

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Check if there are any active orders for this table
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId: tableId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']
        }
      }
    })

    if (activeOrders.length > 0) {
      return NextResponse.json({
        error: "Cannot delete table with active orders. Please complete or cancel all orders first."
      }, { status: 400 })
    }

    await prisma.table.delete({
      where: { id: tableId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete table:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}