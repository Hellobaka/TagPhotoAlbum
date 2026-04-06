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
      :class="['global-upload-zone', { closing: isClosingUploadZone }]"
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
        :selected-ratings="selectedRatings"
        @toggle-sidebar="toggleSidebar"
        @set-active-tab="setActiveTab"
        @toggle-tag="toggleTag"
        @select-folder="selectFolder"
        @select-location="selectLocation"
        @toggle-rating="toggleRating"
        @open-passkey-management="openPasskeyManagementDialog"
        @open-tag-filter-dialog="openTagFilterDialog"
      />

      <!-- 主内容区 -->
      <div class="main-content" @scroll="handleScroll">
        <!-- Header 和 筛选条一起的容器 -->
        <div
          class="header-filter-container"
          :class="{ 'header-hidden': isFilterHidden }"
        >
          <!-- Header 组件 -->
          <HomeHeader
            :title="getActiveTabLabel"
            :search-query="searchQuery"
            @update:searchQuery="searchQuery = $event"
            :is-mobile="isMobile"
            @toggle-sidebar="toggleSidebar"
            @refresh="handleRefresh"
            @clear-search="clearSearch"
            @open-upload="showUploadZone = true"
          />

          <!-- 筛选状态显示 - 推荐页面不显示筛选状态 -->
          <FilterStatus
            v-if="activeTab !== 'recommend'"
            :selected-tags="selectedTags"
            :selected-folder="selectedFolder"
            :selected-location="selectedLocation"
            :selected-ratings="selectedRatings"
            :search-query="searchQuery"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            :current-layout="currentLayout"
            @toggle-tag="toggleTag"
            @select-folder="selectFolder"
            @select-location="selectLocation"
            @toggle-rating="toggleRating"
            @clear-search="clearSearch"
            @clear-all-filters="clearAllFilters"
            @sort-change="handleSortChange"
            @layout-change="handleLayoutChange"
          />
        </div>

        <!-- 未分类页面分类按钮 -->
        <CategorizeSection
          v-if="activeTab === 'uncategorized' && filteredPhotos.length > 0"
          :is-header-hidden="isFilterHidden"
          @start-categorization="startCategorization"
        />

        <!-- 瀑布流图片展示 -->
        <PhotoGrid
          ref="photoGridRef"
          :photos="filteredPhotos"
          :is-loading="isLoading"
          :loading-type="loadingType"
          :is-load-more="photoStore.isLoadMore"
          :has-more="photoStore.hasMore"
          :layout="currentLayout"
          :disable-infinite-scroll="activeTab === 'recommend'"
          :custom-end-message="activeTab === 'recommend' ? '推荐看完了，点击刷新按钮更换一批吧' : ''"
          @open-photo-detail="openPhotoDetail"
          @load-more="handleLoadMore"
          @tag-click="handleTagClickFromGrid"
          @ready="handlePhotoGridReady"
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
      :total-uncategorized-count="photoStore.totalUncategorizedCount"
      @close="stopCategorization"
      @save-and-next="handleSaveAndNext"
      @next="handleNext"
    />

    <!-- 通行密钥管理对话框 -->
    <PasskeyManagementDialog
      :show="showPasskeyManagementDialog"
      @close="closePasskeyManagementDialog"
    />

    <!-- Tag 过滤策略管理对话框 -->
    <TagFilterDialog
      :show="showTagFilterDialog"
      @close="closeTagFilterDialog"
      @update="handleTagFilterUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePhotoStore } from "@/stores/photoStore";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import Sidebar from "@/components/Sidebar.vue";
import HomeHeader from "@/components/HomeHeader.vue";
import FilterStatus from "@/components/FilterStatus.vue";
import CategorizeSection from "@/components/CategorizeSection.vue";
import PhotoGrid from "@/components/PhotoGrid.vue";
import PhotoDialog from "@/components/PhotoDialog.vue";
import CategorizeDialog from "@/components/CategorizeDialog.vue";
import UploadZone from "@/components/UploadZone.vue";
import PasskeyManagementDialog from "@/components/PasskeyManagementDialog.vue";
import TagFilterDialog from "@/components/TagFilterDialog.vue";

// 使用 composables
import { usePhotoFilters } from "@/utils/usePhotoFilters";
import { useUploadZone } from "@/utils/useUploadZone";
import {
  useScrollManagement,
  useMobileDetection,
} from "@/utils/useScrollManagement";
import { usePhotoCategorization } from "@/utils/usePhotoCategorization";

// Stores
const router = useRouter();
const route = useRoute();
const photoStore = usePhotoStore();
const notificationStore = useNotificationStore();

