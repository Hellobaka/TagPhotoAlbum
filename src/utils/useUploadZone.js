import { ref } from 'vue'
import { useEventListener } from './useEventListener'

/**
 * 上传区域管理的组合函数
 * 
 * 处理全局拖拽文件上传区域的显示/隐藏
 */
export function useUploadZone() {
  const showUploadZone = ref(false)
  const isClosingUploadZone = ref(false)

  // 全局拖拽处理
  const handleGlobalDragOver = (event) => {
    event.preventDefault()
    if (event.dataTransfer.types.includes('Files')) {
      showUploadZone.value = true
    }
  }

  const handleGlobalDragLeave = (event) => {
    event.preventDefault()
    if (!event.relatedTarget || event.relatedTarget === document.documentElement) {
      closeUploadZone()
    }
  }

  const handleGlobalDrop = (event) => {
    event.preventDefault()
    if (event.dataTransfer.files.length > 0) {
      showUploadZone.value = true
    } else {
      closeUploadZone()
    }
  }

  // 关闭上传区域
  const closeUploadZone = () => {
    if (showUploadZone.value && !isClosingUploadZone.value) {
      isClosingUploadZone.value = true
      setTimeout(() => {
        showUploadZone.value = false
        isClosingUploadZone.value = false
      }, 300)
    }
  }

  // 使用 useEventListener 自动管理事件监听和清理
  useEventListener([
    {
      eventName: 'dragover',
      handler: handleGlobalDragOver,
      target: document,
      options: { passive: false }
    },
    {
      eventName: 'dragleave',
      handler: handleGlobalDragLeave,
      target: document,
      options: { passive: false }
    },
    {
      eventName: 'drop',
      handler: handleGlobalDrop,
      target: document,
      options: { passive: false }
    }
  ])

  return {
    showUploadZone,
    isClosingUploadZone,
    handleGlobalDragOver,
    handleGlobalDragLeave,
    handleGlobalDrop,
    closeUploadZone
  }
}
