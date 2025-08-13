"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (session) {
      router.push("/dashboard")
    }
  }, [session, status])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          QR Restaurant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Digital menu and ordering system for restaurants
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Get Started
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to manage your restaurant&apos;s digital menu and orders
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </Link>
              
              <div className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Register your restaurant
                </Link>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-900">Features</h4>
                <ul className="mt-3 space-y-2 text-sm text-gray-500">
                  <li>• QR code menus for each table</li>
                  <li>• Individual ordering and payment</li>
                  <li>• Real-time order notifications</li>
                  <li>• No more bill splitting confusion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
