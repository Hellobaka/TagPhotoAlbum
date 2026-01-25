import { computed } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'

/**
 * 照片筛选和管理的组合函数
 * 
 * 注：状态使用 photoStore.currentFilters 作为单一来源，
 * 避免与 store 中的状态重复维护。
 */
export function usePhotoFilters() {
  const photoStore = usePhotoStore()

  // 通过 computed 暴露筛选状态，所有状态来自 photoStore.currentFilters
  const selectedTags = computed(() => photoStore.currentFilters.tags)
  const selectedFolder = computed(() => photoStore.currentFilters.folder)
  const selectedLocation = computed(() => photoStore.currentFilters.location)
  const selectedRatings = computed(() => photoStore.currentFilters.ratings)
  
  // searchQuery 需要支持 setter，因为 Home.vue 中有直接赋值
  const searchQuery = computed({
    get: () => photoStore.currentFilters.searchQuery,
    set: (value) => {
      photoStore.currentFilters.searchQuery = value
    }
  })
  
  const sortBy = computed(() => photoStore.currentFilters.sortBy)
  const sortOrder = computed(() => photoStore.currentFilters.sortOrder)

  // 切换标签筛选
  const toggleTag = async (tag) => {
    const tags = [...photoStore.currentFilters.tags]
    const index = tags.indexOf(tag)
    if (index > -1) {
      tags.splice(index, 1)
    } else {
      tags.push(tag)
    }
    await applyFilters({ tags })
  }

  // 选择文件夹
  const selectFolder = async (folder) => {
    const newFolder = photoStore.currentFilters.folder === folder ? null : folder
    await applyFilters({ folder: newFolder })
  }

  // 选择地点
  const selectLocation = async (location) => {
    const newLocation = photoStore.currentFilters.location === location ? null : location
    await applyFilters({ location: newLocation })
  }

  // 切换评分筛选
  const toggleRating = async (rating) => {
    const ratings = [...photoStore.currentFilters.ratings]
    const index = ratings.indexOf(rating)
    if (index > -1) {
      ratings.splice(index, 1)
    } else {
      ratings.push(rating)
    }
    await applyFilters({ ratings })
  }

  // 清空搜索
  const clearSearch = async () => {
    await applyFilters({ searchQuery: '' })
  }

  // 清除所有筛选 - 调用 store 的 resetFilters 方法
  const clearAllFilters = async () => {
    photoStore.resetFilters()
    await applyFilters()
  }

  // 处理排序变更
  const handleSortChange = (sortParams) => {
    applyFilters({
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder
    })
  }

  // 应用筛选条件
  const applyFilters = async (filterDataOrActiveTab = null) => {
    // 如果没有参数或为 'recommend' 标签页，不执行筛选
    if (!filterDataOrActiveTab || filterDataOrActiveTab === 'recommend') {
      return
    }

    try {
      // 如果是对象（筛选数据），直接应用
      if (typeof filterDataOrActiveTab === 'object') {
        await photoStore.applyFilters(filterDataOrActiveTab)
      } else {
        // 否则仅重新加载数据（activeTab 作为标签页名称）
        await photoStore.loadFirstPage()
      }
    } catch (error) {
      console.error('Failed to apply filters:', error)
    }
  }

  // 重置筛选状态（切换标签页时使用）
  const resetFilters = () => {
    photoStore.resetFilters()
  }

  return {
    // 状态
    selectedTags,
    selectedFolder,
    selectedLocation,
    selectedRatings,
    searchQuery,
    sortBy,
    sortOrder,

    // 方法
    toggleTag,
    selectFolder,
    selectLocation,
    toggleRating,
    clearSearch,
    clearAllFilters,
    handleSortChange,
    applyFilters,
    resetFilters
  }
}
