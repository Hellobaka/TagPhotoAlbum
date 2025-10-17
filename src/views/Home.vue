<template>
  <div class="home">
    <div class="layout">
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
            <h1 class="md-typescale-headline-small">{{ getActiveTabLabel }}</h1>
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

        <!-- 推荐页面刷新按钮 -->
        <div v-if="activeTab === 'recommend' && filteredPhotos.length > 0" class="refresh-section">
          <div class="refresh-container">
            <md-text-button
              @click="refreshRecommendPhotos"
              class="refresh-button"
              :disabled="photoStore.isLoading"
            >
              <span class="material-symbols-outlined refresh-icon">refresh</span>
              再展示一批
            </md-text-button>
          </div>
        </div>

        <!-- 未分类页面分类按钮 -->
        <div v-if="activeTab === 'uncategorized' && filteredPhotos.length > 0" class="categorize-section">
          <div class="categorize-container">
            <md-filled-button
              @click="startCategorization"
              class="categorize-button"
            >
              <span class="material-symbols-outlined categorize-icon">category</span>
              继续分类
            </md-filled-button>
          </div>
        </div>

        <!-- 瀑布流图片展示 -->
        <PhotoGrid
          :photos="filteredPhotos"
          :is-loading="isLoading"
          :loading-type="loadingType"
          @open-photo-detail="openPhotoDetail"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photoStore'
import { useAuthStore } from '@/stores/authStore'
import Sidebar from '@/components/Sidebar.vue'
import FilterStatus from '@/components/FilterStatus.vue'
import PhotoGrid from '@/components/PhotoGrid.vue'
import PhotoDialog from '@/components/PhotoDialog.vue'
import CategorizeDialog from '@/components/CategorizeDialog.vue'

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

  // 根据筛选条件筛选图片
  let photos = photoStore.photos

  // 标签筛选 - 使用 AND 逻辑（必须包含所有选中的标签）
  if (selectedTags.value.length > 0) {
    photos = photos.filter(photo =>
      selectedTags.value.every(tag => photo.tags.includes(tag))
    )
  }

  // 文件夹筛选
  if (selectedFolder.value) {
    photos = photos.filter(photo => photo.folder === selectedFolder.value)
  }

  // 地点筛选
  if (selectedLocation.value) {
    photos = photos.filter(photo => photo.location === selectedLocation.value)
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    photos = photos.filter(photo =>
      photo.title.toLowerCase().includes(query) ||
      photo.description.toLowerCase().includes(query) ||
      photo.tags.some(tag => tag.toLowerCase().includes(query)) ||
      photo.folder.toLowerCase().includes(query) ||
      photo.location.toLowerCase().includes(query)
    )
  }

  return photos
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

  // 如果是推荐标签页，获取推荐照片
  if (tabId === 'recommend') {
    try {
      await photoStore.getRecommendPhotos()
    } catch (error) {
      console.error('Failed to load recommend photos:', error)
    }
  }
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const selectFolder = (folder) => {
  selectedFolder.value = selectedFolder.value === folder ? null : folder
}

const selectLocation = (location) => {
  selectedLocation.value = selectedLocation.value === location ? null : location
}

const clearAllFilters = () => {
  selectedTags.value = []
  selectedFolder.value = null
  selectedLocation.value = null
  searchQuery.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
}

const refreshRecommendPhotos = async () => {
  try {
    await photoStore.getRecommendPhotos()
  } catch (error) {
    console.error('Failed to refresh recommend photos:', error)
  }
}

const openPhotoDetail = (photo) => {
  selectedPhoto.value = photo
  editablePhoto.value = { ...photo }
  newTag.value = ''
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
const startCategorization = () => {
  isCategorizing.value = true
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

onMounted(async () => {
  // 初始化数据
  try {
    // 如果是推荐页面，先设置加载状态
    if (activeTab.value === 'recommend') {
      photoStore.setLoadingState('recommend', true)
    }

    await photoStore.initializeData()

    // 如果当前是推荐页面，加载推荐照片
    if (activeTab.value === 'recommend') {
      await photoStore.getRecommendPhotos()
    }
  } catch (error) {
    console.error('Failed to initialize photo data:', error)
  }
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

.search-box {
  min-width: 300px;
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


/* 推荐页面刷新按钮样式 */
.refresh-section {
  margin-top: 24px;
  margin-left: 24px;
  position: sticky;
  top: var(--header-height);
  z-index: 9;
  background: var(--md-sys-color-surface);
  padding: 16px 0;
}

.refresh-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background: var(--md-sys-color-secondary-container-hover);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
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
  .search-box {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>