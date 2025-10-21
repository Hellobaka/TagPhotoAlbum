import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { photoApi } from '@/api/photoApi'
import { useNotificationStore } from './notificationStore'
import API_CONFIG from '@/config/api'

// 安全登录相关工具函数
const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 使用Web Crypto API实现HMAC-SHA256，与后端算法保持一致
const calculateHMAC = async (payload) => {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(API_CONFIG.HMAC_KEY)
  const payloadData = encoder.encode(payload)

  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // 计算HMAC
  const signature = await crypto.subtle.sign('HMAC', key, payloadData)

  // 将ArrayBuffer转换为十六进制字符串（与后端保持一致）
  const signatureArray = Array.from(new Uint8Array(signature))
  const hexSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hexSignature
}

// 使用SHA-256计算密码哈希
const calculatePasswordHash = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return btoa(String.fromCharCode.apply(null, hashArray))
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const currentUser = computed(() => user.value)
  const isLoggedIn = computed(() => isAuthenticated.value)

  // 登录
  const login = async (username, password) => {
    isLoading.value = true

    try {
      console.log('Login attempt:', { username })

      // 生成安全参数
      const timestamp = Date.now()
      const nonce = generateNonce()

      // 计算密码哈希
      const passwordHash = await calculatePasswordHash(password)

      // 构建签名载荷
      const payload = `${username}:${passwordHash}:${timestamp}:${nonce}`

      // 计算HMAC签名（使用配置的HMAC密钥）
      const signature = await calculateHMAC(payload)

      // 构建安全登录凭据
      const secureCredentials = {
        username,
        passwordHash,
        timestamp,
        nonce,
        signature
      }

      // 调用登录API
      const response = await photoApi.login(secureCredentials)

      if (response && response.success) {
        console.log('Login successful')
        user.value = response.data.user
        isAuthenticated.value = true

        // 保存登录状态到 localStorage
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('server_timestamp', response.data.serverTimestamp)
        localStorage.setItem('next_nonce_seed', response.data.nextNonceSeed)

        return [true, '登录成功']
      }

      console.log('Secure login failed - invalid credentials')
      return [false, '用户名或密码错误']
    } catch (error) {
      console.error('Secure login error:', error)

      // 显示错误到SnackBar
      const notificationStore = useNotificationStore()
      notificationStore.showError(error.message || '登录失败，请稍后重试')

      return [false, error.message || '服务端异常']
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

  // 验证令牌有效性
  const validateToken = async () => {
    try {
      const response = await photoApi.validateToken()
      return response.success
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
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
    validateToken,
    initialize
  }
})