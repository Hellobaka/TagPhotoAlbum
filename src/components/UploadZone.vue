<template>
  <div
    class="upload-zone"
    :class="{ 'drag-over': isDragOver, 'uploading': isUploading, 'success': isSuccess }"
    @drop="handleDrop"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @click="triggerFileInput"
  >
    <!-- 关闭按钮 - 成功状态下不显示 -->
    <md-icon-button
      v-if="!isSuccess"
      class="close-button"
      @click.stop="$emit('close')"
    >
      <md-icon>close</md-icon>
    </md-icon-button>
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      @change="handleFileSelect"
      style="display: none"
    />

    <div class="upload-content">
      <span class="material-symbols-outlined upload-icon">
        {{ isSuccess ? 'check_circle' : isUploading ? 'upload' : 'cloud_upload' }}
      </span>

      <div class="upload-text">
        <h3 class="md-typescale-title-large">
          {{ isSuccess ? '上传成功！' : isUploading ? '上传中...' : '拖拽图片到这里' }}
        </h3>
        <p class="md-typescale-body-medium">
          {{ isSuccess ? `已成功上传 ${filesCount} 张图片，3秒后自动关闭` : isUploading ? `正在上传 ${uploadProgress}%` : '支持单张、多张图片或整个文件夹' }}
        </p>
      </div>

      <div v-if="isUploading" class="progress-container">
        <md-linear-progress
          :value="uploadProgress"
          max="100"
          class="upload-progress"
        />
      </div>

      <md-filled-button
        v-if="!isUploading && !isSuccess"
        @click.stop="triggerFileInput"
        class="upload-button"
      >
        <md-icon slot="icon">add_photo_alternate</md-icon>
        选择图片
      </md-filled-button>
    </div>

    <!-- 上传状态通知 - 仅错误时显示 -->
    <div v-if="uploadResult && uploadResult.type === 'error'" class="upload-result" :class="uploadResult.type">
      <span class="material-symbols-outlined">
        error
      </span>
      <span>{{ uploadResult.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useNotificationStore } from '@/stores/notificationStore'

// 定义事件
const emit = defineEmits(['close', 'upload-complete'])

// 响应式数据
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref(null)
const fileInput = ref(null)
const isSuccess = ref(false)
const filesCount = ref(0)

// 使用 Pinia store
const photoStore = usePhotoStore()
const notificationStore = useNotificationStore()

// 方法
const triggerFileInput = () => {
  // 成功状态下不触发文件选择
  if (!isSuccess.value) {
    fileInput.value?.click()
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  // 成功状态下不响应拖拽
  if (!isSuccess.value) {
    isDragOver.value = true
  }
}

const handleDragLeave = (event) => {
  event.preventDefault()
  // 成功状态下不响应拖拽离开
  if (!isSuccess.value) {
    isDragOver.value = false
  }
}

const handleDrop = async (event) => {
  event.preventDefault()
  isDragOver.value = false

  // 成功状态下不响应拖拽
  if (isSuccess.value) return

  const items = event.dataTransfer.items
  const files = []

  // 处理拖拽的文件和文件夹
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null
      if (entry && entry.isDirectory) {
        // 处理文件夹
        await processDirectory(entry, files)
      } else {
        // 处理单个文件
        const file = item.getAsFile()
        if (file && isImageFile(file)) {
          files.push(file)
        }
      }
    }
  }

  if (files.length > 0) {
    await uploadFiles(files)
  } else {
    // 如果没有有效的图片文件，关闭上传区域
    emit('close')
  }
}

const handleFileSelect = async (event) => {
  // 成功状态下不响应文件选择
  if (isSuccess.value) return

  const files = Array.from(event.target.files)
  const imageFiles = files.filter(file => isImageFile(file))

  if (imageFiles.length > 0) {
    await uploadFiles(imageFiles)
  } else {
    // 如果没有有效的图片文件，关闭上传区域
    emit('close')
  }

  // 重置文件输入
  event.target.value = ''
}

