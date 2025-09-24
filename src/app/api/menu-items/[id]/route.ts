import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, price, category } = await request.json()

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the menu item belongs to the authenticated restaurant
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: params.id,
        restaurantId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: parseFloat(price),
        category
      }
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error("Failed to update menu item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the menu item belongs to the authenticated restaurant
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: params.id,
        restaurantId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    await prisma.menuItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete menu item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { available } = await request.json()

    if (typeof available !== 'boolean') {
      return NextResponse.json({ error: "Invalid availability value" }, { status: 400 })
    }

    // Verify the menu item belongs to the authenticated restaurant
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: params.id,
        restaurantId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
      data: { available }
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error("Failed to update menu item availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}