// 使用组合函数
const {
  selectedTags,
  selectedFolder,
  selectedLocation,
  selectedRatings,
  searchQuery,
  sortBy,
  sortOrder,
  toggleTag,
  selectFolder,
  selectLocation,
  toggleRating,
  clearSearch,
  clearAllFilters,
  handleSortChange,
  applyFilters,
  resetFilters,
} = usePhotoFilters();

const {
  showUploadZone,
  isClosingUploadZone,
  handleGlobalDragOver,
  handleGlobalDragLeave,
  handleGlobalDrop,
  closeUploadZone,
} = useUploadZone();

const { isFilterHidden, handleScroll } = useScrollManagement();
const { isMobile } = useMobileDetection();

const {
  isCategorizing,
  startCategorization: startCategorizationBase,
  stopCategorization,
  handleSaveAndNext,
  handleNext,
} = usePhotoCategorization();

// 本地状态
const isCollapsed = ref(false);
const activeTab = ref("recommend");
const selectedPhoto = ref(null);
const editablePhoto = ref({});
const newTag = ref("");
const photoGridRef = ref(null);
const showPasskeyManagementDialog = ref(false);
const showTagFilterDialog = ref(false);
const currentLayout = ref("masonry");

// 防抖定时器
let searchDebounceTimer = null;

// 标签页配置
const tabs = [
  { id: "tags", label: "标签", icon: "local_offer" },
  { id: "folders", label: "文件夹", icon: "folder" },
  { id: "locations", label: "地点", icon: "location_on" },
  { id: "ratings", label: "评分", icon: "star" },
  { id: "recommend", label: "推荐", icon: "recommend" },
  { id: "uncategorized", label: "未分类", icon: "folder_open" },
];

// 计算属性
const getActiveTabLabel = computed(() => {
  const tab = tabs.find((t) => t.id === activeTab.value);
  return tab ? tab.label : "";
});

const isLoading = computed(() => {
  if (activeTab.value === "recommend") {
    return photoStore.getLoadingState("recommend");
  }
  return photoStore.getLoadingState("photos");
});

const loadingType = computed(() => {
  if (activeTab.value === "recommend") {
    return "recommend";
  }
  return "photos";
});

const filteredPhotos = computed(() => {
  if (activeTab.value === "recommend") {
    return photoStore.recommendPhotos;
  }
  if (activeTab.value === "uncategorized") {
    return photoStore.uncategorizedPhotos;
  }
  return photoStore.photos;
});

// 核心方法
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  saveConfigToStorage();
};

const setActiveTab = async (tabId) => {
  activeTab.value = tabId;
  photoStore.setActiveTab(tabId);

  // 切换标签页时重置筛选
  resetFilters();

  // 更新路由URL并记录历史
  try {
    if (tabId === "recommend") {
      if (route.name !== "Home") {
        await router.push({ name: "Home" });
      }
    } else {
      if (route.name !== "HomeTab" || route.params.tabId !== tabId) {
        await router.push({ name: "HomeTab", params: { tabId } });
      }
    }
  } catch (e) {
    // 忽略同一路由的 NavigationDuplicated 错误
  }

  try {
    switch (tabId) {
      case "recommend":
        await photoStore.refreshRecommendPhotos();
        break;
      case "uncategorized":
        await photoStore.getUncategorizedPhotos();
        break;
      default:
        await photoStore.loadFirstPage();
        break;
    }
  } catch (error) {
    console.error(`Failed to load data for tab ${tabId}:`, error);
  }

  setTimeout(() => {
    if (photoGridRef.value) {
      console.log("🔄 Reconfiguring PhotoGrid observer after tab switch");
      photoGridRef.value.reconfigureObserver();
    }
  }, 300);
};

const handleRefresh = async () => {
  try {
    let photoCount = 0;

    switch (activeTab.value) {
      case "recommend":
        await photoStore.refreshRecommendPhotos();
        photoCount = photoStore.recommendPhotos.length;
        break;
      case "uncategorized":
        await photoStore.getUncategorizedPhotos();
        photoCount = photoStore.uncategorizedPhotos.length;
        break;
      default:
        await photoStore.loadFirstPage();
        photoCount = photoStore.photos.length;
        break;
    }

    notificationStore.showSuccess(`已刷新数据，获得 ${photoCount} 张图片`);
  } catch (error) {
    console.error("Failed to refresh data:", error);
    notificationStore.showError("刷新数据失败");
  }
};

// 包装分类方法以传递filteredPhotos
const startCategorization = (selectedPhoto = null) => {
  startCategorizationBase(selectedPhoto, filteredPhotos.value);
};

const openPhotoDetail = (photo) => {
  if (activeTab.value === "uncategorized") {
    startCategorization(photo);
  } else {
    selectedPhoto.value = photo;
    editablePhoto.value = { ...photo };
    newTag.value = "";
  }
};

