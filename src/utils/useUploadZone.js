import { ref } from 'vue'

/**
 * 上传区域管理的组合函数
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

  return {
    showUploadZone,
    isClosingUploadZone,
    handleGlobalDragOver,
    handleGlobalDragLeave,
    handleGlobalDrop,
    closeUploadZone
  }
}
