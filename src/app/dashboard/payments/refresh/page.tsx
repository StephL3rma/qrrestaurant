"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PaymentRefreshPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect back to payments page after a short delay
    const timer = setTimeout(() => {
      router.push("/dashboard/payments")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Refreshing Account
          </h2>
          
          <p className="text-gray-600 mb-6">
            We&apos;re updating your account information. You&apos;ll be redirected back to the payment settings.
          </p>

          <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
        </div>
      </div>
    </div>
  )
}