const processDirectory = async (directoryEntry, files) => {
  const reader = directoryEntry.createReader()

  const readEntries = () => {
    return new Promise((resolve) => {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve()
          return
        }

        const promises = entries.map(async (entry) => {
          if (entry.isDirectory) {
            await processDirectory(entry, files)
          } else if (entry.isFile && isImageFile(entry)) {
            const file = await getFileFromEntry(entry)
            if (file) {
              files.push(file)
            }
          }
        })

        Promise.all(promises).then(() => {
          readEntries().then(resolve)
        })
      })
    })
  }

  await readEntries()
}

const getFileFromEntry = (entry) => {
  return new Promise((resolve) => {
    entry.file((file) => {
      resolve(file)
    }, () => {
      resolve(null)
    })
  })
}

const isImageFile = (file) => {
  const fileName = file.name || ''
  const fileType = file.type || ''
  return fileType.startsWith('image/') ||
         /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName)
}

const uploadFiles = async (files) => {
  if (files.length === 0) return

  isUploading.value = true
  isSuccess.value = false
  uploadProgress.value = 0
  uploadResult.value = null
  filesCount.value = files.length

  try {
    const formData = new FormData()

    // 添加所有文件到 FormData
    files.forEach((file, index) => {
      formData.append('files', file)
    })

    // 调用 API 上传，传入进度回调函数
    const response = await photoStore.uploadPhotos(formData, (progressEvent) => {
      if (progressEvent.total) {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      } else {
        // 对于无法获取总大小的情况，显示一个递增的进度直到完成
        uploadProgress.value = Math.min(uploadProgress.value + 1, 95)
      }
    })

    uploadProgress.value = 100

    // 显示成功状态
    isSuccess.value = true

    // 刷新照片数据
    await photoStore.loadFirstPage()

    // 3秒后自动关闭
    setTimeout(() => {
      emit('upload-complete')
    }, 3000)

  } catch (error) {
    console.error('上传失败:', error)
    uploadResult.value = {
      type: 'error',
      message: error.message || '上传失败，请重试'
    }
  } finally {
    if (!isSuccess.value) {
      setTimeout(() => {
        isUploading.value = false
        uploadProgress.value = 0
        setTimeout(() => {
          uploadResult.value = null
        }, 3000)
      }, 1000)
    }
  }
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed var(--md-sys-color-outline-variant);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--md-sys-color-surface-container-low);
  position: relative;
  overflow: hidden;
}

.close-button {
  position: absolute !important;
  top: 12px;
  right: 12px;
  z-index: 10;
}

.upload-zone:hover {
  border-color: var(--md-sys-color-primary);
  background: var(--md-sys-color-surface-container);
}

.upload-zone.drag-over {
  border-color: var(--md-sys-color-primary);
  background: var(--md-sys-color-primary-container);
  transform: scale(1.02);
}

.upload-zone.uploading {
  cursor: not-allowed;
}

.upload-zone.success {
  border-color: var(--md-sys-color-tertiary);
  background: var(--md-sys-color-tertiary-container);
  cursor: default;
}

.upload-zone.success .upload-icon {
  color: var(--md-sys-color-tertiary);
}

.upload-zone.success .upload-text h3 {
  color: var(--md-sys-color-on-tertiary-container);
}

.upload-zone.success .upload-text p {
  color: var(--md-sys-color-on-tertiary-container);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.upload-icon {
  font-size: 64px;
  color: var(--md-sys-color-primary);
  opacity: 0.8;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-text h3 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.upload-text p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.progress-container {
  width: 100%;
  max-width: 300px;
}

.upload-progress {
  width: 100%;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
}

.upload-result {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  animation: slideUp 0.3s ease;
}

.upload-result.success {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.upload-result.error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-zone {
    padding: 40px 20px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .upload-text h3 {
    font-size: 1.25rem;
  }
}
</style>