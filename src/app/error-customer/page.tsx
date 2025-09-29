"use client"

import { useRouter } from "next/navigation"

export default function CustomerErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <span className="text-2xl">⚠️</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>

          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find your order. It may have been processed or there was an error.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              If you need assistance, please contact the restaurant directly.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Return to Main Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}