<template>
  <Transition name="dialog-fade">
    <div v-if="selectedPhoto" class="dialog-overlay" @click="closePhotoDetail">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">图片详情</h2>
            <md-icon-button @click="closePhotoDetail" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <PhotoEditor
              :photo="selectedPhoto"
              :editable-photo="editablePhoto"
              :new-tag="newTag"
              :tags-to-remove="tagsToRemove"
              :popular-tags="popularTags"
              :all-folders="photoStore.allFolders"
              @update:title="value => editablePhoto.title = value"
              @update:description="value => editablePhoto.description = value"
              @update:location="value => editablePhoto.location = value"
              @update:folder="value => editablePhoto.folder = value"
              @update:rating="value => editablePhoto.rating = value"
              @update:newTag="value => newTag = value"
              @toggle-tag="toggleTag"
              @toggle-tag-for-removal="toggleTagForRemoval"
              @add-tag="addTag"
            />
          </div>

          <div class="dialog-actions">
            <md-text-button @click="closePhotoDetail" style="padding-left: 15px; padding-right: 15px;"
              :disabled="isSaving">取消</md-text-button>
            <md-text-button @click="savePhotoInfo" style="padding-left: 15px; padding-right: 15px;"
              :disabled="isSaving">
              <span v-if="isSaving" class="loading-spinner"></span>
              {{ isSaving ? '保存中...' : '保存' }}
            </md-text-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useNotificationStore } from '@/stores/notificationStore'
import PhotoEditor from '@/components/PhotoEditor.vue'

const props = defineProps({
  selectedPhoto: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close-photo-detail', 'save-photo-info'])

// 响应式数据
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

// 监听选中的照片变化
watch(() => props.selectedPhoto, (newPhoto) => {
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

// 方法
const closePhotoDetail = () => {
  // 重置待删除标签列表
  tagsToRemove.value = []
  emit('close-photo-detail')
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

const savePhotoInfo = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true

    // 在保存前移除标记为删除的标签
    if (tagsToRemove.value.length > 0) {
      editablePhoto.value.tags = editablePhoto.value.tags.filter(tag => !tagsToRemove.value.includes(tag))
      tagsToRemove.value = []
    }

    await photoStore.updatePhoto(editablePhoto.value)
    emit('save-photo-info', editablePhoto.value)

    // 保存成功后刷新当前视图数据
    await refreshCurrentViewData()
  } catch (error) {
    console.error('保存图片信息失败:', error)
    // 这里可以添加错误提示，比如使用 toast 通知用户
    notificationStore.showError('保存失败，请稍后重试')
  } finally {
    isSaving.value = false
  }
}

const refreshCurrentViewData = async () => {
  try {
    const activeTab = photoStore.activeTab

    switch (activeTab) {
      case 'tags':
        // 重新加载标签页的第一页数据
        await photoStore.loadFirstPage()
        break
      case 'folders':
        // 重新加载文件夹页的第一页数据
        await photoStore.loadFirstPage()
        break
      case 'locations':
        // 重新加载地点页的第一页数据
        await photoStore.loadFirstPage()
        break
      case 'recommend':
        // 重新加载推荐照片
        await photoStore.getRecommendPhotos()
        break
      case 'uncategorized':
        // 重新加载未分类照片
        await photoStore.getUncategorizedPhotos()
        break
      default:
        // 默认重新加载第一页数据
        await photoStore.loadFirstPage()
    }

    // 同时刷新元数据（标签、文件夹、地点）
    await Promise.all([
      photoStore.getTagsData(),
      photoStore.getFoldersData(),
      photoStore.getLocationsData()
    ])

  } catch (error) {
    console.error('刷新数据失败:', error)
    // 这里可以添加错误提示
  }
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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