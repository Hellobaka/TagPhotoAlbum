<template>
  <div
    class="home"
    @dragover.prevent="handleGlobalDragOver"
    @dragleave="handleGlobalDragLeave"
    @drop="handleGlobalDrop"
  >
    <!-- 全局拖拽上传区域 -->
    <UploadZone
      v-if="showUploadZone"
      :class="['global-upload-zone', { 'closing': isClosingUploadZone }]"
      @close="closeUploadZone"
      @upload-complete="closeUploadZone"
    />

    <div class="layout">
      <!-- 移动端遮罩层 -->
      <div
        v-if="!isCollapsed && isMobile"
        class="sidebar-overlay"
        @click="toggleSidebar"
      ></div>

      <!-- 左侧导航栏 -->
      <Sidebar
        :is-collapsed="isCollapsed"
        :active-tab="activeTab"
        :selected-tags="selectedTags"
        :selected-folder="selectedFolder"
        :selected-location="selectedLocation"
        @toggle-sidebar="toggleSidebar"
        @set-active-tab="setActiveTab"
        @toggle-tag="toggleTag"
        @select-folder="selectFolder"
        @select-location="selectLocation"
      />

      <!-- 主内容区 -->
      <div class="main-content">
        <div class="content-header">
          <div class="header-content">
            <div class="header-title-section">
              <!-- 移动端侧边栏切换按钮 -->
              <md-icon-button
                v-if="isMobile"
                @click="toggleSidebar"
                class="mobile-menu-button"
              >
                <span class="material-symbols-outlined">menu</span>
              </md-icon-button>
              <h1 class="md-typescale-headline-small">{{ getActiveTabLabel }}</h1>
              <!-- 刷新按钮 -->
              <md-icon-button
                @click="handleRefresh"
                :disabled="isRefreshing"
                class="refresh-icon-button"
              >
                <span
                  class="material-symbols-outlined refresh-icon"
                  :class="{ 'refreshing': isRefreshing }"
                >
                  refresh
                </span>
              </md-icon-button>
            </div>
            <div class="header-actions">
              <div class="search-box">
                <md-outlined-text-field
                  v-model="searchQuery"
                  label="搜索图片..."
                  type="search"
                  has-trailing-icon
                >
                  <span slot="leading-icon" class="material-symbols-outlined">search</span>
                  <md-icon-button
                    v-if="searchQuery"
                    slot="trailing-icon"
                    @click="clearSearch"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </md-icon-button>
                </md-outlined-text-field>
              </div>
              <!-- 上传按钮 -->
              <md-filled-button
                @click="showUploadZone = true"
                class="upload-button"
              >
                <md-icon slot="icon">add_photo_alternate</md-icon>
                上传图片
              </md-filled-button>
            </div>
          </div>
        </div>

        <!-- 筛选状态显示 - 推荐页面不显示筛选状态 -->
        <FilterStatus
          v-if="activeTab !== 'recommend'"
          :selected-tags="selectedTags"
          :selected-folder="selectedFolder"
          :selected-location="selectedLocation"
          :search-query="searchQuery"
          @toggle-tag="toggleTag"
          @select-folder="selectFolder"
          @select-location="selectLocation"
          @clear-search="clearSearch"
          @clear-all-filters="clearAllFilters"
        />


        <!-- 未分类页面分类按钮 -->
        <div v-if="activeTab === 'uncategorized' && filteredPhotos.length > 0" class="categorize-section">
          <div class="categorize-container">
            <md-filled-button
              @click="()=>startCategorization()"
              class="categorize-button"
            >
              <md-icon slot="icon">category</md-icon>
              继续分类
            </md-filled-button>
          </div>
        </div>

        <!-- 瀑布流图片展示 -->
        <PhotoGrid
          :photos="filteredPhotos"
          :is-loading="isLoading"
          :loading-type="loadingType"
          :is-load-more="photoStore.isLoadMore"
          :has-more="photoStore.hasMore"
          @open-photo-detail="openPhotoDetail"
          @load-more="handleLoadMore"
          @tag-click="handleTagClickFromGrid"
        />
      </div>
    </div>

    <!-- 图片详情对话框 -->
    <PhotoDialog
      :selected-photo="selectedPhoto"
      @close-photo-detail="closePhotoDetail"
      @save-photo-info="savePhotoInfo"
    />

    <!-- 分类对话框 -->
    <CategorizeDialog
      :is-open="isCategorizing"
      :uncategorized-photos="photoStore.uncategorizedPhotos"
      @close="stopCategorization"
      @save-and-next="handleSaveAndNext"
      @next="handleNext"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photoStore'
