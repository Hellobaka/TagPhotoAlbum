import { onMounted, onUnmounted } from 'vue'

/**
 * 简化 DOM 事件监听和自动清理的 composable
 * 
 * 自动在组件挂载时添加事件监听，卸载时移除
 * 支持同时监听多个事件
 * 
 * @param {Object} eventsConfig - 事件配置对象
 * @param {string} eventsConfig.eventName - 事件名称 (e.g. 'scroll', 'resize', 'dragover')
 * @param {Function} eventsConfig.handler - 事件处理函数
 * @param {HTMLElement|Window|Document} eventsConfig.target - 事件目标，默认 window
 * @param {Object} eventsConfig.options - addEventListener 选项 (e.g. { passive: true })
 * 
 * @example
 * // 单个事件
 * useEventListener({
 *   eventName: 'scroll',
 *   handler: handleScroll,
 *   target: window,
 *   options: { passive: true }
 * })
 * 
 * // 多个事件
 * useEventListener([
 *   { eventName: 'dragover', handler: handleDragOver },
 *   { eventName: 'dragleave', handler: handleDragLeave }
 * ])
 */
export function useEventListener(eventsConfig) {
  const listeners = []

  const addListener = (config) => {
    const {
      eventName,
      handler,
      target = window,
      options = false
    } = config

    if (!eventName || !handler) {
      console.warn('useEventListener: eventName and handler are required')
      return
    }

    target.addEventListener(eventName, handler, options)
    listeners.push({ eventName, handler, target, options })
  }

  // 支持数组或单个对象
  if (Array.isArray(eventsConfig)) {
    eventsConfig.forEach(config => addListener(config))
  } else {
    addListener(eventsConfig)
  }

  // 自动清理
  onUnmounted(() => {
    listeners.forEach(({ eventName, handler, target, options }) => {
      target.removeEventListener(eventName, handler, options)
    })
    listeners.length = 0
  })

  // 返回手动移除监听器的方法
  return {
    /**
     * 手动移除特定的事件监听器
     * @param {string} eventName - 事件名称
     * @param {HTMLElement|Window|Document} target - 事件目标，默认 window
     */
    removeListener: (eventName, target = window) => {
      const index = listeners.findIndex(
        l => l.eventName === eventName && l.target === target
      )
      if (index !== -1) {
        const { handler, options } = listeners[index]
        target.removeEventListener(eventName, handler, options)
        listeners.splice(index, 1)
      }
    },

    /**
     * 清除所有事件监听器
     */
    clearAllListeners: () => {
      listeners.forEach(({ eventName, handler, target, options }) => {
        target.removeEventListener(eventName, handler, options)
      })
      listeners.length = 0
    }
  }
}
