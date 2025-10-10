"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Restaurant {
  id: string
  name: string
  email: string
  phone: string | null
  platformFeePercent: number
  pricingTier: string | null
  stripeOnboarded: boolean
  createdAt: string
  internalNotes: string | null
  _count: {
    orders: number
    menuItems: number
    tables: number
  }
  totalRevenue: number
  platformEarnings: number
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFee, setEditFee] = useState("")
  const [editTier, setEditTier] = useState("")
  const [editNotes, setEditNotes] = useState("")

  // SUPER ADMIN EMAIL (solo tú puedes acceder)
  const SUPER_ADMIN_EMAIL = "stephllerma@icloud.com" // Cambia esto a TU email

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Verificar que es super admin
    if (session.user?.email !== SUPER_ADMIN_EMAIL) {
      router.push("/dashboard")
      return
    }

    fetchRestaurants()
  }, [session, status])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/restaurants")
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (restaurant: Restaurant) => {
    setEditingId(restaurant.id)
    setEditFee(restaurant.platformFeePercent.toString())
    setEditTier(restaurant.pricingTier || "basic")
    setEditNotes(restaurant.internalNotes || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFee("")
    setEditTier("")
    setEditNotes("")
  }

  const saveChanges = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/super-admin/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformFeePercent: parseFloat(editFee),
          pricingTier: editTier,
          internalNotes: editNotes
        })
      })

      if (response.ok) {
        fetchRestaurants()
        cancelEdit()
      }
    } catch (error) {
      console.error("Failed to update restaurant:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalPlatformEarnings = restaurants.reduce((sum, r) => sum + r.platformEarnings, 0)
  const totalRestaurantRevenue = restaurants.reduce((sum, r) => sum + r.totalRevenue, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                👑 Super Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-white hover:text-purple-200"
              >
                My Restaurant
              </Link>
              <button
                onClick={() => router.push("/auth/signin")}
                className="bg-white text-purple-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Restaurants</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{restaurants.length}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Platform Earnings</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              ${totalPlatformEarnings.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Your commission</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              ${totalRestaurantRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">All restaurants</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Avg Commission</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {restaurants.length > 0
                ? (restaurants.reduce((sum, r) => sum + r.platformFeePercent, 0) / restaurants.length).toFixed(2)
                : "0"}%
            </div>
          </div>
        </div>

        {/* Restaurants Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Restaurants</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-xs text-gray-500">
                        {restaurant.stripeOnboarded ? (
                          <span className="text-green-600">✓ Stripe Connected</span>
                        ) : (
                          <span className="text-red-600">✗ Not connected</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(restaurant.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{restaurant.email}</div>
                      {restaurant.phone && (
                        <div className="text-xs text-gray-500">{restaurant.phone}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {restaurant._count.orders} orders
                      </div>
                      <div className="text-xs text-gray-500">
                        {restaurant._count.menuItems} items, {restaurant._count.tables} tables
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {editingId === restaurant.id ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editFee}
                            onChange={(e) => setEditFee(e.target.value)}
                            className="border rounded px-2 py-1 w-20 text-sm"
                          />
                          <span className="text-sm ml-1">%</span>
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value)}
                            className="block w-full border rounded px-2 py-1 text-sm mt-1"
                          >
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {restaurant.platformFeePercent}%
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {restaurant.pricingTier || "basic"} tier
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${restaurant.totalRevenue.toFixed(2)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        ${restaurant.platformEarnings.toFixed(2)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingId === restaurant.id ? (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Internal notes..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveChanges(restaurant.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <button
                            onClick={() => startEdit(restaurant)}
                            className="text-blue-600 hover:text-blue-800 block"
                          >
                            Edit
                          </button>
                          {restaurant.internalNotes && (
                            <div className="text-xs text-gray-500 italic">
                              Note: {restaurant.internalNotes.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
