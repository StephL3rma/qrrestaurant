import { loadStripe } from "@stripe/stripe-js"
import Stripe from "stripe"

export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined")
  }

  return loadStripe(publishableKey)
}

// Server-side only Stripe instance
let stripe: Stripe | null = null

export const getServerStripe = () => {
  if (typeof window !== "undefined") {
    throw new Error("getServerStripe can only be called server-side")
  }

  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not defined")
    }

    stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16"
    })
  }

  return stripe
}

// Export named stripe instance for backwards compatibility
export { getServerStripe as stripe }
export default getServerStripe