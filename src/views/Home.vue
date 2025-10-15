<template>
  <div class="home">
    <div class="layout">
      <!-- 左侧导航栏 -->
      <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
        <div class="sidebar-header">
          <md-icon-button @click="toggleSidebar" class="collapse-btn">
            <span class="material-symbols-outlined">{{ isCollapsed ? 'chevron_right' : 'chevron_left' }}</span>
          </md-icon-button>
          <md-icon-button @click="handleLogout" class="logout-btn" v-if="!isCollapsed">
            <span class="material-symbols-outlined">logout</span>
          </md-icon-button>
        </div>

        <nav class="nav-tabs">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ 'active': activeTab === tab.id }"
            @click="setActiveTab(tab.id)"
          >
            <span class="material-symbols-outlined tab-icon">{{ tab.icon }}</span>
            <span class="tab-label" v-if="!isCollapsed">{{ tab.label }}</span>
          </div>
        </nav>

        <!-- 筛选内容区域 -->
        <div class="filter-content" v-if="!isCollapsed">
          <!-- 标签筛选 -->
          <div v-if="activeTab === 'tags'" class="filter-section">
            <h3 class="filter-title">标签</h3>
            <div class="filter-items">
              <md-filter-chip
                v-for="tag in photoStore.allTags"
                :key="tag"
                :label="tag"
                :selected="selectedTags.includes(tag)"
                @click="toggleTag(tag)"
                :class="getTagColorClass(tag)"
              />
            </div>
          </div>

          <!-- 文件夹筛选 -->
          <div v-if="activeTab === 'folders'" class="filter-section">
            <h3 class="filter-title">文件夹</h3>
            <div class="filter-items">
              <md-filter-chip
                v-for="folder in photoStore.allFolders"
                :key="folder"
                :label="folder"
                :selected="selectedFolder === folder"
                @click="selectFolder(folder)"
              />
            </div>
          </div>

          <!-- 地点筛选 -->
          <div v-if="activeTab === 'locations'" class="filter-section">
            <h3 class="filter-title">地点</h3>
            <div class="filter-items">
              <md-filter-chip
                v-for="location in photoStore.allLocations"
                :key="location"
                :label="location"
                :selected="selectedLocation === location"
                @click="selectLocation(location)"
              />
            </div>
          </div>
        </div>
      </div>

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

        <!-- 筛选状态显示 -->
        <div v-if="selectedTags.length > 0 || selectedFolder || selectedLocation || searchQuery" class="filter-status">
          <div class="filter-chips">
            <md-suggestion-chip
              v-for="tag in selectedTags"
              :key="tag"
              :label="tag"
              @click="toggleTag(tag)"
            >
              <span slot="icon" class="material-symbols-outlined">local_offer</span>
            </md-suggestion-chip>
            <md-suggestion-chip
              v-if="selectedFolder"
              :label="selectedFolder"
              @click="selectFolder(selectedFolder)"
            >
              <span slot="icon" class="material-symbols-outlined">folder</span>
            </md-suggestion-chip>
            <md-suggestion-chip
              v-if="selectedLocation"
              :label="selectedLocation"
              @click="selectLocation(selectedLocation)"
            >
              <span slot="icon" class="material-symbols-outlined">location_on</span>
            </md-suggestion-chip>
            <md-suggestion-chip
              v-if="searchQuery"
              :label="'搜索: ' + searchQuery"
              @click="clearSearch"
            >
              <span slot="icon" class="material-symbols-outlined">search</span>
            </md-suggestion-chip>
            <md-text-button @click="clearAllFilters">清除全部</md-text-button>
          </div>
        </div>

        <!-- 瀑布流图片展示 -->
        <div class="masonry-grid">
          <div
            v-for="photo in filteredPhotos"
            :key="photo.id"
            class="masonry-item"
            @click="openPhotoDetail(photo)"
          >
            <img :src="photo.url" :alt="photo.title" />
            <div class="photo-overlay">
              <div class="photo-info">
                <h4 class="md-typescale-body-medium">{{ photo.title }}</h4>
                <div class="tags">
                  <md-assist-chip
                    v-for="tag in photo.tags.slice(0, 2)"
                    :key="tag"
                    :label="tag"
                    size="small"
                    :class="getTagColorClass(tag)"
                  />
                  <md-assist-chip
                    v-if="photo.tags.length > 2"
                    :label="'+' + (photo.tags.length - 2)"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredPhotos.length === 0" class="empty-state">
          <span class="material-symbols-outlined empty-icon">photo</span>
          <h3 class="md-typescale-headline-small">没有找到照片</h3>
          <p class="md-typescale-body-medium">尝试调整筛选条件或搜索关键词</p>
        </div>
      </div>
    </div>

    <!-- 图片详情对话框 -->
    <div v-if="selectedPhoto" class="dialog-overlay" @click="closePhotoDetail">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h2 class="md-typescale-headline-small">图片详情</h2>
          <md-icon-button @click="closePhotoDetail" class="close-btn">
            <span class="material-symbols-outlined">close</span>
          </md-icon-button>
        </div>

        <div class="dialog-content">
          <div class="photo-container">
            <img :src="selectedPhoto.url" :alt="selectedPhoto.title" />
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
              <md-outlined-select
                v-model="editablePhoto.folder"
                label="文件夹"
                :options="photoStore.allFolders"
                class="info-field"
              />
              <md-outlined-text-field
                v-model="editablePhoto.location"
                label="地点"
                class="info-field"
              />
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <md-text-button @click="closePhotoDetail">取消</md-text-button>
          <md-text-button @click="savePhotoInfo">保存</md-text-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photoStore'
