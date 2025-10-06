"use client"

import { useState, useEffect } from "react"
import {
  useStripe,
  useElements,
  PaymentElement
} from "@stripe/react-stripe-js"

interface CheckoutFormProps {
  orderId: string
}

export default function CheckoutForm({ orderId }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?orderId=${orderId}`,
      },
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Please check your card details and try again")
      } else {
        setMessage("An unexpected error occurred. Please try again.")
      }
      console.error("Stripe payment error:", error)
    }

    setIsLoading(false)
  }

  const paymentElementOptions = {
    layout: "tabs" as const,
    wallets: {
      applePay: "never",
      googlePay: "never"
    }
  }

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement
        id="payment-element"
        options={paymentElementOptions}
      />

      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-orange-300 text-white font-medium py-3 px-4 rounded-md
transition-colors"
      >
        <span id="button-text">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            "Pay now"
          )}
        </span>
      </button>

      {message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{message}</p>
        </div>
      )}
    </form>
  )
  }
