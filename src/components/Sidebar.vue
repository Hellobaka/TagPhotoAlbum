<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <md-icon-button @click="toggleSidebar" class="collapse-btn">
        <span class="material-symbols-outlined">{{
          isCollapsed ? "chevron_right" : "chevron_left"
        }}</span>
      </md-icon-button>
      <md-icon-button
        @click="handleLogout"
        class="logout-btn"
        v-if="!isCollapsed"
      >
        <span class="material-symbols-outlined">logout</span>
      </md-icon-button>
    </div>

    <nav class="nav-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="nav-tab"
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        <span class="material-symbols-outlined tab-icon">{{ tab.icon }}</span>
        <span class="tab-label" v-if="!isCollapsed">{{ tab.label }}</span>
      </div>
      <div class="nav-tab" @click="handlePasskeyManagement">
        <span class="material-symbols-outlined tab-icon">fingerprint</span>
        <span class="tab-label" v-if="!isCollapsed">管理通行密钥</span>
      </div>
    </nav>

    <!-- 筛选内容区域 -->
    <div class="filter-content" v-if="!isCollapsed">
      <!-- 标签筛选 -->
      <div v-if="activeTab === 'tags'" class="filter-section">
        <div class="filter-title-row">
          <h3 class="filter-title">标签</h3>
          <md-icon-button @click="openTagFilterDialog" title="Tag 过滤策略">
            <span class="material-symbols-outlined">filter_alt</span>
          </md-icon-button>
        </div>
        <div class="filter-items">
          <md-filter-chip
            v-for="tag in photoStore.computedTags"
            :key="tag.name"
            :label="`${tag.name} (${tag.count})`"
            :selected="selectedTags.includes(tag.name)"
            :class="getTagClass(tag.name)"
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
import { usePhotoStore } from "@/stores/photoStore";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted, watch, ref } from "vue";
import { photoApi } from "@/api/photoApi";

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  activeTab: {
    type: String,
    default: "tags",
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  selectedFolder: {
    type: String,
    default: null,
  },
  selectedLocation: {
    type: String,
    default: null,
  },
  selectedRatings: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "toggle-sidebar",
  "set-active-tab",
  "toggle-tag",
  "select-folder",
  "select-location",
  "toggle-rating",
  "logout",
  "open-passkey-management",
  "open-tag-filter-dialog",
]);

// Tag 过滤策略
const tagFilterStrategies = ref([]);

// 加载 Tag 过滤策略
const loadTagFilterStrategies = () => {
  const saved = localStorage.getItem("tagFilterStrategies");
  if (saved) {
    try {
      tagFilterStrategies.value = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse tag filter strategies:", e);
      tagFilterStrategies.value = [];
    }
  }
};

// 获取 Tag 的 CSS 类
const getTagClass = (tagName) => {
  const filter = tagFilterStrategies.value.find((f) => f.tag === tagName);
  if (!filter) return "";
  return "tag-filter";
};

// 打开 Tag 过滤对话框
const openTagFilterDialog = () => {
  emit("open-tag-filter-dialog");
};

// 标签页配置
const tabs = [
  { id: "recommend", label: "推荐", icon: "recommend" },
  { id: "tags", label: "标签", icon: "local_offer" },
  { id: "folders", label: "文件夹", icon: "folder" },
  { id: "locations", label: "地点", icon: "location_on" },
  { id: "ratings", label: "评分", icon: "star" },
  { id: "uncategorized", label: "未分类", icon: "folder_open" },
];

// 使用 Pinia store
const photoStore = usePhotoStore();
const authStore = useAuthStore();
const router = useRouter();

// 监听标签页变化，按需加载筛选数据
watch(
  () => props.activeTab,
  async (newTab) => {
    if (!props.isCollapsed) {
      await loadFilterData(newTab);
    }
  }
);

// 监听侧边栏展开状态，展开时加载筛选数据
watch(
  () => props.isCollapsed,
  async (isCollapsed) => {
    if (!isCollapsed) {
      await loadFilterData(props.activeTab);
    }
  }
);

// 按需加载筛选数据
const loadFilterData = async (tabId) => {
  try {
    switch (tabId) {
      case "tags":
        // 标签数据会在应用启动时自动加载，这里不需要额外操作
        break;
      case "folders":
        if (photoStore.folders.length === 0) {
          await photoStore.getFoldersData();
        }
        break;
      case "locations":
        if (photoStore.locations.length === 0) {
          await photoStore.getLocationsData();
        }
        break;
    }
  } catch (error) {
    console.error(`Failed to load filter data for ${tabId}:`, error);
  }
};

// 通行密钥管理
const handlePasskeyManagement = async () => {
  emit("open-passkey-management");
};

onMounted(() => {
  // 如果侧边栏展开，加载当前标签页的筛选数据
  if (!props.isCollapsed) {
    loadFilterData(props.activeTab);
  }
  // 加载 Tag 过滤策略
  loadTagFilterStrategies();

  // 监听 localStorage 变化
  window.addEventListener("storage", handleStorageChange);
});

onUnmounted(() => {
  window.removeEventListener("storage", handleStorageChange);
});

const handleStorageChange = (e) => {
  if (e.key === "tagFilterStrategies") {
    loadTagFilterStrategies();
  }
};

// 方法
const toggleSidebar = () => {
  emit("toggle-sidebar");
};

const setActiveTab = (tabId) => {
  emit("set-active-tab", tabId);
};

const toggleTag = (tag) => {
  emit("toggle-tag", tag);
};

const selectFolder = (folder) => {
  emit("select-folder", folder);
};

const selectLocation = (location) => {
  emit("select-location", location);
};

const toggleRating = (rating) => {
  emit("toggle-rating", rating);
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};
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

.filter-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  margin: 0;
}

.filter-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-filter {
  background-color: var(--md-sys-color-error-container);
  font-weight: 500;
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
