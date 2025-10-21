<template>
  <Transition name="dialog-fade">
    <div v-if="isOpen" class="dialog-overlay" @click="closeDialog">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">
              分类进度 ({{ currentIndex + 1 }}/{{ uncategorizedPhotos.length }})
            </h2>
            <md-icon-button @click="closeDialog" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <div class="photo-container">
              <img
                v-if="currentPhoto"
                :src="getImageUrl(currentPhoto.filePath)"
                :alt="currentPhoto.title"
              />
              <div v-else class="no-photo">
                <span class="material-symbols-outlined">photo</span>
                <p>没有更多未分类图片</p>
              </div>
            </div>

            <div class="info-section">
              <md-outlined-text-field
                v-model="editablePhoto.title"
                label="标题"
                class="info-field"
              />

              <md-outlined-text-field
                v-model="editablePhoto.description"
                label="描述"
                type="textarea"
                rows="3"
                class="info-field"
              />

              <div class="tags-section">
                <h3 class="md-typescale-title-medium">标签</h3>
                <div class="tags-container">
                  <md-suggestion-chip
                    v-for="tag in editablePhoto.tags"
                    :key="tag"
                    :label="tag"
                    @click="removeTag(tag)"
                    :class="getTagColorClass(tag)"
                  />
                  <div class="add-tag">
                    <md-outlined-text-field
                      v-model="newTag"
                      label="添加标签"
                      @keyup.enter="addTag"
                    >
                      <md-icon-button
                        slot="trailing-icon"
                        @click="addTag"
                      >
                        <span class="material-symbols-outlined">add</span>
                      </md-icon-button>
                    </md-outlined-text-field>
                  </div>
                </div>
              </div>

              <div class="info-grid">
                <div class="folder-field">
                  <md-outlined-text-field
                    v-model="editablePhoto.folder"
                    @focus="showFolderSuggestions = true"
                    label="文件夹"
                    class="info-field"
                    ref="folderInput"
                  />
                  <div v-if="showFolderSuggestions && filteredFolders.length > 0" class="folder-suggestions">
                    <div
                      v-for="folder in filteredFolders"
                      :key="folder"
                      class="suggestion-item"
                      @click="selectFolderSuggestion(folder)"
                    >
                      {{ folder }}
                    </div>
                  </div>
                </div>

                <md-outlined-text-field
                  v-model="editablePhoto.location"
                  label="地点"
                  class="info-field"
                />
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <md-text-button @click="closeDialog" :disabled="isSaving" style="padding-left: 15px; padding-right: 15px;">关闭</md-text-button>
            <md-text-button @click="handleNext" :disabled="isSaving" style="padding-left: 15px; padding-right: 15px;">下一张</md-text-button>
            <md-filled-button @click="handleSaveAndNext" :disabled="isSaving" style="padding-left: 15px; padding-right: 15px;">
              <span v-if="isSaving" class="loading-spinner"></span>
              {{ isSaving ? '保存中...' : '保存并下一张' }}
            </md-filled-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import API_CONFIG from '@/config/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  uncategorizedPhotos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save-and-next', 'next'])

// 响应式数据
const currentIndex = ref(0)
const editablePhoto = ref({})
const newTag = ref('')
const isSaving = ref(false)
const showFolderSuggestions = ref(false)
const folderInput = ref(null)

// 使用 Pinia store
const photoStore = usePhotoStore()

// 计算属性 - 过滤文件夹建议
const filteredFolders = computed(() => {
  if (!editablePhoto.value.folder) {
    return photoStore.allFolders.slice(0, 5) // 显示前5个建议
  }

  const query = editablePhoto.value.folder.toLowerCase()
  return photoStore.allFolders
    .filter(folder => folder.toLowerCase().includes(query))
    .slice(0, 5) // 最多显示5个建议
})

// 计算当前显示的图片
const currentPhoto = computed(() => {
  return props.uncategorizedPhotos[currentIndex.value] || null
})

