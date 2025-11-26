import { ref } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useNotificationStore } from '@/stores/notificationStore'

/**
 * 照片筛选和管理的组合函数
 */
export function usePhotoFilters() {
  const photoStore = usePhotoStore()
  const notificationStore = useNotificationStore()

  // 筛选状态
  const selectedTags = ref([])
  const selectedFolder = ref(null)
  const selectedLocation = ref(null)
  const selectedRatings = ref([])
  const searchQuery = ref('')
  const sortBy = ref('date')
  const sortOrder = ref('desc')

  // 切换标签筛选
  const toggleTag = async (tag) => {
    const index = selectedTags.value.indexOf(tag)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    } else {
      selectedTags.value.push(tag)
    }
    await applyFilters()
  }

  // 选择文件夹
  const selectFolder = async (folder) => {
    selectedFolder.value = selectedFolder.value === folder ? null : folder
    await applyFilters()
  }

  // 选择地点
  const selectLocation = async (location) => {
    selectedLocation.value = selectedLocation.value === location ? null : location
    await applyFilters()
  }

  // 切换评分筛选
  const toggleRating = async (rating) => {
    const index = selectedRatings.value.indexOf(rating)
    if (index > -1) {
      selectedRatings.value.splice(index, 1)
    } else {
      selectedRatings.value.push(rating)
    }
    await applyFilters()
  }

  // 清空搜索
  const clearSearch = async () => {
    searchQuery.value = ''
    await applyFilters()
  }

  // 清除所有筛选
  const clearAllFilters = async () => {
    selectedTags.value = []
    selectedFolder.value = null
    selectedLocation.value = null
    selectedRatings.value = []
    searchQuery.value = ''
    sortBy.value = 'date'
    sortOrder.value = 'desc'
    await applyFilters()
  }

  // 处理排序变更
  const handleSortChange = (sortParams) => {
    sortBy.value = sortParams.sortBy
    sortOrder.value = sortParams.sortOrder
    applyFilters()
  }

  // 应用筛选条件
  const applyFilters = async (activeTab = null) => {
    if (activeTab === 'recommend') {
      return
    }

    try {
      const filters = {
        tags: selectedTags.value,
        folder: activeTab !== 'uncategorized' ? selectedFolder.value : '未分类',
        location: selectedLocation.value,
        ratings: selectedRatings.value,
        searchQuery: searchQuery.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }

      await photoStore.applyFilters(filters)
    } catch (error) {
      console.error('Failed to apply filters:', error)
    }
  }

  // 重置筛选状态（切换标签页时使用）
  const resetFilters = () => {
    selectedTags.value = []
    selectedFolder.value = null
    selectedLocation.value = null
    selectedRatings.value = []
    searchQuery.value = ''
    sortBy.value = 'date'
    sortOrder.value = 'desc'
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
