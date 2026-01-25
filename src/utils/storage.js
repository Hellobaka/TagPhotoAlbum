/**
 * 统一的 localStorage 管理工具
 * 提供类型安全的存取操作
 */

const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  THEME: 'theme',
  EXCLUDED_PHOTOS: 'excluded_photos',
}

/**
 * 设置存储值
 * @param {string} key - 存储键
 * @param {*} value - 存储值
 */
export const setStorage = (key, value) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Failed to set storage for key: ${key}`, error)
  }
}

/**
 * 获取存储值
 * @param {string} key - 存储键
 * @param {*} defaultValue - 默认值
 * @returns {*} 存储值或默认值
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return defaultValue

    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  } catch (error) {
    console.error(`Failed to get storage for key: ${key}`, error)
    return defaultValue
  }
}

/**
 * 移除存储值
 * @param {string} key - 存储键
 */
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove storage for key: ${key}`, error)
  }
}

/**
 * 清空所有存储
 */
export const clearStorage = () => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Failed to clear storage', error)
  }
}

/**
 * 检查存储值是否存在
 * @param {string} key - 存储键
 * @returns {boolean}
 */
export const hasStorage = (key) => {
  return localStorage.getItem(key) !== null
}

export { StorageKeys }
export default StorageKeys
