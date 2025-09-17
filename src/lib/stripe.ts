import { loadStripe } from "@stripe/stripe-js"
import Stripe from "stripe"

// Debug logging
console.log("=== STRIPE DEBUG ===")
console.log("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY)
console.log("All env vars:", Object.keys(process.env).filter(key => key.includes('STRIPE')))
console.log("===================")

export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  
  console.log("getStripe called with:", publishableKey)
  
  if (!publishableKey) {
    console.error("STRIPE PUBLISHABLE KEY IS MISSING!")
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined")
  }
  
  console.log("Calling loadStripe with key:", publishableKey.substring(0, 10) + "...")
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
    console.log("Server-side Stripe key check:", secretKey ? "EXISTS" : "MISSING")

    if (!secretKey) {
      console.error("STRIPE SECRET KEY IS MISSING!")
      throw new Error("STRIPE_SECRET_KEY is not defined")
    }

    stripe = new Stripe(secretKey, {
      apiVersion: "2025-07-30.basil"
    })
  }

  return stripe
}

// Export named stripe instance for backwards compatibility
export const stripe = getServerStripe()
export default stripe