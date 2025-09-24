"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  available: boolean
}

export default function MenuPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: ""
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchMenuItems()
  }, [session, status])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu-items")
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        const item = await response.json()
        setMenuItems([...menuItems, item])
        setNewItem({ name: "", description: "", price: "", category: "" })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error("Failed to add menu item:", error)
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const response = await fetch(`/api/menu-items/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category: newItem.category
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setMenuItems(menuItems.map(item =>
          item.id === editingItem.id ? updatedItem : item
        ))
        setNewItem({ name: "", description: "", price: "", category: "" })
        setEditingItem(null)
      }
    } catch (error) {
      console.error("Failed to update menu item:", error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMenuItems(menuItems.filter(item => item.id !== itemId))
      }
    } catch (error) {
      console.error("Failed to delete menu item:", error)
    }
  }

  const toggleAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available: !currentAvailability
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setMenuItems(menuItems.map(item =>
          item.id === itemId ? updatedItem : item
        ))
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error)
    }
  }

  const startEdit = (item: MenuItem) => {
    setEditingItem(item)
    setNewItem({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category
    })
    setShowAddForm(true)
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setNewItem({ name: "", description: "", price: "", category: "" })
    setShowAddForm(false)
  }

  const categories = [...new Set(menuItems.map(item => item.category))]

  if (status === "loading" || isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-900">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Manage Menu
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Menu Item
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {showAddForm && (
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h3>
              <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Item Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <input
                      type="text"
                      required
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Appetizers, Main Courses, Desserts"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description (optional)
                    </label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {editingItem ? "Update Item" : "Add Item"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Menu Items
              </h3>
              
              {menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-700">No menu items yet. Add your first item to get started!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {categories.map(category => (
                    <div key={category} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h4 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                        {category}
                      </h4>
                      <div className="grid gap-4">
                        {menuItems
                          .filter(item => item.category === category)
                          .map(item => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{item.name}</h5>
                                {item.description && (
                                  <p className="text-gray-700 text-sm mt-1">{item.description}</p>
                                )}
                                <p className="text-indigo-600 font-bold text-lg mt-2">
                                  ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-4 flex items-center space-x-2">
                                <button
                                  onClick={() => toggleAvailability(item.id, item.available)}
                                  className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                    item.available
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                >
                                  {item.available ? 'Available' : 'Unavailable'}
                                </button>
                                <button
                                  onClick={() => startEdit(item)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}