import { useAuthStore } from '@/stores/authStore'

// 响应式数据
const isCollapsed = ref(false)
const activeTab = ref('tags')
const selectedPhoto = ref(null)
const editablePhoto = ref({})
const newTag = ref('')
const selectedTags = ref([])
const selectedFolder = ref(null)
const selectedLocation = ref(null)
const searchQuery = ref('')

// 标签页配置
const tabs = [
  { id: 'tags', label: '标签', icon: 'local_offer' },
  { id: 'folders', label: '文件夹', icon: 'folder' },
  { id: 'locations', label: '地点', icon: 'location_on' }
]

// 使用 Pinia store
const photoStore = usePhotoStore()
const authStore = useAuthStore()
const router = useRouter()

// 计算属性
const getActiveTabLabel = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.label : ''
})

const filteredPhotos = computed(() => {
  // 根据筛选条件筛选图片
  let photos = photoStore.photos

  // 标签筛选
  if (selectedTags.value.length > 0) {
    photos = photos.filter(photo =>
      selectedTags.value.some(tag => photo.tags.includes(tag))
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

const setActiveTab = (tabId) => {
  activeTab.value = tabId
  photoStore.setActiveTab(tabId)
  // 切换标签页时清除筛选
  selectedTags.value = []
  selectedFolder.value = null
  selectedLocation.value = null
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

const addTag = () => {
  if (newTag.value.trim() && !editablePhoto.value.tags.includes(newTag.value.trim())) {
    editablePhoto.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag) => {
  editablePhoto.value.tags = editablePhoto.value.tags.filter(t => t !== tag)
}

const savePhotoInfo = () => {
  photoStore.updatePhoto(editablePhoto.value)
  closePhotoDetail()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const getTagColorClass = (tag) => {
  const colorMap = {
    '艺术': 'tag-color-art',
    '抽象': 'tag-color-abstract',
    '色彩': 'tag-color-color',
    '风景': 'tag-color-nature',
    '自然': 'tag-color-nature',
    '海洋': 'tag-color-travel',
    '日落': 'tag-color-travel',
    '人物': 'tag-color-people',
    '肖像': 'tag-color-people',
    '建筑': 'tag-color-building',
    '城市': 'tag-color-building',
    '设计': 'tag-color-design',
    '简约': 'tag-color-design',
    '现代': 'tag-color-modern',
    '摄影': 'tag-color-photo',
    '专业': 'tag-color-photo',
    '人像': 'tag-color-people',
    '街拍': 'tag-color-photo',
    '森林': 'tag-color-nature',
    '山脉': 'tag-color-nature',
    '山水': 'tag-color-nature',
    '海滩': 'tag-color-travel',
    '旅行': 'tag-color-travel',
    '回忆': 'tag-color-travel',
    '美好': 'tag-color-travel',
    '小径': 'tag-color-nature',
    '光影': 'tag-color-nature',
    '几何': 'tag-color-abstract',
    '构图': 'tag-color-art',
    '画作': 'tag-color-art',
    '精美': 'tag-color-art',
    '创作': 'tag-color-art',
    '构成': 'tag-color-art',
    '夏天': 'tag-color-travel',
    '人文': 'tag-color-people',
    '日出': 'tag-color-travel'
  }

  return colorMap[tag] || 'tag-color-default'
}

onMounted(() => {
  // 初始化数据
  photoStore.initializeMockData()
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

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: var(--md-sys-color-surface-container-low);
  border-right: 1px solid var(--md-sys-color-outline-variant);
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collapse-btn {
  margin-left: 0;
}

.logout-btn {
  color: var(--md-sys-color-on-surface-variant);
}

.nav-tabs {
  padding: 8px 0;
}

.nav-tab {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--md-sys-color-on-surface-variant);
  border-radius: 0;
}

.nav-tab:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.nav-tab.active {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.tab-icon {
  margin-right: 12px;
  font-size: 20px;
}

.tab-label {
  font-weight: 500;
}

/* 筛选内容区域 */
.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 12px;
}

.filter-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--md-sys-color-surface);
}

.content-header {
  padding: 24px;
  background: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
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

/* 筛选状态样式 */
.filter-status {
  padding: 16px 24px;
  background: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
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

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }

  .dialog-content {
    flex-direction: column;
  }

  .photo-container {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
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
  .masonry-grid {
    column-count: 1;
  }

  .sidebar {
    width: 240px;
  }

  .sidebar-collapsed {
    width: 64px;
  }

  .dialog-header {
    padding: 16px 16px 0 16px;
  }

  .dialog-actions {
    padding: 12px 16px 16px 16px;
  }
}
</style>