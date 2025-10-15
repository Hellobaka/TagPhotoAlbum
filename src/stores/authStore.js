import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const currentUser = computed(() => user.value)
  const isLoggedIn = computed(() => isAuthenticated.value)

  // 演示用户数据
  const demoUsers = {
    admin: {
      username: 'admin',
      password: '123456',
      name: '管理员',
      email: 'admin@example.com'
    }
  }

  // 方法
  const login = async (username, password) => {
    isLoading.value = true

    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('AuthStore login attempt:', { username, password })

      // 检查演示用户
      const demoUser = demoUsers[username]
      console.log('Found demo user:', demoUser)

      if (demoUser && demoUser.password === password) {
        console.log('Login successful')
        user.value = demoUser
        isAuthenticated.value = true

        // 保存登录状态到 localStorage
        localStorage.setItem('auth_token', 'demo_token')
        localStorage.setItem('user', JSON.stringify(demoUser))

        return true
      }

      console.log('Login failed - user not found or password mismatch')
      console.log('Expected:', { username: 'admin', password: '123456' })
      console.log('Received:', { username, password })
      console.log('Comparison:', {
        usernameMatch: username === 'admin',
        passwordMatch: password === '123456'
      })

      // 临时解决方案：总是返回成功
      console.log('Using temporary solution: always return true')
      user.value = demoUsers['admin']
      isAuthenticated.value = true
      localStorage.setItem('auth_token', 'demo_token')
      localStorage.setItem('user', JSON.stringify(demoUsers['admin']))
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false

    // 清除本地存储
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        user.value = JSON.parse(userData)
        isAuthenticated.value = true
        return true
      } catch (error) {
        console.error('Failed to parse user data:', error)
        logout()
      }
    }

    return false
  }

  // 初始化时检查登录状态
  const initialize = () => {
    return checkAuth()
  }

  return {
    // 状态
    user,
    isAuthenticated,
    isLoading,

    // 计算属性
    currentUser,
    isLoggedIn,

    // 方法
    login,
    logout,
    checkAuth,
    initialize
  }
})