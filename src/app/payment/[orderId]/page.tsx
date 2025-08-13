"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Elements } from "@stripe/react-stripe-js"
import { getStripe } from "@/lib/stripe"
import CheckoutForm from "@/components/CheckoutForm"

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

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { orderId } = params
  
  const [order, setOrder] = useState<Order | null>(null)
  const [clientSecret, setClientSecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (orderId) {
      fetchOrderAndCreatePayment()
    }
  }, [orderId])

  const fetchOrderAndCreatePayment = async () => {
    try {
      // First, get the order details
      const orderResponse = await fetch(`/api/orders/${orderId}`)
      if (!orderResponse.ok) {
        throw new Error("Order not found")
      }
      
      const orderData = await orderResponse.json()
      setOrder(orderData)

      // Then create payment intent
      const paymentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (!paymentResponse.ok) {
        throw new Error("Failed to create payment")
      }

      const { clientSecret } = await paymentResponse.json()
      setClientSecret(clientSecret)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up payment...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const stripePromise = getStripe()

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#4f46e5',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Order Summary */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="border-b border-gray-200 pb-4 mb-4">
            <p className="font-medium">{order.restaurant.name}</p>
            <p className="text-sm text-gray-600">Customer: {order.customerName || "Anonymous"}</p>
          </div>
          
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

        {/* Payment Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>
          
          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm orderId={orderId as string} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}