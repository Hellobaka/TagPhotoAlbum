<template>
  <div class="filter-status">
    <div class="filter-chips" v-if="hasActiveFilters" >
      <md-filter-chip v-for="tag in selectedTags" :key="tag" :label="tag" @click="toggleTag(tag)">
        <md-icon slot="icon" style="margin-right: 5px;">local_offer</md-icon>
      </md-filter-chip>
      <md-filter-chip v-if="selectedFolder" :label="selectedFolder" @click="selectFolder(selectedFolder)">
        <md-icon slot="icon" style="margin-right: 5px;">folder</md-icon>
      </md-filter-chip>
      <md-filter-chip v-if="selectedLocation" :label="selectedLocation" @click="selectLocation(selectedLocation)">
        <md-icon slot="icon" style="margin-right: 5px;">location_on</md-icon>
      </md-filter-chip>
      <md-filter-chip v-if="searchQuery" :label="'搜索: ' + searchQuery" @click="clearSearch">
        <md-icon slot="icon" style="margin-right: 5px;">search</md-icon>
      </md-filter-chip>
      <md-text-button style="padding-left: 15px; padding-right: 15px;" @click="clearAllFilters">清除全部</md-text-button>
    </div>
    <!-- 排序下拉菜单 -->
    <div class="sort-dropdown">
      <md-outlined-select ref="sortItem" label="排序方式" @change="handleSortChange">
        <md-select-option value="date-desc">最新上传</md-select-option>
        <md-select-option value="date-asc">最早上传</md-select-option>
        <md-select-option value="filename-asc">文件名A-Z</md-select-option>
        <md-select-option value="filename-desc">文件名Z-A</md-select-option>
        <md-select-option value="size-desc">文件大小(大→小)</md-select-option>
        <md-select-option value="size-asc">文件大小(小→大)</md-select-option>
      </md-outlined-select>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
const sortItem = ref(null)

const props = defineProps({
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
  searchQuery: {
    type: String,
    default: ''
  },
  sortBy: {
    type: String,
    default: 'date'
  },
  sortOrder: {
    type: String,
    default: 'desc'
  }
})

const emit = defineEmits([
  'toggle-tag',
  'select-folder',
  'select-location',
  'clear-search',
  'clear-all-filters',
  'sort-change'
])

// 计算属性
const hasActiveFilters = computed(() => {
  return props.selectedTags.length > 0 || props.selectedFolder || props.selectedLocation || props.searchQuery
})

// 当前排序选项（用于下拉菜单）
const currentSortOption = computed({
  get: () => {
    return `${props.sortBy}-${props.sortOrder}`
  },
  set: (value) => {
    // 当用户选择时，通过handleSortChange处理
  }
})

// 方法
const toggleTag = (tag) => {
  emit('toggle-tag', tag)
}

const selectFolder = (folder) => {
  emit('select-folder', folder)
}

const selectLocation = (location) => {
  emit('select-location', location)
}

const clearSearch = () => {
  emit('clear-search')
}

const clearAllFilters = () => {
  emit('clear-all-filters')
}

const handleSortChange = async () => {
  const sort_by = sortItem.value.value
  // 解析排序选项，格式为 "sortBy-sortOrder"
  const [sortBy, sortOrder] = sort_by.split('-')
  props.sortBy = sortBy
  props.sortOrder = sortOrder
  // 触发排序变更事件
  emit('sort-change', { sortBy, sortOrder })
}
</script>

<style scoped>
/* 筛选状态样式 */
.filter-status {
  padding: 16px 24px;
  background: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  position: sticky;
  top: 153px;
  z-index: 9;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.sort-dropdown {
  min-width: 160px;
}

</style>