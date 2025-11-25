import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { cartService } from '../services'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      // Load from localStorage for guest users
      const savedCart = localStorage.getItem('cart')
      const savedRestaurant = localStorage.getItem('cart_restaurant')
      
      if (savedCart && savedCart !== 'undefined') {
        try {
          setCart(JSON.parse(savedCart))
        } catch (error) {
          console.error('Error parsing cart:', error)
          localStorage.removeItem('cart')
        }
      }
      if (savedRestaurant && savedRestaurant !== 'undefined') {
        try {
          setRestaurant(JSON.parse(savedRestaurant))
        } catch (error) {
          console.error('Error parsing restaurant:', error)
          localStorage.removeItem('cart_restaurant')
        }
      }
    }
  }, [user])

  const fetchCart = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await cartService.getAll()
      
      if (data && data.length > 0) {
        // Transform API response to match frontend cart structure
        const transformedCart = data.map(item => ({
          id: item.id,
          item_id: item.menu_item_id,
          name: item.menu_item.name,
          price: parseFloat(item.menu_item.price),
          quantity: item.quantity,
          image_url: item.menu_item.image_url,
          special_instructions: item.special_instructions,
        }))
        setCart(transformedCart)
        
        // Set restaurant info from first item
        if (data[0].restaurant) {
          setRestaurant({
            restaurant_id: data[0].restaurant.id,
            restaurant_name: data[0].restaurant.name,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (item, restaurantInfo) => {
    // Check if restaurant is different
    if (restaurant && restaurant.restaurant_id !== restaurantInfo.restaurant_id) {
      toast.warning('Bạn chỉ có thể đặt món từ một nhà hàng tại một thời điểm!')
      return false
    }

    if (!user) {
      // Guest user - use localStorage
      const existingItem = cart.find(cartItem => cartItem.item_id === item.item_id)
      
      let newCart
      if (existingItem) {
        newCart = cart.map(cartItem =>
          cartItem.item_id === item.item_id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        )
      } else {
        newCart = [...cart, item]
      }

      setCart(newCart)
      setRestaurant(restaurantInfo)
      localStorage.setItem('cart', JSON.stringify(newCart))
      localStorage.setItem('cart_restaurant', JSON.stringify(restaurantInfo))
      
      toast.success('Đã thêm vào giỏ hàng!')
      return true
    }

    // Logged in user - use API
    try {
      setLoading(true)
      await cartService.add({
        restaurant_id: restaurantInfo.restaurant_id,
        menu_item_id: item.item_id,
        quantity: item.quantity,
        special_instructions: item.special_instructions || null,
      })
      
      // Refetch cart to get updated data
      await fetchCart()
      toast.success('Đã thêm vào giỏ hàng!')
      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng')
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId) => {
    if (!user) {
      // Guest user - use localStorage
      const newCart = cart.filter(item => item.item_id !== itemId)
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
      
      if (newCart.length === 0) {
        clearCart()
      }
      
      toast.info('Đã xóa khỏi giỏ hàng')
      return
    }

    // Logged in user - use API
    try {
      setLoading(true)
      // Find the cart item's ID (not menu_item_id)
      const cartItem = cart.find(item => item.item_id === itemId)
      if (cartItem && cartItem.id) {
        await cartService.remove(cartItem.id)
        await fetchCart()
        toast.info('Đã xóa khỏi giỏ hàng')
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      toast.error('Không thể xóa khỏi giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId)
      return
    }

    if (!user) {
      // Guest user - use localStorage
      const newCart = cart.map(item =>
        item.item_id === itemId ? { ...item, quantity } : item
      )
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
      return
    }

    // Logged in user - use API
    try {
      setLoading(true)
      // Find the cart item's ID (not menu_item_id)
      const cartItem = cart.find(item => item.item_id === itemId)
      if (cartItem && cartItem.id) {
        await cartService.update(cartItem.id, { quantity })
        await fetchCart()
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Không thể cập nhật số lượng')
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user) {
      // Guest user - use localStorage
      setCart([])
      setRestaurant(null)
      localStorage.removeItem('cart')
      localStorage.removeItem('cart_restaurant')
      return
    }

    // Logged in user - use API
    try {
      setLoading(true)
      await cartService.clear()
      setCart([])
      setRestaurant(null)
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Không thể xóa giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const value = {
    cart,
    restaurant,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    fetchCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
