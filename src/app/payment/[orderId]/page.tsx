"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Elements } from "@stripe/react-stripe-js"
import { getStripe } from "@/lib/stripe"
import CheckoutForm from "@/components/CheckoutForm"
import { Stripe } from "@stripe/stripe-js"

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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

  useEffect(() => {
    if (orderId) {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        setError("Payment setup is taking too long. Please try again.")
        setIsLoading(false)
      }, 30000) // 30 second timeout

      fetchOrderAndCreatePayment().finally(() => {
        clearTimeout(timeoutId)
      })

      return () => clearTimeout(timeoutId)
    }
  }, [orderId, paymentMethod])

  const fetchOrderAndCreatePayment = async () => {
    try {
      // Create timeout for the entire operation
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Payment setup timed out. Please try again.')), 15000)
      )

      // Fetch order with timeout
      const fetchOrder = async () => {
        const orderResponse = await fetch(`/api/orders/${orderId}`, {
          cache: 'no-cache'
        })

        if (!orderResponse.ok) {
          throw new Error(`Order not found (${orderResponse.status})`)
        }

        return orderResponse.json()
      }

      const orderData = await Promise.race([fetchOrder(), timeout])

      // CHECK IF ORDER IS ALREADY CONFIRMED - REDIRECT TO TRACKING
      if (orderData.status === 'CONFIRMED' || orderData.status === 'PREPARING' ||
          orderData.status === 'READY' || orderData.status === 'DELIVERED') {
        // Order is already confirmed, redirect to tracking page
        router.push(`/track/${orderId}`)
        return
      }

      setOrder(orderData)

      // Only create payment intent for card payments
      if (paymentMethod === "card") {
        // Load Stripe and create payment intent in parallel
        const stripePromiseLocal = stripePromise || getStripe()
        if (!stripePromise) {
          setStripePromise(stripePromiseLocal)
        }

        const createPaymentIntent = async () => {
          const paymentResponse = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
          })

          if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text()
            throw new Error(`Payment setup failed: ${errorText}`)
          }

          return paymentResponse.json()
        }

        const { clientSecret: realClientSecret } = await Promise.race([
          createPaymentIntent(),
          timeout
        ])
        setClientSecret(realClientSecret)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment setup failed'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCashPayment = async () => {
    try {
      // Mark order as pending cash payment
      const response = await fetch(`/api/orders/${orderId}/cash-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push(`/payment/${orderId}/cash-confirmation`)
      } else {
        setError('Failed to process cash payment request')
      }
    } catch (error) {
      setError('Error processing cash payment')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-900 font-medium">Setting up payment...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-medium">{error || "Order not found"}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Use lazy-loaded stripe promise

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
    <div className="min-h-screen bg-orange-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Order Summary */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4">Order Summary</h2>
          <div className="border-b border-orange-200 pb-4 mb-4">
            <p className="font-medium text-indigo-900">{order.restaurant.name}</p>
            <p className="text-sm text-orange-700">Customer: {order.customerName || "Anonymous"}</p>
          </div>
          
          <div className="space-y-3">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium text-indigo-900">{item.menuItem.name}</span>
                  <span className="text-orange-700 ml-2">x{item.quantity}</span>
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

        {/* Payment Method Selection */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-900 mb-6">Choose Payment Method</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Card Payment Option */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'card'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-orange-300 hover:border-orange-400'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mr-3 text-indigo-600"
                />
                <div>
                  <h3 className="font-medium text-indigo-900">💳 Card / Apple Pay / Google Pay</h3>
                  <p className="text-sm text-orange-700">Pay instantly with your card or mobile wallet</p>
                  <p className="text-xs text-orange-600 mt-1">Processing fee: 2.9% + $0.30</p>
                </div>
              </div>
            </div>

            {/* Cash Payment Option */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-50'
                  : 'border-orange-300 hover:border-orange-400'
              }`}
              onClick={() => setPaymentMethod('cash')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="mr-3 text-green-600"
                />
                <div>
                  <h3 className="font-medium text-indigo-900">💵 Pay at Counter (Cash)</h3>
                  <p className="text-sm text-orange-700">Pay when you pick up your order</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">No processing fees!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white shadow rounded-lg p-6">
          {paymentMethod === 'card' ? (
            <>
              <h2 className="text-xl font-semibold text-indigo-900 mb-6">Payment Details</h2>
              {clientSecret && stripePromise && (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm orderId={orderId as string} />
                </Elements>
              )}
              {(!clientSecret || !stripePromise) && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-indigo-900 font-medium">
                    {!stripePromise ? "Loading payment system..." : "Setting up payment..."}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-indigo-900 mb-6">Cash Payment Instructions</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-green-600 text-xl">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Instructions:</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Click "Confirm Cash Payment" below</li>
                        <li>Your order will be sent to the kitchen</li>
                        <li>Go to the counter when ready</li>
                        <li>Pay ${order.total.toFixed(2)} in cash</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCashPayment}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Confirm Cash Payment - ${order.total.toFixed(2)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}