import { useAuthStore } from '@/stores/authStore'
import Sidebar from '@/components/Sidebar.vue'
import FilterStatus from '@/components/FilterStatus.vue'
import PhotoGrid from '@/components/PhotoGrid.vue'
import PhotoDialog from '@/components/PhotoDialog.vue'
import CategorizeDialog from '@/components/CategorizeDialog.vue'
import UploadZone from '@/components/UploadZone.vue'
import { useNotificationStore } from '@/stores/notificationStore'

// 响应式数据
const isCollapsed = ref(false)
const activeTab = ref('recommend')
const selectedPhoto = ref(null)
const editablePhoto = ref({})
const newTag = ref('')
const selectedTags = ref([])
const selectedFolder = ref(null)
const selectedLocation = ref(null)
const searchQuery = ref('')
const isCategorizing = ref(false)
const showUploadZone = ref(false)
const isClosingUploadZone = ref(false)
const isRefreshing = ref(false)
const isMobile = ref(false)

// 标签页配置
const tabs = [
  { id: 'tags', label: '标签', icon: 'local_offer' },
  { id: 'folders', label: '文件夹', icon: 'folder' },
  { id: 'locations', label: '地点', icon: 'location_on' },
  { id: 'recommend', label: '推荐', icon: 'recommend' },
  { id: 'uncategorized', label: '未分类', icon: 'folder_open' }
]

// 使用 Pinia store
const photoStore = usePhotoStore()
const notificationStore = useNotificationStore()

// 计算属性
const getActiveTabLabel = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.label : ''
})

// 计算加载状态
const isLoading = computed(() => {
  if (activeTab.value === 'recommend') {
    return photoStore.getLoadingState('recommend')
  }
  return photoStore.getLoadingState('photos')
})

// 计算加载类型
const loadingType = computed(() => {
  if (activeTab.value === 'recommend') {
    return 'recommend'
  }
  return 'photos'
})

const filteredPhotos = computed(() => {
  // 如果是推荐标签页，直接返回推荐照片，不应用筛选
  if (activeTab.value === 'recommend') {
    return photoStore.recommendPhotos
  }

  // 如果是未分类标签页，返回未分类的照片
  if (activeTab.value === 'uncategorized') {
    return photoStore.uncategorizedPhotos
  }

  // 标签、文件夹、地点页面：直接返回从API获取的已筛选照片
  // 现在筛选在服务器端完成，不需要在客户端再次筛选
  return photoStore.photos
})

// 方法
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const setActiveTab = async (tabId) => {
  activeTab.value = tabId
  photoStore.setActiveTab(tabId)

  // 切换标签页时清除筛选
  selectedTags.value = []
  selectedFolder.value = null
  selectedLocation.value = null
  searchQuery.value = ''

  try {
    // 根据标签页类型刷新数据
    switch (tabId) {
      case 'recommend':
        // 推荐页面：获取推荐照片
        await photoStore.getRecommendPhotos()
        break
      case 'uncategorized':
        // 未分类页面：获取未分类照片
        await photoStore.getUncategorizedPhotos()
        break
      default:
        // 标签、文件夹、地点页面：加载第一页数据
        await photoStore.loadFirstPage()
        break
    }
  } catch (error) {
    console.error(`Failed to load data for tab ${tabId}:`, error)
  }
}

const toggleTag = async (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }

  // 应用筛选
  await applyFilters()
}

const selectFolder = async (folder) => {
  selectedFolder.value = selectedFolder.value === folder ? null : folder

  // 应用筛选
  await applyFilters()
}

