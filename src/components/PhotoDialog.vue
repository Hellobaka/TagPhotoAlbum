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
            <div class="photo-container" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
              <img :src="currentImageUrl" :alt="selectedPhoto.title" />
              <div class="original-image-button" :class="{ 'show': showOriginalButton && selectedPhoto?.compressedFilePath && !isShowingOriginal }">
                <md-filled-tonal-button
                  @click="toggleOriginalImage"
                  style="padding-left: 15px; padding-right: 15px;"
                >
                  <md-icon slot="icon">open_in_full</md-icon>
                  显示原图
                </md-filled-tonal-button>
              </div>
            </div>

            <PhotoEditor
              :editable-photo="editablePhoto"
              :new-tag="newTag"
              :tags-to-remove="tagsToRemove"
              :popular-tags="popularTags"
              :all-folders="photoStore.allFolders"
              @update:title="value => editablePhoto.title = value"
              @update:description="value => editablePhoto.description = value"
              @update:location="value => editablePhoto.location = value"
              @update:folder="value => editablePhoto.folder = value"
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
import API_CONFIG from '@/config/api'
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
const showFolderSuggestions = ref(false)
const folderInput = ref(null)
const showTagSuggestions = ref(false)
const tagInput = ref(null)
const tagsToRemove = ref([])
const isTagSuggestionsClosing = ref(false)
const isFolderSuggestionsClosing = ref(false)
const showOriginalButton = ref(false)
const isShowingOriginal = ref(false)
const currentImageUrl = ref('')

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
    showFolderSuggestions.value = false
    showTagSuggestions.value = false
    tagsToRemove.value = []
    isTagSuggestionsClosing.value = false
    isFolderSuggestionsClosing.value = false
    isShowingOriginal.value = false
    showOriginalButton.value = false
    // 初始化图片URL
    currentImageUrl.value = getImageUrl(newPhoto)
  } else {
    editablePhoto.value = {}
    newTag.value = ''
    showFolderSuggestions.value = false
    showTagSuggestions.value = false
    tagsToRemove.value = []
    isTagSuggestionsClosing.value = false
    isFolderSuggestionsClosing.value = false
    isShowingOriginal.value = false
    showOriginalButton.value = false
    currentImageUrl.value = ''
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

const getImageUrl = (photo) => {
  if (!photo) return ''

  // 优先使用压缩图片路径
  let url = photo.compressedFilePath || photo.filePath

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


const toggleOriginalImage = () => {
  if (!props.selectedPhoto) return

  if (isShowingOriginal.value) {
    // 切换回压缩图
    currentImageUrl.value = getImageUrl(props.selectedPhoto)
    isShowingOriginal.value = false
  } else {
    // 切换到原图
    currentImageUrl.value = getOriginalImageUrl(props.selectedPhoto)
    isShowingOriginal.value = true
  }
}

const getOriginalImageUrl = (photo) => {
  if (!photo) return ''

  let url = photo.filePath

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

const handleMouseEnter = () => {
  showOriginalButton.value = true
}

const handleMouseLeave = () => {
  showOriginalButton.value = false
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
  position: relative;
}

.photo-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.original-image-button {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.original-image-button.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
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

.popular-tags-section {
  margin-bottom: 16px;
}

.popular-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.current-tags-section {
  margin-bottom: 16px;
}

.add-tag-section {
  margin-top: 16px;
}

.add-tag {
  width: 100%;
  position: relative;
}

.tag-suggestions {
  position: fixed;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: var(--md-sys-elevation-level2);
  z-index: 1001;
  max-height: 200px;
  overflow-y: auto;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
  opacity: 0;
  transform: translateY(-8px);
}

.tag-suggestions:not(.fade-out) {
  opacity: 1;
  transform: translateY(0);
}

.tag-suggestions.fade-out {
  opacity: 0;
  transform: translateY(-8px);
}

.tag-selected {
  background-color: var(--md-sys-color-primary-container) !important;
  color: var(--md-sys-color-on-primary-container) !important;
}

.tag-marked-for-removal {
  opacity: 0.5;
  text-decoration: line-through;
  background-color: var(--md-sys-color-error-container) !important;
  color: var(--md-sys-color-on-error-container) !important;
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
  position: fixed;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: var(--md-sys-elevation-level2);
  z-index: 1001;
  max-height: 200px;
  overflow-y: auto;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
  opacity: 0;
  transform: translateY(-8px);
}

.folder-suggestions:not(.fade-out) {
  opacity: 1;
  transform: translateY(0);
}

.folder-suggestions.fade-out {
  opacity: 0;
  transform: translateY(-8px);
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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