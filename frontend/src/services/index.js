import api from './api'

export const authService = {
  // Register new user
  register: async (data) => {
    const response = await api.post('/register', data)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/login', credentials)
    return response.data
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/logout')
    return response.data
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/me')
    return response.data
  },
}

export const restaurantService = {
  // Get all restaurants
  getAll: async (params) => {
    const response = await api.get('/restaurants', { params })
    return response.data
  },

  // Get restaurant by ID
  getById: async (id) => {
    const response = await api.get(`/restaurants/${id}`)
    return response.data
  },

  // Create restaurant
  create: async (data) => {
    const response = await api.post('/restaurants', data)
    return response.data
  },

  // Update restaurant
  update: async (id, data) => {
    const response = await api.put(`/restaurants/${id}`, data)
    return response.data
  },

  // Delete restaurant
  delete: async (id) => {
    const response = await api.delete(`/restaurants/${id}`)
    return response.data
  },
}

export const menuService = {
  // Get menu items
  getMenuItems: async (params) => {
    const response = await api.get('/menu-items', { params })
    return response.data
  },

  // Get menu items by restaurant
  getByRestaurant: async (restaurantId) => {
    const response = await api.get(`/restaurants/${restaurantId}/menu`)
    return response.data
  },

  // Get menu item by ID
  getById: async (id) => {
    const response = await api.get(`/menu-items/${id}`)
    return response.data
  },
}

export const cartService = {
  // Get cart items
  getAll: async () => {
    const response = await api.get('/cart')
    return response.data
  },

  // Add item to cart
  add: async (data) => {
    const response = await api.post('/cart', data)
    return response.data
  },

  // Update cart item
  update: async (id, data) => {
    const response = await api.put(`/cart/${id}`, data)
    return response.data
  },

  // Remove cart item
  remove: async (id) => {
    const response = await api.delete(`/cart/${id}`)
    return response.data
  },

  // Clear cart
  clear: async () => {
    const response = await api.delete('/cart')
    return response.data
  },
}

export const orderService = {
  // Get all orders
  getAll: async (params) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  // Get order by ID
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Create order
  create: async (data) => {
    const response = await api.post('/orders', data)
    return response.data
  },

  // Update order status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status })
    return response.data
  },

  // Cancel order
  cancel: async (id) => {
    const response = await api.post(`/orders/${id}/cancel`)
    return response.data
  },
}

export const reviewService = {
  // Get reviews
  getAll: async (params) => {
    const response = await api.get('/reviews', { params })
    return response.data
  },

  // Create review
  create: async (data) => {
    const response = await api.post('/reviews', data)
    return response.data
  },

  // Delete review
  delete: async (id) => {
    const response = await api.delete(`/reviews/${id}`)
    return response.data
  },
}

export const notificationService = {
  // Get all notifications
  getAll: async () => {
    const response = await api.get('/notifications')
    return response.data
  },

  // Get unread notifications
  getUnread: async () => {
    const response = await api.get('/notifications/unread')
    return response.data
  },

  // Mark as read
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all')
    return response.data
  },
}
