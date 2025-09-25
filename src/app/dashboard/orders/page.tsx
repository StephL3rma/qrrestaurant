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
    comments: string | null
    menuItem: {
      name: string
    }
  }>
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PENDING_CASH_PAYMENT: "bg-amber-100 text-amber-800",
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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [paymentLogs, setPaymentLogs] = useState<Record<string, any>>({})

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

  const confirmCashPayment = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm-cash-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error("Failed to confirm cash payment:", error)
    }
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

  const toggleOrderExpansion = async (orderId: string) => {
    const newExpanded = new Set(expandedOrders)

    if (expandedOrders.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
      // Fetch payment logs for this order if not already cached
      if (!paymentLogs[orderId]) {
        try {
          const response = await fetch(`/api/orders/${orderId}/payment-logs`)
          if (response.ok) {
            const logs = await response.json()
            setPaymentLogs(prev => ({ ...prev, [orderId]: logs }))
          }
        } catch (error) {
          console.error("Failed to fetch payment logs:", error)
        }
      }
    }

    setExpandedOrders(newExpanded)
  }

  const getActionIcon = (action: string) => {
    const icons = {
      'cash_selected': '💵',
      'cash_confirmed': '✅',
      'card_payment': '💳',
      'back_to_payment': '🔄',
      'status_change': '📝'
    }
    return icons[action as keyof typeof icons] || '📋'
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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
                    <h4 className="font-medium text-gray-900 mb-4">Order Details:</h4>
                    <div className="space-y-3">
                      {order.orderItems.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-bold">
                                  {item.quantity}x
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {item.menuItem.name}
                                </span>
                              </div>
                              {item.comments && (
                                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <span className="text-yellow-600 text-lg">💬</span>
                                    <div>
                                      <p className="text-xs font-medium text-yellow-800 uppercase tracking-wide mb-1">
                                        Instrucciones Especiales
                                      </p>
                                      <p className="text-sm font-medium text-yellow-900">
                                        "{item.comments}"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    {/* Payment History Toggle */}
                    <div className="mb-4">
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                      >
                        <span>{expandedOrders.has(order.id) ? '📋' : '📊'}</span>
                        <span>{expandedOrders.has(order.id) ? 'Hide Payment History' : 'Show Payment History'}</span>
                        <span className={`transform transition-transform duration-200 ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                    </div>

                    {/* Payment History Section */}
                    {expandedOrders.has(order.id) && paymentLogs[order.id] && (
                      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🕒</span>
                          Payment History & Audit Trail
                        </h4>

                        {paymentLogs[order.id].hasMultiplePaymentAttempts && (
                          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <span className="text-yellow-600 mr-2">⚠️</span>
                              <span className="text-sm font-medium text-yellow-800">
                                Multiple payment attempts detected!
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="text-xs text-gray-600 mb-2">
                            Total Events: {paymentLogs[order.id].totalLogs} | Last Payment Method: {paymentLogs[order.id].lastPaymentMethod || 'None'}
                          </div>

                          {paymentLogs[order.id].actions.map((log: any, index: number) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <span className="text-lg">{getActionIcon(log.action)}</span>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900 capitalize">
                                        {log.action.replace('_', ' ')}
                                      </span>
                                      {log.details?.paymentMethod && (
                                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                                          {log.details.paymentMethod}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {formatDateTime(log.timestamp)}
                                    </p>
                                    {log.details?.reason && (
                                      <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-200">
                                        {log.details.reason}
                                      </p>
                                    )}
                                    {log.details?.note && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        Note: {log.details.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {log.details?.amount && (
                                  <span className="text-sm font-medium text-gray-700">
                                    ${log.details.amount}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.status === "PENDING_CASH_PAYMENT" ? (
                      <div className="space-y-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">💰</span>
                            <div>
                              <h4 className="font-semibold text-amber-800">Cash Payment Pending</h4>
                              <p className="text-sm text-amber-700">Customer chose to pay ${order.total.toFixed(2)} in cash. Confirm when payment is received.</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => confirmCashPayment(order.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center"
                          >
                            ✓ Confirm Cash Payment Received
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            {getStatusAction(order.status)}
                          </button>
                        )}

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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}