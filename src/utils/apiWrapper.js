/**
 * 统一的 API 调用包装器和错误处理
 * 提供一致的异常处理、请求拦截、响应验证
 */

import { useNotificationStore } from '@/stores/notificationStore'

/**
 * 标准化的 API 调用包装器
 * @param {Function} apiCall - API 调用函数
 * @param {string} errorMessage - 默认错误消息
 * @param {boolean} showNotification - 是否显示错误通知
 * @returns {Promise<any>}
 */
export const executeApiCall = async (apiCall, errorMessage = 'Operation failed', showNotification = true) => {
  const notificationStore = useNotificationStore()

  try {
    const response = await apiCall()
    return response
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || errorMessage
    
    if (showNotification) {
      notificationStore.showError(message)
    }
    
    throw error
  }
}

/**
 * 批量执行 API 调用
 * @param {Array<Function>} apiCalls - API 调用函数数组
 * @param {boolean} continueOnError - 失败后是否继续执行
 * @returns {Promise<Array>}
 */
export const executeBatchApiCalls = async (apiCalls, continueOnError = false) => {
  const notificationStore = useNotificationStore()
  const results = []
  const errors = []

  for (const apiCall of apiCalls) {
    try {
      const result = await apiCall()
      results.push(result)
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'API call failed'
      errors.push({ message, error })

      if (!continueOnError) {
        notificationStore.showError(message)
        throw error
      }
    }
  }

  if (errors.length > 0) {
    notificationStore.showWarning(`${errors.length} operation(s) failed`)
  }

  return results
}

/**
 * 执行异步操作，带加载状态管理
 * @param {Function} operation - 异步操作函数
 * @param {Object} loadingState - 加载状态引用 { value: boolean }
 * @returns {Promise<any>}
 */
export const executeWithLoading = async (operation, loadingState) => {
  try {
    loadingState.value = true
    return await operation()
  } finally {
    loadingState.value = false
  }
}

/**
 * 重试失败的 API 调用
 * @param {Function} apiCall - API 调用函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 重试延迟（毫秒）
 * @returns {Promise<any>}
 */
export const retryApiCall = async (apiCall, maxRetries = 3, delayMs = 1000) => {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError
}

/**
 * 验证 API 响应
 * @param {any} response - API 响应
 * @param {string} errorMessage - 验证失败时的错误消息
 * @returns {boolean}
 */
export const validateApiResponse = (response, errorMessage = 'Invalid response') => {
  if (!response) {
    throw new Error(errorMessage)
  }

  return true
}

export default {
  executeApiCall,
  executeBatchApiCalls,
  executeWithLoading,
  retryApiCall,
  validateApiResponse,
}
