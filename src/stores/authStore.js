import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { photoApi } from '@/api/photoApi'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const currentUser = computed(() => user.value)
  const isLoggedIn = computed(() => isAuthenticated.value)

  // 方法
  const login = async (username, password) => {
    isLoading.value = true

    try {
      console.log('AuthStore login attempt:', { username, password })

      // 调用真实 API 进行登录
      const response = await photoApi.login({ username, password })

      if (response && response.success) {
        console.log('Login successful')
        user.value = response.user
        isAuthenticated.value = true

        // 保存登录状态到 localStorage
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        return [true, '登录成功']
      }

      console.log('Login failed - invalid credentials')
      return [false, '用户名或密码错误']
    } catch (error) {
      console.error('Login error:', error)
      return [false, '服务端异常']
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

    if (token && userData && userData !== 'undefined') {
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