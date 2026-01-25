import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'

/**
 * 通用异步操作管理 composable
 * 
 * 标准化 loading/error 状态管理和错误通知逻辑
 * 
 * @param {Object} options
 * @param {string} options.errorMessage - 操作失败时的提示消息
 * @param {string} options.notificationType - 错误通知类型 ('error', 'warning', 等)
 * @param {boolean} options.showNotification - 是否自动显示错误通知，默认 true
 * 
 * @returns {Object} { isLoading, error, execute }
 * 
 * @example
 * const { isLoading, error, execute } = useAsyncOperation({
 *   errorMessage: '保存失败，请重试',
 *   notificationType: 'error'
 * })
 * 
 * await execute(async () => {
 *   return await someAsyncOperation()
 * })
 */
export function useAsyncOperation(options = {}) {
  const {
    errorMessage = '操作失败',
    notificationType = 'error',
    showNotification = true
  } = options

  const notificationStore = useNotificationStore()
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * 执行异步操作，自动处理 loading 和 error 状态
   * @param {Function} asyncFn - 异步操作函数
   * @returns {Promise}
   */
  const execute = async (asyncFn) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await asyncFn()
      return result
    } catch (err) {
      error.value = err.message || errorMessage
      if (showNotification) {
        notificationStore.showSnackbar(error.value, notificationType)
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 手动设置错误
  const setError = (errorMsg) => {
    error.value = errorMsg
    if (showNotification && errorMsg) {
      notificationStore.showSnackbar(errorMsg, notificationType)
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    isLoading,
    error,
    execute,
    setError,
    clearError
  }
}
