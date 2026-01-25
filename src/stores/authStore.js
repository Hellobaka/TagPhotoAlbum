import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { photoApi } from '@/api/photoApi'
import { useNotificationStore } from './notificationStore'
import API_CONFIG from '@/config/api'
import CryptoJS from 'crypto-js'
import { setStorage, getStorage, removeStorage, StorageKeys } from '@/utils/storage'

// 安全登录相关工具函数
const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 使用crypto-js实现HMAC-SHA256，与后端算法保持一致
const calculateHMAC = async (payload) => {
  const hmac = CryptoJS.HmacSHA256(payload, API_CONFIG.HMAC_KEY)
  return hmac.toString(CryptoJS.enc.Hex)
}

// 使用SHA-256计算密码哈希
const calculatePasswordHash = async (password) => {
  const hash = CryptoJS.SHA256(password)
  return CryptoJS.enc.Base64.stringify(hash)
}

// 转换 base64url 为字节数组
const base64urlToBytes = (base64url) => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  const binaryString = atob(padded)
  return Uint8Array.from(binaryString, c => c.charCodeAt(0))
}

// 转换 ArrayBuffer 为 base64url
const arrayBufferToBase64Url = (arrayBuffer) => {
  const uint8Array = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer)
  let binaryString = ''
  const chunkSize = 8192

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize))
  }

  const base64 = btoa(binaryString)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

// 保存登录状态到存储
const saveAuthState = (token, user, additionalData = {}) => {
  setStorage(StorageKeys.AUTH_TOKEN, token)
  setStorage(StorageKeys.AUTH_USER, user)
  
  if (additionalData.serverTimestamp) {
    setStorage('server_timestamp', additionalData.serverTimestamp)
  }
  if (additionalData.nextNonceSeed) {
    setStorage('next_nonce_seed', additionalData.nextNonceSeed)
  }
}

// 清除登录状态
const clearAuthState = () => {
  removeStorage(StorageKeys.AUTH_TOKEN)
  removeStorage(StorageKeys.AUTH_USER)
  removeStorage('server_timestamp')
  removeStorage('next_nonce_seed')
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const currentUser = computed(() => user.value)
  const isLoggedIn = computed(() => isAuthenticated.value)

  // PassKey 相关方法
  const getPasskeyAuthenticationOptions = async (username) => {
    try {
      const response = await photoApi.getPasskeyAuthenticationOptions(username)
      return response.data
    } catch (error) {
      console.error('Failed to get passkey authentication options:', error)
      throw error
    }
  }

  const authenticateWithPasskey = async (authenticationData) => {
    try {
      const response = await photoApi.authenticateWithPasskey(authenticationData)
      return response
    } catch (error) {
      console.error('Failed to authenticate with passkey:', error)
      throw error
    }
  }

  const getPasskeyRegistrationOptions = async (userInfo) => {
    try {
      const response = await photoApi.getPasskeyRegistrationOptions(userInfo)
      return response.data
    } catch (error) {
      console.error('Failed to get passkey registration options:', error)
      throw error
    }
  }

  const registerPasskey = async (registrationData) => {
    try {
      const response = await photoApi.registerPasskey(registrationData)
      return response
    } catch (error) {
      console.error('Failed to register passkey:', error)
      throw error
    }
  }

  // PassKey 登录
  const loginWithPasskey = async () => {
    isLoading.value = true

    try {
      const options = await getPasskeyAuthenticationOptions('')

      const publicKey = {
        challenge: base64urlToBytes(options.challenge),
        allowCredentials: options.allowCredentials?.map(credId => ({
          id: base64urlToBytes(credId),
          type: 'public-key',
          transports: ['internal', 'hybrid']
        })) || [],
        timeout: options.timeout || 60000,
        userVerification: options.userVerification || 'preferred',
        rpId: options.relyingPartyId || window.location.hostname
      }

      const credential = await navigator.credentials.get({ publicKey })

      const authenticationData = {
        response: {
          id: credential.id,
          rawId: arrayBufferToBase64Url(credential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
            authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
            signature: arrayBufferToBase64Url(credential.response.signature),
            userHandle: credential.response.userHandle ?
              arrayBufferToBase64Url(credential.response.userHandle) : null
          },
          type: credential.type
        },
        challenge: options.challenge
      }

      const result = await authenticateWithPasskey(authenticationData)

      if (result && result.success) {
        console.log('Passkey login successful')
        user.value = result.data.user
        isAuthenticated.value = true
        saveAuthState(result.data.token, result.data.user)
        return [true, '通行密钥登录成功']
      }

      return [false, '通行密钥认证失败']
    } catch (error) {
      console.error('Passkey login error:', error)

      const notificationStore = useNotificationStore()

      if (error.name === 'NotAllowedError') {
        notificationStore.showError('用户取消了认证')
        return [false, '用户取消了认证']
      } else if (error.name === 'NotSupportedError') {
        notificationStore.showError('浏览器不支持通行密钥')
        return [false, '浏览器不支持通行密钥']
      } else {
        notificationStore.showError(error.message || '通行密钥登录失败')
        return [false, error.message || '通行密钥登录失败']
      }
    } finally {
      isLoading.value = false
    }
  }

  // 传统密码登录
  const login = async (username, password) => {
    isLoading.value = true

    try {
      console.log('Login attempt:', { username })

      const timestamp = Date.now()
      const nonce = generateNonce()
      const passwordHash = await calculatePasswordHash(password)
      const payload = `${username}:${passwordHash}:${timestamp}:${nonce}`
      const signature = await calculateHMAC(payload)

      const secureCredentials = {
        username,
        passwordHash,
        timestamp,
        nonce,
        signature
      }

      const response = await photoApi.login(secureCredentials)

      if (response && response.success) {
        console.log('Login successful')
        user.value = response.data.user
        isAuthenticated.value = true
        saveAuthState(response.data.token, response.data.user, {
          serverTimestamp: response.data.serverTimestamp,
          nextNonceSeed: response.data.nextNonceSeed
        })
        return [true, '登录成功']
      }

      console.log('Secure login failed - invalid credentials')
      return [false, '用户名或密码错误']
    } catch (error) {
      console.error('Secure login error:', error)
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
    clearAuthState()
  }

  const checkAuth = () => {
    const token = getStorage(StorageKeys.AUTH_TOKEN)
    const userData = getStorage(StorageKeys.AUTH_USER)

    if (token && userData) {
      try {
        user.value = userData
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
    loginWithPasskey,
    logout,
    checkAuth,
    validateToken,
    initialize
  }
})