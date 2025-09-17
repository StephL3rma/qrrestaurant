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

export default function AllOrdersTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { deviceId } = params

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (deviceId) {
      fetchAllOrders()
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchAllOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [deviceId])

  const fetchAllOrders = async () => {
    try {
      const response = await fetch(`/api/orders/device/${deviceId}`)
      if (response.ok) {
        const ordersData = await response.json()

        // Filter out delivered orders older than 3 hours
        const filteredOrders = ordersData.filter((order: Order) => {
          if (order.status === 'DELIVERED') {
            const orderTime = new Date(order.updatedAt).getTime()
            const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000)
            return orderTime > threeHoursAgo
          }
          return true
        })

        setOrders(filteredOrders)
      } else {
        setError("Failed to load orders")
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError("Failed to load orders")
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

  const activeOrders = orders.filter(order => order.status !== 'DELIVERED')
  const recentDeliveredOrders = orders.filter(order => order.status === 'DELIVERED')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📱</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Orders</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🍽️</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Orders Found</h1>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          <p className="text-gray-600 mt-2">Track all your orders from this device</p>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Orders</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStatusIcon(order.status)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {order.restaurant.name} - Table {order.table.number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Order #{order.id.slice(-8)} • {order.orderItems.length} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.toLowerCase()}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Ordered: {new Date(order.createdAt).toLocaleString()}</p>
                        {order.status !== 'PENDING' && (
                          <p>Updated: {new Date(order.updatedAt).toLocaleString()}</p>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/track/${order.id}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Delivered Orders */}
        {recentDeliveredOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recently Delivered</h2>
            <div className="space-y-4">
              {recentDeliveredOrders.map((order) => (
                <div key={order.id} className="bg-white shadow rounded-lg p-6 opacity-75">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {order.restaurant.name} - Table {order.table.number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Order #{order.id.slice(-8)} • {order.orderItems.length} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-800 border-gray-200">
                        delivered
                      </span>
                      <p className="text-sm text-gray-600 mt-1">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Delivered: {new Date(order.updatedAt).toLocaleString()}
                      </p>
                      <button
                        onClick={() => router.push(`/track/${order.id}`)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ← Back to Menu
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🔄 Refresh Orders
          </button>
        </div>
      </div>
    </div>
  )
}