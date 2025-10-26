<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import PhotoEditor from '@/components/PhotoEditor.vue'
import { useNotificationStore } from '../stores/notificationStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  uncategorizedPhotos: {
    type: Array,
    default: () => []
  },
  totalUncategorizedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'save-and-next', 'next', 'last'])

// 响应式数据
const currentIndex = ref(0)
const editablePhoto = ref({})
const newTag = ref('')
const isSaving = ref(false)
const tagsToRemove = ref([])

// 使用 Pinia store
const photoStore = usePhotoStore()
const notificationStore = useNotificationStore()

// 计算属性 - 获取常用标签及其使用次数
const popularTags = computed(() => {
  return photoStore.tags.sort((a, b) => b.count - a.count)
})

// 计算当前显示的图片
const currentPhoto = computed(() => {
  // 如果store中有当前分类的照片，优先使用
  if (photoStore.currentCategorizePhoto) {
    return photoStore.currentCategorizePhoto
  }
  return props.uncategorizedPhotos[currentIndex.value] || null
})

// 监听当前图片变化
watch(currentPhoto, (newPhoto) => {
  if (newPhoto) {
    editablePhoto.value = { ...newPhoto }
    newTag.value = ''
    tagsToRemove.value = []
  } else {
    editablePhoto.value = {}
    newTag.value = ''
    tagsToRemove.value = []
  }
}, { immediate: true })

// 监听对话框打开状态
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // 如果有当前分类的照片，重置索引
    if (photoStore.currentCategorizePhoto) {
      // 找到当前照片在未分类列表中的索引
      const index = props.uncategorizedPhotos.findIndex(
        photo => photo.id === photoStore.currentCategorizePhoto.id
      )
      currentIndex.value = index >= 0 ? index : 0
    } else {
      // 重置到第一张图片
      currentIndex.value = 0
    }
  } else {
    // 关闭对话框时清除当前分类照片
    photoStore.currentCategorizePhoto = null
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

const toggleTagForRemoval = (tag) => {
  const index = tagsToRemove.value.indexOf(tag)
  if (index > -1) {
    // 如果标签已经在待删除列表中，则移除
    tagsToRemove.value.splice(index, 1)
  } else {
    // 如果标签不在待删除列表中，则添加
    tagsToRemove.value.push(tag)
  }
}

const toggleTag = (tag) => {
  const currentTags = editablePhoto.value.tags.filter(tag => !tagsToRemove.value.includes(tag)) || []
  if (currentTags.includes(tag)) {
    tagsToRemove.value.push(tag)
  } else if(tagsToRemove.value.includes(tag)) {
    const index = tagsToRemove.value.indexOf(tag)
    if (index > -1) {
      tagsToRemove.value.splice(index, 1)
    }
  } else {
    // 如果标签不存在，则添加
    editablePhoto.value.tags = [...currentTags, tag]
  }
}

const handleSaveAndNext = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true

    // 在保存前移除标记为删除的标签
    if (tagsToRemove.value.length > 0) {
      editablePhoto.value.tags = editablePhoto.value.tags.filter(tag => !tagsToRemove.value.includes(tag))
      tagsToRemove.value = []
    }
    if (editablePhoto.value.folder == '未分类') {
      editablePhoto.value.folder = '默认'
    }
    await emit('save-and-next', editablePhoto.value)

    // 清除当前分类照片，以便后续使用正常索引
    photoStore.currentCategorizePhoto = null

    await nextTick()
    goToNext(1)
  } catch (error) {
    console.error('保存图片信息失败:', error)
  } finally {
    isSaving.value = false
  }
}

const handleNext = () => {
  emit('next')

  // 清除当前分类照片，以便后续使用正常索引
  photoStore.currentCategorizePhoto = null

  goToNext(1)
}

const handleLast = () => {
  // 清除当前分类照片，以便后续使用正常索引
  photoStore.currentCategorizePhoto = null

  goToNext(-1)
}

const goToNext = (i) => {
  const nextIndex = currentIndex.value + i
  if (i > 0) {
    // 检查是否超出当前缓存范围
    if (nextIndex < props.uncategorizedPhotos.length - 1) {
      // 还在缓存范围内，直接前进
      currentIndex.value++
    } else {
      // 超出缓存范围，检查是否还有更多数据
      if (photoStore.hasMore && props.totalUncategorizedCount > props.uncategorizedPhotos.length) {
        // 还有更多数据，加载下一页
        loadNextPage()
      } else {
        notificationStore.showError('没有更多数据了')
      }
    }
  } else {
    if(nextIndex >= 0) {
      currentIndex.value = currentIndex.value - 1
    }
  }
}

// 加载下一页未分类照片
const loadNextPage = async () => {
  try {
    console.log('📥 Loading next page of uncategorized photos...')
    const loadedCount = await photoStore.loadMoreUncategorizedPhotos()

    if (loadedCount > 0) {
      // 加载成功后前进到下一张
      currentIndex.value++
      console.log(`✅ Loaded ${loadedCount} more photos, now at index ${currentIndex.value}`)
    } else {
      // 没有更多数据，关闭对话框
      console.log('❌ No more photos to load')
      closeDialog()
    }
  } catch (error) {
    console.error('Failed to load next page:', error)
    // 加载失败时也关闭对话框
    closeDialog()
  }
}
</script>

<template>
  <Transition name="dialog-fade">
    <div v-if="isOpen" class="dialog-overlay" @click="closeDialog">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">
              分类进度 ({{ currentIndex + 1 }}/{{ totalUncategorizedCount || uncategorizedPhotos.length }})
            </h2>
            <md-icon-button @click="closeDialog" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <PhotoEditor
              :photo="currentPhoto"
              :editable-photo="editablePhoto"
              :new-tag="newTag"
              :tags-to-remove="tagsToRemove"
              :popular-tags="popularTags"
              :all-folders="photoStore.allFolders"
              :show-no-photo="!currentPhoto"
              :no-photo-text="'没有更多未分类图片'"
              @update:title="value => editablePhoto.title = value"
              @update:description="value => editablePhoto.description = value"
              @update:location="value => editablePhoto.location = value"
              @update:folder="value => editablePhoto.folder = value"
              @update:newTag="value => newTag = value"
              @update:rating="value => editablePhoto.rating = value"
              @toggle-tag="toggleTag"
              @toggle-tag-for-removal="toggleTagForRemoval"
              @add-tag="addTag"
            />
          </div>

          <div class="dialog-actions">
            <md-text-button @click="closeDialog" :disabled="isSaving" style="padding-left: 15px; padding-right: 15px;">关闭</md-text-button>
            <md-text-button @click="handleLast" :disabled="isSaving" style="padding-left: 15px; padding-right: 15px;">上一张</md-text-button>
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
  z-index: 1100;
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
  padding: 0 24px;
  flex: 1;
  overflow: auto;
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