"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [orderStatus, setOrderStatus] = useState("processing")

  useEffect(() => {
    if (orderId) {
      // Here you could update the order status to CONFIRMED
      // and send notifications to the restaurant
      updateOrderStatus()
    }
  }, [orderId])

  const updateOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: "POST"
      })
      
      if (response.ok) {
        setOrderStatus("confirmed")
      }
    } catch (error) {
      console.error("Failed to confirm order:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and sent to the kitchen.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono text-sm font-medium">{orderId}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className={`p-3 rounded-md ${
              orderStatus === "confirmed" 
                ? "bg-green-50 border border-green-200" 
                : "bg-yellow-50 border border-yellow-200"
            }`}>
              <p className={`text-sm font-medium ${
                orderStatus === "confirmed" 
                  ? "text-green-800" 
                  : "text-yellow-800"
              }`}>
                {orderStatus === "confirmed" 
                  ? "✓ Order confirmed with restaurant" 
                  : "⏳ Processing order confirmation..."
                }
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p>• You will receive updates about your order status</p>
              <p>• Stay at your table for order delivery</p>
              <p>• Thank you for your order!</p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => window.location.href = "/"}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}