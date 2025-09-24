"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

interface Order {
  id: string
  customerName: string | null
  total: number
  status: string
  createdAt: string
  updatedAt: string
  restaurant: {
    name: string
  }
  table: {
    number: number
  }
  orderItems: Array<{
    quantity: number
    price: number
    menuItem: {
      name: string
    }
  }>
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { orderId } = params

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (orderId) {
      fetchOrderStatus()
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchOrderStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [orderId])

  const fetchOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else {
        setError("Order not found")
      }
    } catch (error) {
      console.error('Error fetching order status:', error)
      setError("Failed to load order")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PENDING_CASH_PAYMENT':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳'
      case 'CONFIRMED':
        return '✅'
      case 'PREPARING':
        return '👨‍🍳'
      case 'READY':
        return '🔔'
      case 'DELIVERED':
        return '✨'
      default:
        return '📋'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Your order has been received and is awaiting confirmation.'
      case 'CONFIRMED':
        return 'Your order has been confirmed and sent to the kitchen.'
      case 'PREPARING':
        return 'Your order is being prepared. Please wait.'
      case 'READY':
        return 'Your order is ready for pickup!'
      case 'DELIVERED':
        return 'Your order has been delivered. Enjoy your meal!'
      default:
        return 'Checking order status...'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-900 font-medium">Loading order status...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h1 className="text-2xl font-bold text-indigo-900 mb-4">Order Not Found</h1>
          <p className="text-orange-700 mb-6 font-medium">{error || "This order could not be found."}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-900">Order Tracking</h1>
          <p className="text-orange-700 mt-2 font-medium">Track your order in real-time</p>
        </div>

        {/* Current Status */}
        <div className={`border-2 rounded-lg p-6 mb-6 ${getStatusColor(order.status)}`}>
          <div className="text-center">
            <div className="text-4xl mb-3">{getStatusIcon(order.status)}</div>
            <h2 className="text-xl font-semibold mb-2">{order.status}</h2>
            <p className="text-sm">{getStatusMessage(order.status)}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Order ID:</span>
              <span className="font-mono text-xs text-indigo-900 font-bold">#{order.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Restaurant:</span>
              <span className="font-medium text-indigo-900">{order.restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Table:</span>
              <span className="text-indigo-900 font-medium">Table {order.table.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Customer:</span>
              <span className="text-indigo-900 font-medium">{order.customerName || "Anonymous"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Order Time:</span>
              <span className="text-indigo-900 font-medium">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.status !== 'PENDING' && (
              <div className="flex justify-between">
                <span className="text-orange-700 font-medium">Last Updated:</span>
                <span className="text-indigo-900 font-medium">{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium text-indigo-900">{item.menuItem.name}</span>
                  <span className="text-orange-700 ml-2 font-medium">x{item.quantity}</span>
                </div>
                <span className="text-indigo-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-orange-200 pt-4 mt-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-indigo-900">Total:</span>
              <span className="text-indigo-900">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}