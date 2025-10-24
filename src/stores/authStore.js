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

  const base64urlToBytes = (base64url) => {
    const base64 = base64url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binaryString = atob(padded);
    return Uint8Array.from(binaryString, c => c.charCodeAt(0));
  }

  const arrayBufferToBase64Url = (arrayBuffer) => {
    // 1. 确保输入是 ArrayBuffer 或 Uint8Array，并转换为 Uint8Array 视图
    const uint8Array = arrayBuffer instanceof Uint8Array
      ? arrayBuffer
      : new Uint8Array(arrayBuffer);

    // 2. 将 Uint8Array 转换为一个 "binary string"
    //    btoa() 函数期望一个字符串，其中每个字符的编码点代表一个字节。
    //    对于大型 ArrayBuffer，直接使用 String.fromCharCode(...uint8Array) 会导致栈溢出。
    //    因此，我们使用分块处理的方式。
    let binaryString = '';
    const chunkSize = 8192; // 可以根据需要调整分块大小，例如 8KB

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binaryString += String.fromCharCode.apply(
        null, // apply 的第一个参数是 this，这里不需要
        uint8Array.subarray(i, i + chunkSize) // 获取当前分块
      );
    }

    // 3. 将二进制字符串编码为标准的 Base64
    const base64 = btoa(binaryString);

    // 4. 将标准 Base64 转换为 Base64Url
    //    - 替换 '+' 为 '-'
    //    - 替换 '/' 为 '_'
    //    - 移除末尾的 '=' 填充字符
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };

  // PassKey 登录
  const loginWithPasskey = async () => {
    isLoading.value = true

    try {
      // 1. 从后端获取认证选项
      const options = await getPasskeyAuthenticationOptions('')

      // 2. 转换选项格式为 WebAuthn 标准格式
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

      // 3. 调用 WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey
      })

      // 4. 转换认证结果
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

      // 5. 发送认证结果到后端验证
      const result = await authenticateWithPasskey(authenticationData)

      if (result && result.success) {
        console.log('Passkey login successful')
        user.value = result.data.user
        isAuthenticated.value = true

        // 保存登录状态到 localStorage
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('user', JSON.stringify(result.data.user))

        return [true, '通行密钥登录成功']
      }

      return [false, '通行密钥认证失败']
    } catch (error) {
      console.error('Passkey login error:', error)

      // 显示错误到SnackBar
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
    loginWithPasskey,
    logout,
    checkAuth,
    validateToken,
    initialize
  }
})