const selectLocation = async (location) => {
  selectedLocation.value = selectedLocation.value === location ? null : location

  // 应用筛选
  await applyFilters()
}

const clearAllFilters = async () => {
  selectedTags.value = []
  selectedFolder.value = null
  selectedLocation.value = null
  searchQuery.value = ''

  // 清除筛选并重新加载
  await applyFilters()
}

const clearSearch = async () => {
  searchQuery.value = ''

  // 应用筛选
  await applyFilters()
}

// 应用筛选条件
const applyFilters = async () => {
  if (activeTab.value === 'recommend' || activeTab.value === 'uncategorized') {
    return
  }

  try {
    const filters = {
      tags: selectedTags.value,
      folder: selectedFolder.value,
      location: selectedLocation.value,
      searchQuery: searchQuery.value
    }

    await photoStore.applyFilters(filters)
  } catch (error) {
    console.error('Failed to apply filters:', error)
  }
}

const handleRefresh = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true

  try {
    let photoCount = 0

    // 根据当前标签页类型刷新数据
    switch (activeTab.value) {
      case 'recommend':
        // 推荐页面：获取推荐照片
        await photoStore.getRecommendPhotos()
        photoCount = photoStore.recommendPhotos.length
        break
      case 'uncategorized':
        // 未分类页面：获取未分类照片
        await photoStore.getUncategorizedPhotos()
        photoCount = photoStore.uncategorizedPhotos.length
        break
      default:
        // 标签、文件夹、地点页面：加载第一页数据，保持当前筛选条件
        await photoStore.loadFirstPage()
        photoCount = photoStore.photos.length
        break
    }

    // 显示成功通知
    notificationStore.showSuccess(`已刷新数据，获得 ${photoCount} 张图片`)

  } catch (error) {
    console.error('Failed to refresh data:', error)
    notificationStore.showError('刷新数据失败')
  } finally {
    isRefreshing.value = false
  }
}

const refreshRecommendPhotos = async () => {
  try {
    await photoStore.getRecommendPhotos()
  } catch (error) {
    console.error('Failed to refresh recommend photos:', error)
  }
}

const openPhotoDetail = (photo) => {
  // 如果在未分类页面，打开分类对话框而不是图片详情对话框
  if (activeTab.value === 'uncategorized') {
    startCategorization(photo)
  } else {
    selectedPhoto.value = photo
    editablePhoto.value = { ...photo }
    newTag.value = ''
  }
}

const closePhotoDetail = () => {
  selectedPhoto.value = null
  editablePhoto.value = {}
  newTag.value = ''
}

const savePhotoInfo = () => {
  //photoStore.updatePhoto(editablePhoto.value)
  closePhotoDetail()
}

// 分类相关方法
const startCategorization = (selectedPhoto = null) => {
  isCategorizing.value = true
  // 如果传入了选中的照片，设置当前分类的照片
  if (selectedPhoto) {
    photoStore.setCurrentCategorizePhoto(selectedPhoto)
  } else{
    photoStore.setCurrentCategorizePhoto(filteredPhotos[0])
  }
}

const stopCategorization = () => {
  isCategorizing.value = false
}

const handleSaveAndNext = async (photoData) => {
  try {
    await photoStore.updatePhoto(photoData)
    // 自动进入下一张
  } catch (error) {
    console.error('保存图片信息失败:', error)
  }
}

const handleNext = () => {
  // 直接进入下一张，不保存当前图片
}

// 处理从PhotoGrid中点击标签的事件
const handleTagClickFromGrid = async (tag) => {
  // 将点击的标签添加到筛选条件中
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
    // 应用筛选
    await applyFilters()
  }
}

// 懒加载更多照片
const handleLoadMore = async () => {
  if (activeTab.value === 'recommend' || activeTab.value === 'uncategorized') {
    // 推荐和未分类页面不支持懒加载
    return
  }

  try {
    const loadedCount = await photoStore.loadMorePhotos()
    if (loadedCount > 0) {
      notificationStore.showSuccess(`已加载 ${loadedCount} 张新照片`)
    }
  } catch (error) {
    console.error('Failed to load more photos:', error)
    notificationStore.showError('加载更多照片失败')
  }
}

