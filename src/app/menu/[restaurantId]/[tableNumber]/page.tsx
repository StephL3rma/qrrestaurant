"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  available: boolean
  imageUrl: string | null
}

interface OrderItem {
  menuItem: MenuItem
  quantity: number
}

interface Restaurant {
  id: string
  name: string
  address: string | null
}

export default function MenuPage() {
  const params = useParams()
  const { restaurantId, tableNumber } = params
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [customerName, setCustomerName] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)
  const [existingOrders, setExistingOrders] = useState<any[]>([])
  const [showExistingOrders, setShowExistingOrders] = useState(false)
  const [deviceId, setDeviceId] = useState("")
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  useEffect(() => {
    // Generate or get existing device ID
    const getDeviceId = () => {
      let id = localStorage.getItem('qr_device_id')
      if (!id) {
        id = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('qr_device_id', id)
      }
      return id
    }

    const currentDeviceId = getDeviceId()
    setDeviceId(currentDeviceId)

    if (restaurantId && tableNumber) {
      fetchRestaurantData()
      fetchMenuItems()
      checkExistingOrders(currentDeviceId)
    }
  }, [restaurantId, tableNumber])

  const checkExistingOrders = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/orders/device/${deviceId}?restaurantId=${restaurantId}&tableNumber=${tableNumber}`)
      if (response.ok) {
        const orders = await response.json()
        // Filter orders: hide delivered orders older than 3 hours
        const recentOrders = orders.filter((order: any) => {
          if (order.status === 'DELIVERED') {
            const orderTime = new Date(order.updatedAt).getTime()
            const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000)
            return orderTime > threeHoursAgo
          }
          return true // Show all non-delivered orders
        })

        setExistingOrders(recentOrders)

        if (recentOrders.length > 0) {
          // Check if there's a recent active order (not delivered or cancelled)
          const activeOrder = recentOrders.find((order: any) =>
            order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
          )

          if (activeOrder) {
            // IMPORTANT: Auto-redirect PENDING orders to payment (force payment)
            // Redirect CONFIRMED/PREPARING/READY orders to tracking
            if (activeOrder.status === 'PENDING') {
              // Force payment completion - redirect directly to payment page
              window.location.href = `/payment/${activeOrder.id}`
              return
            } else {
              // Redirect to track orders that are in progress
              window.location.href = `/track/${activeOrder.id}`
              return
            }
          } else {
            // Only show existing orders popup if all orders are delivered
            setShowExistingOrders(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing orders:', error)
    }
  }

  const fetchRestaurantData = async () => {
    try {
      const response = await fetch(`/api/public/restaurant/${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data)
      } else {
        // No fallback - keep null restaurant
        setRestaurant(null)
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error)
      // No fallback - keep null restaurant
      setRestaurant(null)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/public/menu/${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }

    // No fallback - show error message instead of fake menu items
    setMenuItems([])
    setIsLoading(false)
  }

  const categories = ["all", ...new Set(menuItems.map(item => item.category))]

  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItem.id)
    
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.menuItem.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setOrderItems([...orderItems, { menuItem, quantity: 1 }])
    }
  }

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItem.id !== menuItemId))
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(menuItemId)
    } else {
      setOrderItems(orderItems.map(item => 
        item.menuItem.id === menuItemId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0)
  }

  const handleCheckout = async () => {
    console.log('=== CHECKOUT DEBUG ===')
    console.log('Starting checkout process...')

    if (orderItems.length === 0 || !customerName.trim() || isCreatingOrder) {
      console.log('Checkout blocked:', { orderItems: orderItems.length, customerName: customerName.trim(), isCreatingOrder })
      return
    }

    setIsCreatingOrder(true)
    try {
      // Try to create a real order first
      const orderData = {
        customerName: customerName.trim(),
        restaurantId: restaurantId as string,
        tableNumber: parseInt(tableNumber as string),
        total: getTotalAmount(),
        deviceId: deviceId, // Add device ID for tracking
        orderItems: orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price.toString()
        }))
      }

      console.log('Creating order with data:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      console.log('Order API response status:', response.status)

      if (response.ok) {
        const createdOrder = await response.json()
        console.log('Order created successfully:', createdOrder)
        console.log('Redirecting to payment page:', `/payment/${createdOrder.id}`)

        // Redirect to real payment page
        window.location.href = `/payment/${createdOrder.id}`
        return
      } else {
        const errorData = await response.text()
        console.error('Order creation failed:', response.status, errorData)
        alert('Failed to create order. Please try again.')
      }
    } catch (error) {
      console.error('Error creating real order:', error)
      alert('Error creating order. Please try again or contact the restaurant.')
      setIsCreatingOrder(false)
      return
    } finally {
      // Reset on any error or failure
      if (!window.location.href.includes('/payment/')) {
        setIsCreatingOrder(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurant?.name || "Restaurant Menu"}
              </h1>
              <p className="text-sm text-orange-700">Table {tableNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-700">Items: {orderItems.length}</div>
              <div className="font-bold text-lg text-indigo-600">
                ${getTotalAmount().toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Orders Section */}
      {showExistingOrders && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900">Your Active Orders</h2>
              <button
                onClick={() => setShowExistingOrders(false)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Hide
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {existingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Order #{order.id.slice(-8)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PREPARING' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'READY' ? 'bg-green-100 text-green-800' :
                          order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {order.orderItems.length} items • ${order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {order.status === 'PENDING' ? (
                      <button
                        onClick={() => window.location.href = `/payment/${order.id}`}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Complete Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => window.location.href = `/track/${order.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Track Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowExistingOrders(false)}
                className="flex-1 bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50"
              >
                🍽️ Place New Order
              </button>
              <button
                onClick={() => window.location.href = `/track-all/${deviceId}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                📱 View All Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-3 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {category === "all" ? "All Items" : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  {item.description && (
                    <p className="text-orange-700 text-sm mt-1">{item.description}</p>
                  )}
                  <p className="text-indigo-600 font-bold text-lg mt-2">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => addToOrder(item)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    disabled={!item.available}
                  >
                    {item.available ? "Add to Order" : "Unavailable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-orange-700">{orderItems.length} items</p>
                <p className="text-lg font-bold text-gray-900">
                  Total: ${getTotalAmount().toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Review Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Order</h3>
              
              {/* Customer Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (for order tracking)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 placeholder-orange-600 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Order Items */}
              <div className="mb-4 max-h-60 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium">{item.menuItem.name}</p>
                      <p className="text-sm text-orange-700">${item.menuItem.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCheckout}
                  disabled={!customerName.trim() || orderItems.length === 0 || isCreatingOrder}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium"
                >
                  {isCreatingOrder ? "Creating Order..." : "Proceed to Payment"}
                </button>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}