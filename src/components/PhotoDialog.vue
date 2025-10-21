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
            <div class="photo-container">
              <img :src="getImageUrl(selectedPhoto.filePath)" :alt="selectedPhoto.title" />
            </div>

            <div class="info-section">
              <md-outlined-text-field :value="editablePhoto.title" @input="e => editablePhoto.title = e.target.value"
                label="标题" class="info-field" />

              <md-outlined-text-field :value="editablePhoto.description"
                @input="e => editablePhoto.description = e.target.value" label="描述" type="textarea" rows="3"
                class="info-field" />

              <div class="tags-section">
                <h3 class="md-typescale-title-medium">标签</h3>

                <!-- 常用标签区域 -->
                <div class="popular-tags-section">
                  <h4 class="md-typescale-body-medium">常用标签</h4>
                  <span v-if="popularTags.length == 0">空</span>
                  <div class="popular-tags-container">
                    <md-suggestion-chip
                      v-for="tag in popularTags"
                      :key="tag"
                      :label="`${tag.name} (${tag.count})`"
                      @click="toggleTag(tag.name)"
                      :class="[getTagColorClass(tag.name), { 'tag-selected': editablePhoto.tags?.includes(tag.name) }]"
                    />
                  </div>
                </div>

                <!-- 当前图片标签 -->
                <div class="current-tags-section">
                  <h4 class="md-typescale-body-medium">当前标签</h4>
                  <div class="tags-container">
                    <span v-if="editablePhoto.tags.length == 0">空</span>
                    <md-suggestion-chip
                      v-for="tag in editablePhoto.tags"
                      :key="tag"
                      :label="tag"
                      @click="toggleTagForRemoval(tag)"
                      :class="[getTagColorClass(tag), { 'tag-marked-for-removal': tagsToRemove.includes(tag), 'tag-selected': !tagsToRemove.includes(tag) }]"
                    />
                  </div>
                </div>

                <!-- 添加新标签 -->
                <div class="add-tag-section">
                  <div class="add-tag">
                    <md-outlined-text-field
                      :value="newTag"
                      @input="handleTagInput"
                      @focus="showTagSuggestions = true"
                      @blur="handleTagBlur"
                      label="添加标签"
                      @keyup.enter="addTag"
                      ref="tagInput"
                    >
                      <md-icon-button slot="trailing-icon" @click="addTag">
                        <span class="material-symbols-outlined">add</span>
                      </md-icon-button>
                    </md-outlined-text-field>
                    <div v-if="showTagSuggestions && filteredTags.length > 0" class="tag-suggestions" :class="{ 'fade-out': isTagSuggestionsClosing }" :style="getTagSuggestionsStyle()">
                      <div
                        v-for="tag in filteredTags"
                        :key="tag"
                        class="suggestion-item"
                        @click="selectTagSuggestion(tag)"
                      >
                        {{ tag }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="info-grid">
                <div class="folder-field">
                  <md-outlined-text-field
                    :value="editablePhoto.folder"
                    @input="handleFolderInput"
                    @focus="showFolderSuggestions = true"
                    @blur="handleFolderBlur"
                    label="文件夹"
                    class="info-field"
                    ref="folderInput"
                  />
                  <div v-if="showFolderSuggestions && filteredFolders.length > 0" class="folder-suggestions" :class="{ 'fade-out': isFolderSuggestionsClosing }" :style="getFolderSuggestionsStyle()">
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
                <md-outlined-text-field :value="editablePhoto.location"
                  @input="e => editablePhoto.location = e.target.value" label="地点" class="info-field" />
              </div>
            </div>
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

// 使用 Pinia store
const photoStore = usePhotoStore()
const notificationStore = useNotificationStore()

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

// 计算属性 - 获取常用标签及其使用次数
const popularTags = computed(() => {
  return photoStore.tags.sort((a, b) => b.count - a.count)
})

// 计算属性 - 过滤标签建议
const filteredTags = computed(() => {
  if (!newTag.value) {
    return photoStore.tags.map(x=>x.name).slice(0, 5)
  }

  const query = newTag.value.toLowerCase()
  return photoStore.tags
    .filter(tag => tag.name.toLowerCase().includes(query)).map(x=>x.name)
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
  } else {
    editablePhoto.value = {}
    newTag.value = ''
    showFolderSuggestions.value = false
    showTagSuggestions.value = false
    tagsToRemove.value = []
    isTagSuggestionsClosing.value = false
    isFolderSuggestionsClosing.value = false
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
    showTagSuggestions.value = false
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

const handleTagInput = (e) => {
  newTag.value = e.target.value
  showTagSuggestions.value = true
}

const selectTagSuggestion = (tag) => {
  newTag.value = tag
  closeTagSuggestionsWithAnimation()
}

const handleTagBlur = () => {
  // 使用 setTimeout 确保点击建议项时不会立即关闭列表
  setTimeout(() => {
    closeTagSuggestionsWithAnimation()
  }, 150)
}

const closeTagSuggestionsWithAnimation = () => {
  if (showTagSuggestions.value && !isTagSuggestionsClosing.value) {
    isTagSuggestionsClosing.value = true
    setTimeout(() => {
      showTagSuggestions.value = false
      isTagSuggestionsClosing.value = false
    }, 200)
  }
}

const handleFolderInput = (e) => {
  editablePhoto.value.folder = e.target.value
  showFolderSuggestions.value = true
}

const selectFolderSuggestion = (folder) => {
  editablePhoto.value.folder = folder
  closeFolderSuggestionsWithAnimation()
}

const handleFolderBlur = () => {
  // 使用 setTimeout 确保点击建议项时不会立即关闭列表
  setTimeout(() => {
    closeFolderSuggestionsWithAnimation()
  }, 150)
}

const closeFolderSuggestionsWithAnimation = () => {
  if (showFolderSuggestions.value && !isFolderSuggestionsClosing.value) {
    isFolderSuggestionsClosing.value = true
    setTimeout(() => {
      showFolderSuggestions.value = false
      isFolderSuggestionsClosing.value = false
    }, 200)
  }
}

// 点击外部关闭建议列表
const handleClickOutside = (event) => {
  // 检查是否点击了建议项
  const isSuggestionItem = event.target.classList.contains('suggestion-item')

  if (folderInput.value && !folderInput.value.contains(event.target) && !isSuggestionItem) {
    closeFolderSuggestionsWithAnimation()
  }
  if (tagInput.value && !tagInput.value.contains(event.target) && !isSuggestionItem) {
    closeTagSuggestionsWithAnimation()
  }
}

// 添加全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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

const getTagSuggestionsStyle = () => {
  if (!tagInput.value) return {}

  const rect = tagInput.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`
  }
}

const getFolderSuggestionsStyle = () => {
  if (!folderInput.value) return {}

  const rect = folderInput.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`
  }
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