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
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order status...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "This order could not be found."}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600 mt-2">Track your order in real-time</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono text-xs">#{order.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Restaurant:</span>
              <span className="font-medium">{order.restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Table:</span>
              <span>Table {order.table.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span>{order.customerName || "Anonymous"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Time:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.status !== 'PENDING' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.menuItem.name}</span>
                  <span className="text-gray-600 ml-2">x{item.quantity}</span>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
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