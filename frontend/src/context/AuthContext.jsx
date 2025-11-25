import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { authService } from '../services'
import { toast } from 'react-toastify'
import { registerUser } from '../hooks/useSocket'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('auth_token')
    const savedUser = Cookies.get('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials)
      const response = await authService.login(credentials)
      console.log('Login response:', response)
      
      const { user, access_token } = response
      
      Cookies.set('auth_token', access_token, { expires: 7 })
      Cookies.set('user', JSON.stringify(user), { expires: 7 })
      setUser(user)
      
      // Register user with WebSocket immediately after login
      setTimeout(() => registerUser(), 100);
      
      toast.success('Đăng nhập thành công!')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error response:', error.response)
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại')
      return { success: false, error }
    }
  }

  const register = async (data) => {
    try {
      console.log('Attempting register with:', data)
      const response = await authService.register(data)
      console.log('Register response:', response)
      
      const { user, access_token } = response
      
      Cookies.set('auth_token', access_token, { expires: 7 })
      Cookies.set('user', JSON.stringify(user), { expires: 7 })
      setUser(user)
      
      // Register user with WebSocket immediately after register
      setTimeout(() => registerUser(), 100);
      
      toast.success('Đăng ký thành công!')
      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      console.error('Error response:', error.response)
      toast.error(error.response?.data?.message || 'Đăng ký thất bại')
      return { success: false, error }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      Cookies.remove('auth_token')
      Cookies.remove('user')
      setUser(null)
      toast.info('Đã đăng xuất')
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
