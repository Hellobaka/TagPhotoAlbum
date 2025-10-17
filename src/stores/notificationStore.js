import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    activeMessages: [], // 当前显示的消息
    maxVisible: 3, // 同时显示的最大通知数量
  }),

  actions: {
    showMessage(message, type = 'info', duration = 3000) {
      const messageObj = {
        id: Date.now() + Math.random(), // 确保唯一ID
        text: message,
        type,
        duration,
        timestamp: Date.now()
      }

      // 添加到活动消息列表
      this.activeMessages.push(messageObj)

      // 如果超过最大显示数量，移除最早的消息
      if (this.activeMessages.length > this.maxVisible) {
        this.activeMessages.shift()
      }

      // 设置自动移除
      setTimeout(() => {
        this.removeMessage(messageObj.id)
      }, duration)
    },

    showError(message, duration = 5000) {
      this.showMessage(message, 'error', duration)
    },

    showSuccess(message, duration = 3000) {
      this.showMessage(message, 'success', duration)
    },

    showWarning(message, duration = 4000) {
      this.showMessage(message, 'warning', duration)
    },

    showInfo(message, duration = 3000) {
      this.showMessage(message, 'info', duration)
    },

    // 新增更多通知类型
    showLoading(message, duration = 0) {
      this.showMessage(message, 'loading', duration) // duration=0表示不自动关闭
    },

    showDebug(message, duration = 3000) {
      this.showMessage(message, 'debug', duration)
    },

    removeMessage(id) {
      const index = this.activeMessages.findIndex(msg => msg.id === id)
      if (index !== -1) {
        this.activeMessages.splice(index, 1)
      }
    },

    clearAll() {
      this.activeMessages = []
    },

    // 设置最大显示数量
    setMaxVisible(max) {
      this.maxVisible = max
      // 如果当前显示数量超过新的最大值，移除最早的消息
      while (this.activeMessages.length > this.maxVisible) {
        this.activeMessages.shift()
      }
    }
  },

  getters: {
    hasMessages: (state) => state.activeMessages.length > 0,
    visibleMessages: (state) => state.activeMessages.slice(-state.maxVisible) // 显示最新的消息
  }
})