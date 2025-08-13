"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Order {
  id: string
  customerName: string | null
  status: string
  total: number
  createdAt: string
  table: {
    number: number
  }
  orderItems: Array<{
    quantity: number
    menuItem: {
      name: string
    }
  }>
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  DELIVERED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800"
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchOrders()
    setupEventStream()
  }, [session, status])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/restaurant/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupEventStream = () => {
    const eventSource = new EventSource("/api/orders/stream")
    
    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "new_order" || data.type === "order_updated") {
          fetchOrders() // Refresh orders when new order comes in
        }
      } catch (error) {
        console.error("Failed to parse SSE data:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
    }
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      PENDING: "CONFIRMED",
      CONFIRMED: "PREPARING", 
      PREPARING: "READY",
      READY: "DELIVERED"
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  const getStatusAction = (status: string) => {
    const actions = {
      PENDING: "Confirm Order",
      CONFIRMED: "Start Preparing",
      PREPARING: "Mark Ready",
      READY: "Mark Delivered"
    }
    return actions[status as keyof typeof actions]
  }

  if (status === "loading" || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Order Management
              </h1>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="ml-2 text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {orders.length} Orders Today
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No orders yet. Orders will appear here in real-time!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((order) => (
                <div key={order.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Table {order.table.number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[order.status as keyof typeof statusColors]
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        Customer: {order.customerName || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
                    <ul className="space-y-1">
                      {order.orderItems.map((item, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {item.quantity}x {item.menuItem.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {getNextStatus(order.status) && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {getStatusAction(order.status)}
                      </button>
                      
                      {order.status !== "DELIVERED" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                          className="ml-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}