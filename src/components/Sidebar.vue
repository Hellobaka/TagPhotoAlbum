<template>
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
      <div
        class="nav-tab"
        @click="handlePasskeyManagement"
      >
        <span class="material-symbols-outlined tab-icon">fingerprint</span>
        <span class="tab-label" v-if="!isCollapsed">管理通行密钥</span>
      </div>
    </nav>

    <!-- 筛选内容区域 -->
    <div class="filter-content" v-if="!isCollapsed">
      <!-- 标签筛选 -->
      <div v-if="activeTab === 'tags'" class="filter-section">
        <h3 class="filter-title">标签</h3>
        <div class="filter-items">
          <md-filter-chip
            v-for="tag in photoStore.tags"
            :key="tag.name"
            :label="`${tag.name} (${tag.count})`"
            :selected="selectedTags.includes(tag.name)"
            @click="toggleTag(tag.name)"
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

      <!-- 评分筛选 -->
      <div v-if="activeTab === 'ratings'" class="filter-section">
        <h3 class="filter-title">评分</h3>
        <div class="filter-items">
          <md-filter-chip
            v-for="rating in [5, 4, 3, 2, 1, 0]"
            :key="rating"
            :label="rating === 0 ? '未评分' : `${rating} 星`"
            :selected="selectedRatings.includes(rating)"
            @click="toggleRating(rating)"
          />
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { usePhotoStore } from '@/stores/photoStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useRouter } from 'vue-router'
import { onMounted, watch, ref } from 'vue'
import { photoApi } from '@/api/photoApi'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: 'tags'
  },
  selectedTags: {
    type: Array,
    default: () => []
  },
  selectedFolder: {
    type: String,
    default: null
  },
  selectedLocation: {
    type: String,
    default: null
  },
  selectedRatings: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'toggle-sidebar',
  'set-active-tab',
  'toggle-tag',
  'select-folder',
  'select-location',
  'toggle-rating',
  'logout',
  'open-passkey-management'
])

// 标签页配置
const tabs = [
  { id: 'recommend', label: '推荐', icon: 'recommend' },
  { id: 'tags', label: '标签', icon: 'local_offer' },
  { id: 'folders', label: '文件夹', icon: 'folder' },
  { id: 'locations', label: '地点', icon: 'location_on' },
  { id: 'ratings', label: '评分', icon: 'star' },
  { id: 'uncategorized', label: '未分类', icon: 'folder_open' },
]

// 使用 Pinia store
const photoStore = usePhotoStore()
const authStore = useAuthStore()
const router = useRouter()

// 监听标签页变化，按需加载筛选数据
watch(() => props.activeTab, async (newTab) => {
  if (!props.isCollapsed) {
    await loadFilterData(newTab)
  }
})

// 监听侧边栏展开状态，展开时加载筛选数据
watch(() => props.isCollapsed, async (isCollapsed) => {
  if (!isCollapsed) {
    await loadFilterData(props.activeTab)
  }
})

// 按需加载筛选数据
const loadFilterData = async (tabId) => {
  try {
    switch (tabId) {
      case 'tags':
        if (photoStore.tags.length === 0) {
          await photoStore.getTagsData()
        }
        break
      case 'folders':
        if (photoStore.folders.length === 0) {
          await photoStore.getFoldersData()
        }
        break
      case 'locations':
        if (photoStore.locations.length === 0) {
          await photoStore.getLocationsData()
        }
        break
    }
  } catch (error) {
    console.error(`Failed to load filter data for ${tabId}:`, error)
  }
}

// 通行密钥管理
const handlePasskeyManagement = async () => {
  emit('open-passkey-management')
}

onMounted(() => {
  // 如果侧边栏展开，加载当前标签页的筛选数据
  if (!props.isCollapsed) {
    loadFilterData(props.activeTab)
  }
})

// 方法
const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const setActiveTab = (tabId) => {
  emit('set-active-tab', tabId)
}

const toggleTag = (tag) => {
  emit('toggle-tag', tag)
}

const selectFolder = (folder) => {
  emit('select-folder', folder)
}

const selectLocation = (location) => {
  emit('select-location', location)
}

const toggleRating = (rating) => {
  emit('toggle-rating', rating)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: var(--md-sys-color-surface-container-low);
  border-right: 1px solid var(--md-sys-color-outline-variant);
  transition: width 0.3s ease, transform 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 999;
}

.sidebar-collapsed {
  width: 55px;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    border-right: none;
    box-shadow: var(--md-sys-elevation-level3);
  }

  .sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: calc(var(--header-height) / 2);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.passkey-btn {
  color: var(--md-sys-color-on-surface-variant);
}

.passkey-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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

/* 响应式设计 */
@media (max-width: 480px) {
  .sidebar {
    width: 280px;
  }

  .sidebar-collapsed {
    width: 80px;
  }
}
</style>