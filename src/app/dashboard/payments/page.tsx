"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface StripeStatus {
  hasAccount: boolean
  onboarded: boolean
  accountId?: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  detailsSubmitted?: boolean
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchStripeStatus()
    }
  }, [status, router])

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch("/api/stripe/status")
      if (response.ok) {
        const data = await response.json()
        setStripeStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error)
    } finally {
      setLoading(false)
    }
  }

  const createStripeAccount = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create Stripe account")
      }
    } catch (error) {
      console.error("Failed to create Stripe account:", error)
      alert("Failed to create Stripe account")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Payment Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure your payment account to receive money from orders
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stripe Connect Account</h3>
          <p className="mt-1 text-sm text-gray-600">
            Connect your bank account to receive payments directly
          </p>
        </div>

        <div className="px-6 py-4">
          {!stripeStatus?.hasAccount ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payment account</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a Stripe account to start receiving payments
              </p>
              <div className="mt-6">
                <button
                  onClick={createStripeAccount}
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Connect with Stripe"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd className="mt-1 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stripeStatus.onboarded 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {stripeStatus.onboarded ? "✓ Active" : "⏳ Setup Required"}
                    </span>
                  </dd>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Account ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {stripeStatus.accountId}
                  </dd>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Charges Enabled</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center ${
                      stripeStatus.chargesEnabled ? "text-green-600" : "text-red-600"
                    }`}>
                      {stripeStatus.chargesEnabled ? "✓ Yes" : "✗ No"}
                    </span>
                  </dd>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Payouts Enabled</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center ${
                      stripeStatus.payoutsEnabled ? "text-green-600" : "text-red-600"
                    }`}>
                      {stripeStatus.payoutsEnabled ? "✓ Yes" : "✗ No"}
                    </span>
                  </dd>
                </div>
              </div>

              {!stripeStatus.onboarded && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Complete your Stripe account setup to start receiving payments.
                        You may need to provide additional business information and bank details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Platform Fee:</strong> We charge a 1% platform fee on each successful payment. 
                      The remaining 99% goes directly to your bank account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}