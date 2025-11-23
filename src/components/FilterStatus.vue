<template>
  <div class="filter-status">
    <div class="filter-container">
      <!-- 筛选芯片区域 -->
      <div class="filter-chips" v-if="hasActiveFilters">
        <md-filter-chip
          v-for="tag in selectedTags"
          :key="tag"
          :label="tag"
          @click="toggleTag(tag)"
        >
          <md-icon slot="icon" style="margin-right: 5px">local_offer</md-icon>
        </md-filter-chip>
        <md-filter-chip
          v-if="selectedFolder"
          :label="selectedFolder"
          @click="selectFolder(selectedFolder)"
        >
          <md-icon slot="icon" style="margin-right: 5px">folder</md-icon>
        </md-filter-chip>
        <md-filter-chip
          v-if="selectedLocation"
          :label="selectedLocation"
          @click="selectLocation(selectedLocation)"
        >
          <md-icon slot="icon" style="margin-right: 5px">location_on</md-icon>
        </md-filter-chip>
        <md-filter-chip
          v-for="rating in selectedRatings"
          :key="rating"
          :label="rating === 0 ? '未评分' : `${rating} 星`"
          @click="toggleRating(rating)"
        >
          <md-icon slot="icon" style="margin-right: 5px">star</md-icon>
        </md-filter-chip>
        <md-filter-chip
          v-if="searchQuery"
          :label="'搜索: ' + searchQuery"
          @click="clearSearch"
        >
          <md-icon slot="icon" style="margin-right: 5px">search</md-icon>
        </md-filter-chip>
        <md-text-button
          style="padding-left: 15px; padding-right: 15px"
          @click="clearAllFilters"
          >清除全部</md-text-button
        >
      </div>

      <!-- 布局切换和排序区域 -->
      <div class="layout-controls">
        <!-- 布局切换按钮 -->
        <div class="layout-toggle">
          <md-filled-icon-button v-if="props.currentLayout === 'masonry'">
            <md-icon>view_stream</md-icon>
          </md-filled-icon-button>
          <md-icon-button
            v-if="props.currentLayout !== 'masonry'"
            @click="setLayout('masonry')"
          >
            <md-icon>view_stream</md-icon>
          </md-icon-button>
          <md-filled-icon-button v-if="props.currentLayout === 'grid'">
            <md-icon>grid_view</md-icon>
          </md-filled-icon-button>
          <md-icon-button
            v-if="props.currentLayout !== 'grid'"
            @click="setLayout('grid')"
          >
            <md-icon>grid_view</md-icon>
          </md-icon-button>
        </div>

        <!-- 排序下拉菜单 -->
        <div class="sort-dropdown">
          <md-outlined-select
            ref="sortItem"
            label="排序方式"
            @change="handleSortChange"
          >
            <md-select-option value="date-desc">最新上传</md-select-option>
            <md-select-option value="date-asc">最早上传</md-select-option>
            <md-select-option value="filename-asc">文件名A-Z</md-select-option>
            <md-select-option value="filename-desc">文件名Z-A</md-select-option>
            <md-select-option value="size-desc"
              >文件大小(大→小)</md-select-option
            >
            <md-select-option value="size-asc"
              >文件大小(小→大)</md-select-option
            >
          </md-outlined-select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
const sortItem = ref(null);

// 布局模式 - 现在通过props从父组件接收

const props = defineProps({
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
  searchQuery: {
    type: String,
    default: "",
  },
  sortBy: {
    type: String,
    default: "date",
  },
  sortOrder: {
    type: String,
    default: "desc",
  },
  currentLayout: {
    type: String,
    default: "masonry",
  },
});

const emit = defineEmits([
  "toggle-tag",
  "select-folder",
  "select-location",
  "toggle-rating",
  "clear-search",
  "clear-all-filters",
  "sort-change",
  "layout-change",
]);

// 计算属性
const hasActiveFilters = computed(() => {
  return (
    props.selectedTags.length > 0 ||
    props.selectedFolder ||
    props.selectedLocation ||
    props.selectedRatings.length > 0 ||
    props.searchQuery
  );
});

// 方法
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

const clearSearch = () => {
  emit("clear-search");
};

const clearAllFilters = () => {
  emit("clear-all-filters");
};

const handleSortChange = async () => {
  const sort_by = sortItem.value.value;
  const [sortBy, sortOrder] = sort_by.split("-");

  emit("sort-change", { sortBy, sortOrder });
};

// 设置布局模式
const setLayout = (layout) => {
  emit("layout-change", layout);
};

onMounted(() => {
  sortItem.value.value = "date-desc";
});
</script>

<style scoped>
/* 筛选状态样式 */
.filter-status {
  padding: 16px 24px;
  background: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

/* 主容器 - 桌面端水平布局 */
.filter-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 1;
}

/* 布局控制区域 */
.layout-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto; /* 靠右显示 */
}

.layout-toggle {
  flex-shrink: 0;
}

.sort-dropdown {
  min-width: 160px;
  flex-shrink: 0;
}

/* 移动端布局 */
@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
    gap: 12px;
  }

  .filter-chips {
    width: 100%;
    order: 1;
  }

  .layout-controls {
    width: 100%;
    order: 2;
    margin-left: 0;
    justify-content: space-between;
  }

  .sort-dropdown {
    width: calc(100% - 50px);
  }

  .sort-dropdown md-outlined-select {
    width: calc(100% - 50px);
  }
}
</style>
