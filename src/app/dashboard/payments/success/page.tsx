"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Verify the account status
    const verifyAccount = async () => {
      try {
        const response = await fetch("/api/stripe/status")
        if (response.ok) {
          const data = await response.json()
          setSuccess(data.onboarded)
        }
      } catch (error) {
        console.error("Failed to verify account:", error)
      } finally {
        setVerifying(false)
      }
    }

    verifyAccount()
  }, [])

  const goToDashboard = () => {
    router.push("/dashboard/payments")
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
            success ? "bg-green-100" : "bg-yellow-100"
          } mb-4`}>
            {success ? (
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {success ? "Account Setup Complete!" : "Setup In Progress"}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {success 
              ? "Your Stripe account is now active and ready to receive payments."
              : "Your account setup is in progress. You may need to complete additional steps."
            }
          </p>

          <div className={`p-3 rounded-md mb-6 ${
            success 
              ? "bg-green-50 border border-green-200" 
              : "bg-yellow-50 border border-yellow-200"
          }`}>
            <p className={`text-sm font-medium ${
              success ? "text-green-800" : "text-yellow-800"
            }`}>
              {success 
                ? "✓ You can now receive payments from customer orders" 
                : "⏳ Complete any remaining verification steps in your Stripe dashboard"
              }
            </p>
          </div>

          <button
            onClick={goToDashboard}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go to Payment Settings
          </button>
        </div>
      </div>
    </div>
  )
}