// 监听当前图片变化
watch(currentPhoto, (newPhoto) => {
  if (newPhoto) {
    editablePhoto.value = { ...newPhoto }
    newTag.value = ''
    showFolderSuggestions.value = false
  } else {
    editablePhoto.value = {}
    newTag.value = ''
    showFolderSuggestions.value = false
  }
}, { immediate: true })

// 监听对话框打开状态
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // 对话框打开时重置到第一张图片
    currentIndex.value = 0
  }
})

// 方法
const closeDialog = () => {
  emit('close')
}

const addTag = () => {
  if (newTag.value.trim() && !editablePhoto.value.tags.includes(newTag.value.trim())) {
    editablePhoto.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag) => {
  editablePhoto.value.tags = editablePhoto.value.tags.filter(t => t !== tag)
}

const selectFolderSuggestion = (folder) => {
  editablePhoto.value.folder = folder
  showFolderSuggestions.value = false
}

// 点击外部关闭建议列表
const handleClickOutside = (event) => {
  if (folderInput.value && !folderInput.value.contains(event.target)) {
    showFolderSuggestions.value = false
  }
}

// 添加全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleSaveAndNext = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true
    await emit('save-and-next', editablePhoto.value)
    await nextTick()
    goToNext()
  } catch (error) {
    console.error('保存图片信息失败:', error)
  } finally {
    isSaving.value = false
  }
}

const handleNext = () => {
  emit('next')
  goToNext()
}

const goToNext = () => {
  if (currentIndex.value < props.uncategorizedPhotos.length - 1) {
    currentIndex.value++
  } else {
    // 已经是最后一张，关闭对话框
    closeDialog()
  }
}

const getImageUrl = (url) => {
  if (!url) return ''

  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }

  // 如果是相对路径，拼接后端 API 地址
  if (url.startsWith(API_CONFIG.UPLOAD_PATH)) {
    return `${API_CONFIG.BASE_URL}${url}`
  }

  // 其他情况直接返回
  return url
}

const getTagColorClass = (tag) => {
  // 预定义一组颜色类名
  const colorClasses = [
    'tag-color-art',
    'tag-color-abstract',
    'tag-color-color',
    'tag-color-nature',
    'tag-color-travel',
    'tag-color-people',
    'tag-color-building',
    'tag-color-design',
    'tag-color-modern',
    'tag-color-photo'
  ]

  // 根据标签字符串生成一个稳定的哈希值
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }

  // 使用哈希值选择颜色类名
  const index = Math.abs(hash) % colorClasses.length
  return colorClasses[index]
}
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-container {
  background: var(--md-sys-color-surface);
  border-radius: 28px;
  box-shadow: var(--md-sys-elevation-level3);
  max-width: 1200px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  margin-bottom: 16px;
}

.close-btn {
  margin-left: auto;
}

.dialog-content {
  display: flex;
  gap: 24px;
  padding: 0 24px;
  flex: 1;
  overflow: auto;
}

.photo-container {
  flex: 1;
  background: var(--md-sys-color-surface-container-high);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  margin-top: 10px;
}

.photo-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-photo {
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  padding: 40px;
}

.no-photo .material-symbols-outlined {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.info-section {
  flex: 1;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
  padding-bottom: 16px;
}

.info-field {
  width: 100%;
}

.tags-section {
  margin-top: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.add-tag {
  width: 100%;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.folder-field {
  position: relative;
}

.folder-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: var(--md-sys-elevation-level2);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.suggestion-item:hover {
  background: var(--md-sys-color-surface-container-highest);
}

.suggestion-item:not(:last-child) {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--md-sys-color-on-surface);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 动画样式 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dialog-content {
    flex-direction: column;
  }

  .photo-container {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .dialog-overlay {
    padding: 10px;
  }

  .dialog-container {
    max-height: 95vh;
  }

  .dialog-content {
    padding: 0 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px 16px 0 16px;
  }

  .dialog-actions {
    padding: 12px 16px 16px 16px;
  }
}
</style>