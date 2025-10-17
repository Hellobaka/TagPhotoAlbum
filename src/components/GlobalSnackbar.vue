<template>
  <div class="notifications-wrapper">
    <div
      v-for="message in visibleMessages"
      :key="message.id"
      class="notification-container"
      :class="[getMessageTypeClass(message.type), { 'notification-exiting': exitingMessages.has(message.id) }]"
      :style="getNotificationStyle(message)"
    >
      <div class="notification-content">
        <div class="notification-icon-text">
          <md-icon v-if="getIconName(message.type)" class="notification-icon">
            {{ getIconName(message.type) }}
          </md-icon>
          <span class="notification-text">{{ message.text }}</span>
        </div>
        <md-icon-button class="close-button" @click="handleClose(message.id)">
          <md-icon>close</md-icon>
        </md-icon-button>
      </div>
      <div
        v-if="message.duration > 0"
        class="notification-progress"
        :style="getProgressStyle(message)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

// 当前显示的消息
const visibleMessages = computed(() => notificationStore.visibleMessages)

// 正在退出的消息ID集合
const exitingMessages = ref(new Set())

// 进度条状态
const progressStates = ref({})

// 获取消息类型对应的CSS类
const getMessageTypeClass = (type) => {
  return `notification-${type}`
}

// 获取消息类型对应的图标
const getIconName = (type) => {
  const icons = {
    error: 'error',
    success: 'check_circle',
    warning: 'warning',
    info: 'info',
    loading: 'progress_activity',
    debug: 'bug_report'
  }
  return icons[type] || 'info'
}

// 获取通知容器的样式（用于堆叠显示）
const getNotificationStyle = (message) => {
  const index = visibleMessages.value.findIndex(msg => msg.id === message.id)
  return {
    transform: `translateY(${index * 80}px)` // 每个通知向下偏移80px
  }
}

// 获取进度条样式
const getProgressStyle = (message) => {
  const progress = progressStates.value[message.id] || 100
  return {
    width: `${progress}%`
  }
}

// 开始进度条
const startProgress = (message) => {
  if (message.duration <= 0) return // 不自动关闭的消息不需要进度条

  const intervalTime = 50 // 每50ms更新一次
  const decrement = (100 / message.duration) * intervalTime

  progressStates.value[message.id] = 100

  const interval = setInterval(() => {
    progressStates.value[message.id] -= decrement
    if (progressStates.value[message.id] <= 0) {
      clearInterval(interval)
      handleClose(message.id)
    }
  }, intervalTime)
}

// 关闭单个通知
const handleClose = (messageId) => {
  // 开始退出动画
  exitingMessages.value.add(messageId)

  // 等待动画完成后移除消息
  setTimeout(() => {
    notificationStore.removeMessage(messageId)
    exitingMessages.value.delete(messageId)
    delete progressStates.value[messageId]
  }, 300) // 动画持续时间
}

// 监听消息变化，为新消息启动进度条
import { watch } from 'vue'

watch(visibleMessages, (newMessages, oldMessages) => {
  // 找出新增的消息
  const addedMessages = newMessages.filter(
    newMsg => !oldMessages.some(oldMsg => oldMsg.id === newMsg.id)
  )

  // 为新消息启动进度条
  addedMessages.forEach(message => {
    startProgress(message)
  })
}, { deep: true })
</script>

<style scoped>
.notifications-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notification-container {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 300px;
  max-width: 500px;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 12px;
  box-shadow: var(--md-sys-elevation-level3);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  transition: transform 0.3s ease-out;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  gap: 12px;
}

.notification-icon-text {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.notification-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-text {
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  color: var(--md-sys-color-on-surface);
  word-wrap: break-word;
}

.close-button {
  flex-shrink: 0;
  --md-icon-button-icon-size: 20px;
  --md-icon-button-state-layer-size: 32px;
}

.notification-progress {
  height: 3px;
  background: currentColor;
  transition: width 0.05s linear;
}

/* 不同类型的样式 */
.notification-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.notification-error .notification-text {
  color: var(--md-sys-color-on-error-container);
}

.notification-success {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.notification-success .notification-text {
  color: var(--md-sys-color-on-tertiary-container);
}

.notification-warning {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.notification-warning .notification-text {
  color: var(--md-sys-color-on-secondary-container);
}

.notification-info {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.notification-info .notification-text {
  color: var(--md-sys-color-on-primary-container);
}

.notification-loading {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
}

.notification-loading .notification-text {
  color: var(--md-sys-color-on-surface-variant);
}

.notification-loading .notification-icon {
  animation: spin 1s linear infinite;
}

.notification-debug {
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface-variant);
  border-left: 4px solid var(--md-sys-color-outline);
}

.notification-debug .notification-text {
  color: var(--md-sys-color-on-surface-variant);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 动画 */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.notification-exiting {
  animation: slideOut 0.3s ease-in forwards;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notifications-wrapper {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .notification-container {
    min-width: auto;
    max-width: none;
  }
}
</style>