"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

interface Order {
  id: string
  customerName: string | null
  total: number
  status: string
  restaurant: {
    name: string
  }
  orderItems: Array<{
    quantity: number
    price: number
    menuItem: {
      name: string
    }
  }>
}

export default function CashConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { orderId } = params

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-indigo-900 font-medium">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-medium">Order not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-4xl">✅</span>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-green-800">Order Confirmed!</h1>
              <p className="text-green-700">Your order has been sent to the kitchen.</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4">Order Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Order ID:</span>
              <span className="font-mono text-xs text-indigo-900 font-bold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Restaurant:</span>
              <span className="font-medium text-indigo-900">{order.restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Customer:</span>
              <span className="text-indigo-900 font-medium">{order.customerName || "Anonymous"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Payment Method:</span>
              <span className="text-green-600 font-medium">💵 Cash Payment</span>
            </div>
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
              <span className="text-indigo-900">Total to Pay at Counter:</span>
              <span className="text-green-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">What happens next?</h3>
          {order.status === 'PENDING_CASH_PAYMENT' ? (
            <div className="space-y-2 text-blue-700">
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-3">
                <p className="font-bold text-yellow-800">⏳ Waiting for payment confirmation</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Your order is reserved but NOT yet being prepared. Payment confirmation required.
                </p>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Go to the counter with this confirmation</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span className="font-medium">Pay exactly ${order.total.toFixed(2)} in cash</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Restaurant will confirm your payment</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Then your order will start being prepared</span>
              </div>
              <div className="mt-3 p-2 bg-blue-100 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Changed your mind?</strong> Use the yellow button above to pay with card instead.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-blue-700">
              <div className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Your order is now being prepared in the kitchen</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>You'll be notified when your order is ready (if contact info provided)</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Go to the counter to pick up your order</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span className="font-medium">Payment already confirmed: ${order.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Show Back to Payment Methods button only for PENDING_CASH_PAYMENT */}
          {order.status === 'PENDING_CASH_PAYMENT' && (
            <button
              onClick={() => router.push(`/payment/${orderId}`)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              ← Back to Payment Methods
            </button>
          )}

          <button
            onClick={() => router.push(`/track/${orderId}`)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            📱 Track Order Status
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🖨️ Print Receipt
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}