const closePhotoDetail = () => {
  selectedPhoto.value = null;
  editablePhoto.value = {};
  newTag.value = "";
};

const savePhotoInfo = () => {
  closePhotoDetail();
};

const handleTagClickFromGrid = async (tag) => {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) {
    selectedTags.value.push(tag);
    await applyFilters();
  }
};

const handlePhotoGridReady = () => {
  console.log("✅ PhotoGrid is ready");
};

const openPasskeyManagementDialog = () => {
  showPasskeyManagementDialog.value = true;
};

const closePasskeyManagementDialog = () => {
  showPasskeyManagementDialog.value = false;
};

const openTagFilterDialog = () => {
  showTagFilterDialog.value = true;
};

const closeTagFilterDialog = () => {
  showTagFilterDialog.value = false;
};

const handleTagFilterUpdate = (filters) => {
  if (photoGridRef.value) {
    photoGridRef.value.refreshFilters();
    notificationStore.showSuccess("过滤策略已更新");
  }
};

// 本地存储配置
const STORAGE_KEY = "tag-photo-album-config";

const loadConfigFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      console.log("📂 Loaded config from localStorage:", config);

      if (config.currentLayout) {
        currentLayout.value = config.currentLayout;
      }

      if (route.params.tabId) {
        activeTab.value = route.params.tabId;
      }

      if (config.isCollapsed !== undefined) {
        isCollapsed.value = config.isCollapsed;
      }

      return true;
    }
  } catch (error) {
    console.error("Failed to load config from localStorage:", error);
  }
  return false;
};

const saveConfigToStorage = () => {
  const config = {
    currentLayout: currentLayout.value,
    isCollapsed: isCollapsed.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  console.log("💾 Saved config to localStorage:", config);
};

const handleLayoutChange = (layout) => {
  currentLayout.value = layout;
  saveConfigToStorage();
};

const handleLoadMoreUncategorized = async () => {
  try {
    await photoStore.loadMoreUncategorizedPhotos();
  } catch (error) {
    console.error("Failed to load more uncategorized photos:", error);
    notificationStore.showError("加载更多照片失败");
  }
};

const handleLoadMore = async () => {
  if (activeTab.value === "recommend") {
    await photoStore.getRecommendPhotos();
    return;
  }

  if (activeTab.value === "uncategorized") {
    await handleLoadMoreUncategorized();
    return;
  }

  try {
    await photoStore.loadMorePhotos();
  } catch (error) {
    console.error("Failed to load more photos:", error);
    notificationStore.showError("加载更多照片失败");
  }
};

// 监听路由变化
watch(
  () => route.params.tabId,
  async (newTabId) => {
    console.log("🔄 Route tabId changed:", newTabId);

    if (!newTabId) {
      activeTab.value = "recommend";
      await setActiveTab(activeTab.value);
    } else {
      if (
        tabs.some((tab) => tab.id === newTabId) &&
        activeTab.value !== newTabId
      ) {
        activeTab.value = newTabId;
        await setActiveTab(newTabId);
      }
    }
  },
  { immediate: true }
);

// 监听搜索输入变化（带防抖）
watch(searchQuery, (newValue, oldValue) => {
  // 如果是推荐页面，不触发搜索
  if (activeTab.value === 'recommend') {
    return;
  }

  // 清除之前的定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  // 设置新的定时器，500ms 后触发搜索
  searchDebounceTimer = setTimeout(() => {
    console.log('🔍 Search query changed:', newValue);
    applyFilters(activeTab.value);
  }, 500);
});

onMounted(async () => {
  const configLoaded = loadConfigFromStorage();

  try {
    if (!configLoaded) {
      await photoStore.getTagsData();
      await photoStore.getFoldersData();
      await photoStore.getLocationsData();
    }
  } catch (error) {
    console.error("Failed to load initial filter data:", error);
  }
});
</script>

<style scoped>
.home {
  height: 100vh;
  overflow: hidden;
  --header-height: 105px; /* 桌面端 header 高度 */
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
}

/* Header 和筛选条容器 */
.header-filter-container {
  position: sticky;
  top: 0;
  z-index: 10;
  transition: transform 0.3s ease;
}

.header-filter-container.header-hidden {
  transform: translateY(-100%);
}

/* FilterStatus sticky top 用变量控制 */
.filter-status {
  position: sticky;
  top: var(--header-height);
  z-index: 10;
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
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
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

  .home {
    --header-height: 222px; /* 移动端 header 高度优化 */
  }

  .masonry-grid {
    column-count: 2;
  }

  .sort-dropdown {
    min-width: auto;
    width: 100%;
  }

  .global-upload-zone {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>
