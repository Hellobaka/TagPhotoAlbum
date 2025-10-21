<template>
  <div v-if="hasActiveFilters" class="filter-status">
    <div class="filter-chips">
      <md-filter-chip
        v-for="tag in selectedTags"
        :key="tag"
        :label="tag"
        @click="toggleTag(tag)"
      >
        <md-icon slot="icon" style="margin-right: 5px;">local_offer</md-icon>
      </md-filter-chip>
      <md-filter-chip
        v-if="selectedFolder"
        :label="selectedFolder"
        @click="selectFolder(selectedFolder)"
      >
        <md-icon slot="icon" style="margin-right: 5px;">folder</md-icon>
      </md-filter-chip>
      <md-filter-chip
        v-if="selectedLocation"
        :label="selectedLocation"
        @click="selectLocation(selectedLocation)"
      >
        <md-icon slot="icon" style="margin-right: 5px;">location_on</md-icon>
      </md-filter-chip>
      <md-filter-chip
        v-if="searchQuery"
        :label="'搜索: ' + searchQuery"
        @click="clearSearch"
      >
        <md-icon slot="icon" style="margin-right: 5px;">search</md-icon>
      </md-filter-chip>
      <md-text-button style="padding-left: 15px; padding-right: 15px;" @click="clearAllFilters">清除全部</md-text-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
  }
})

const emit = defineEmits([
  'toggle-tag',
  'select-folder',
  'select-location',
  'clear-search',
  'clear-all-filters'
])

// 计算属性
const hasActiveFilters = computed(() => {
  return props.selectedTags.length > 0 || props.selectedFolder || props.selectedLocation || props.searchQuery
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
</style>