// 全局拖拽相关方法
const handleGlobalDragOver = (event) => {
  event.preventDefault()
  // 检查拖拽的是否是文件
  if (event.dataTransfer.types.includes('Files')) {
    showUploadZone.value = true
  }
}

const handleGlobalDragLeave = (event) => {
  event.preventDefault()
  // 只有当拖拽离开整个页面时才关闭上传区域
  if (!event.relatedTarget || event.relatedTarget === document.documentElement) {
    closeUploadZone()
  }
}

const handleGlobalDrop = (event) => {
  event.preventDefault()
  // 拖拽文件到页面时，UploadZone会处理文件上传
  // 这里只需要确保UploadZone显示即可
  if (event.dataTransfer.files.length > 0) {
    showUploadZone.value = true
  } else {
    // 如果没有文件，关闭上传区域
    closeUploadZone()
  }
}

const closeUploadZone = () => {
  if (showUploadZone.value && !isClosingUploadZone.value) {
    isClosingUploadZone.value = true
    // 等待动画完成后再隐藏组件
    setTimeout(() => {
      showUploadZone.value = false
      isClosingUploadZone.value = false
    }, 300)
  }
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(async () => {
  // 检测移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 根据当前标签页加载数据
  try {
    await photoStore.getRecommendPhotos()
    await photoStore.getTagsData()
    await photoStore.getFoldersData()
    await photoStore.getLocationsData()
  } catch (error) {
    console.error('Failed to load initial photo data:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.home {
  height: 100vh;
  overflow: hidden;
}

.layout {
  display: flex;
  height: 100%;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--md-sys-color-surface);
  --header-height: 105px; /* 桌面端 header 高度 */
}

.content-header {
  padding: 24px;
  background: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  position: sticky;
  top: 0;
  z-index: 10;
}

/* FilterStatus sticky top 用变量控制 */
.filter-status {
  position: sticky;
  top: var(--header-height);
  z-index: 9;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-button {
  color: var(--md-sys-color-on-surface);
}

.refresh-icon-button {
  color: var(--md-sys-color-on-surface);
}

.refresh-icon.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  white-space: nowrap;
}




/* 瀑布流样式 */
.masonry-grid {
  padding: 24px;
  column-count: 4;
  column-gap: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--md-sys-elevation-level1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.masonry-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--md-sys-elevation-level3);
}

.masonry-item img {
  width: 100%;
  height: auto;
  display: block;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.masonry-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info h4 {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}



/* 未分类页面分类按钮样式 */
.categorize-section {
  margin-top: 24px;
  margin-left: 24px;
  position: sticky;
  top: var(--header-height);
  z-index: 9;
  background: var(--md-sys-color-surface);
  padding: 16px 0;
}

.categorize-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.categorize-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-weight: 500;
  transition: background-color 0.2s;
}

.categorize-button:hover {
  background: var(--md-sys-color-primary-hover);
}

.categorize-icon {
  font-size: 18px;
}

/* 全局上传区域样式 */
.global-upload-zone {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  animation: fadeIn 0.3s ease;
}

.global-upload-zone.closing {
  animation: fadeOut 0.3s ease forwards;
}

.global-upload-zone.closing .upload-zone {
  animation: scaleOut 0.3s ease forwards;
}

.global-upload-zone .upload-zone {
  max-width: 600px;
  width: 100%;
  background: var(--md-sys-color-surface-container-high);
  border: 2px solid var(--md-sys-color-outline);
  animation: scaleIn 0.3s ease;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* 侧边栏遮罩层 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: fadeIn 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .layout {
    position: relative;
  }

  .main-content {
    --header-height: 153px; /* 移动端 header 高度 */
  }
  .masonry-grid {
    column-count: 2;
  }
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .header-actions {
    flex-direction: column;
    gap: 12px;
  }
  .search-box {
    min-width: auto;
  }
  .global-upload-zone {
    padding: 20px;
  }
  .upload-button {
    padding: 12px;
  }
  .upload-button .md-icon {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>