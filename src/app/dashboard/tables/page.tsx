"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Table {
  id: string
  number: number
  capacity: number | null
  qrCode: string
  createdAt: string
}

export default function TablesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [newTable, setNewTable] = useState({ number: "", capacity: "" })
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; url: string } | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchTables()
  }, [session, status])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables")
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTable),
      })

      if (response.ok) {
        const table = await response.json()
        setTables([...tables, table])
        setNewTable({ number: "", capacity: "" })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error("Failed to add table:", error)
    }
  }

  const handleEditTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTable) return

    try {
      const response = await fetch(`/api/tables/${editingTable.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: parseInt(newTable.number),
          capacity: newTable.capacity ? parseInt(newTable.capacity) : null
        }),
      })

      if (response.ok) {
        const updatedTable = await response.json()
        setTables(tables.map(table =>
          table.id === editingTable.id ? updatedTable : table
        ))
        setNewTable({ number: "", capacity: "" })
        setEditingTable(null)
        setShowAddForm(false)
      }
    } catch (error) {
      console.error("Failed to update table:", error)
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTables(tables.filter(table => table.id !== tableId))
      }
    } catch (error) {
      console.error("Failed to delete table:", error)
    }
  }

  const startEdit = (table: Table) => {
    setEditingTable(table)
    setNewTable({
      number: table.number.toString(),
      capacity: table.capacity?.toString() || ""
    })
    setShowAddForm(true)
  }

  const cancelEdit = () => {
    setEditingTable(null)
    setNewTable({ number: "", capacity: "" })
    setShowAddForm(false)
  }

  const generateQRCode = async (table: Table) => {
    try {
      const response = await fetch(`/api/tables/${table.id}/qr`)
      if (response.ok) {
        const data = await response.json()
        setQrCodeData(data)
        setSelectedTable(table)
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    }
  }

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
                Manage Tables
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Table
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
                {editingTable ? "Edit Table" : "Add New Table"}
              </h3>
              <form onSubmit={editingTable ? handleEditTable : handleAddTable} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Table Number
                    </label>
                    <input
                      type="number"
                      required
                      value={newTable.number}
                      onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Capacity (optional)
                    </label>
                    <input
                      type="number"
                      value={newTable.capacity}
                      onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {editingTable ? "Update Table" : "Add Table"}
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
                Your Tables
              </h3>
              
              {tables.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-700">No tables yet. Add your first table to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <div key={table.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Table {table.number}</h4>
                          {table.capacity && (
                            <p className="text-sm text-gray-700">Capacity: {table.capacity}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => generateQRCode(table)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Generate QR Code
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(table)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {qrCodeData && selectedTable && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    QR Code for Table {selectedTable.number}
                  </h3>
                  <div className="mt-4">
                    <img 
                      src={qrCodeData.qrCode} 
                      alt={`QR Code for Table ${selectedTable.number}`}
                      className="mx-auto"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    Customers scan this code to view the menu
                  </p>
                  <div className="mt-4 flex justify-center space-x-3">
                    <a
                      href={qrCodeData.qrCode}
                      download={`table-${selectedTable.number}-qr.png`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => {
                        setQrCodeData(null)
                        setSelectedTable(null)
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}