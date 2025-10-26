import { defineStore } from 'pinia'
import { photoApi } from '@/api/photoApi'
import { useNotificationStore } from './notificationStore'

export const usePhotoStore = defineStore('photos', {
  state: () => ({
    photos: [],
    tags: [],
    folders: [],
    locations: [],
    selectedPhoto: null,
    activeTab: 'tags',
    isLoading: false,
    error: null,
    recommendPhotos: [],
    currentCategorizePhoto: null,
    // 推荐照片上次请求的ID列表
    lastRecommendPhotoIds: [],
    // 新增加载状态
    loadingStates: {
      photos: false,
      tags: false,
      folders: false,
      locations: false,
      search: false,
      recommend: false
    },
    // 懒加载相关状态
    currentPage: 1,
    hasMore: true,
    isLoadMore: false,
    // 未分类页面分页状态
    uncategorizedCurrentPage: 1,
    totalUncategorizedCount: 0,
    // 筛选状态
    currentFilters: {
      tags: [],
      folder: null,
      location: null,
      rating: null,
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc'
    }
  }),

  getters: {
    filteredPhotos: (state) => {
      switch (state.activeTab) {
        case 'tags':
          return state.photos
        case 'folders':
          return state.photos
        case 'locations':
          return state.photos
        case 'recommend':
          return state.recommendPhotos
        default:
          return state.photos
      }
    },

    allTags: (state) => {
      const allTags = new Set()
      state.photos.forEach(photo => {
        photo.tags.forEach(tag => allTags.add(tag))
      })
      return Array.from(allTags)
    },

    allFolders: (state) => {
      const folders = new Set()
      state.photos.forEach(photo => folders.add(photo.folder))
      return Array.from(folders)
    },

    allLocations: (state) => {
      const locations = new Set()
      state.photos.forEach(photo => locations.add(photo.location))
      return Array.from(locations)
    },

    // 未分类照片
    uncategorizedPhotos: (state) => {
      return state.photos.filter(photo =>
        !photo.tags || photo.tags.length === 0 ||
        !photo.folder || photo.folder === '' ||
        !photo.location || photo.location === '' ||
        !photo.title || photo.title === '未命名'
      )
    }
  },

  actions: {
    setActiveTab(tab) {
      this.activeTab = tab
      if (tab == 'uncategorized' && this.clearFilters.folder == '未分类') {
        this.currentFilters.folder = null
      }
    },

    setSelectedPhoto(photo) {
      this.selectedPhoto = photo
    },

    setCurrentCategorizePhoto(photo) {
      this.currentCategorizePhoto = photo
    },

    // 设置加载状态
    setLoadingState(type, isLoading) {
      if (this.loadingStates[type] !== undefined) {
        this.loadingStates[type] = isLoading
      }
    },

    // 获取加载状态
    getLoadingState(type) {
      return this.loadingStates[type] || false
    },

    async updatePhoto(updatedPhoto) {
      try {
        this.isLoading = true
        const response = await photoApi.updatePhoto(updatedPhoto.id, updatedPhoto)
        if (response.success) {
          let index = this.photos.findIndex(photo => photo.id === updatedPhoto.id)
          if (index !== -1) {
            // 触发响应式更新
            this.photos[index] = updatedPhoto
          }
          index = this.recommendPhotos.findIndex(photo => photo.id === updatedPhoto.id)
          if (index !== -1) {
            // 触发响应式更新
            this.recommendPhotos[index] = updatedPhoto
          }
        }
        return response
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '更新照片失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async addTagToPhoto(photoId, tag) {
      try {
        const photo = this.photos.find(p => p.id === photoId)
        if (photo && !photo.tags.includes(tag)) {
          const updatedPhoto = { ...photo, tags: [...photo.tags, tag] }
          await this.updatePhoto(updatedPhoto)
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async removeTagFromPhoto(photoId, tag) {
      try {
        const photo = this.photos.find(p => p.id === photoId)
        if (photo) {
          const updatedPhoto = {
            ...photo,
            tags: photo.tags.filter(t => t !== tag)
          }
          await this.updatePhoto(updatedPhoto)
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 加载第一页数据 - 用于标签、文件夹、地点页面的首次加载和刷新
    async loadFirstPage(filters = {}) {
      try {
        this.isLoading = true
        this.error = null
        this.currentPage = 1
        this.hasMore = true

        // 更新筛选状态
        if (filters) {
          this.currentFilters = { ...this.currentFilters, ...filters }
        }

        // 设置照片加载状态
        this.setLoadingState('photos', true)

        // 从 API 获取照片数据（第一页），传递筛选参数
        const photosResponse = await photoApi.getPhotosPaginated(1, 20, this.currentFilters)
        this.photos = photosResponse.data || []
        this.setLoadingState('photos', false)

      } catch (error) {
        this.error = error.message
        console.error('Failed to load first page:', error)
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '加载数据失败')
        throw error
      } finally {
        this.isLoading = false
        this.setLoadingState('photos', false)
      }
    },

    // 加载更多照片
    async loadMorePhotos() {
      if (this.isLoadMore || !this.hasMore) return

      try {
        this.isLoadMore = true
        const nextPage = this.currentPage + 1

        // 使用当前筛选参数加载下一页
        const response = await photoApi.getPhotosPaginated(nextPage, 20, this.currentFilters)
        const newPhotos = response.data || []

        if (newPhotos.length > 0) {
          this.photos = [...this.photos, ...newPhotos]
          this.currentPage = nextPage

          // 如果返回的照片数量小于请求的数量，说明没有更多数据了
          if (newPhotos.length < 20) {
            this.hasMore = false
          }
        } else {
          this.hasMore = false
        }

        return newPhotos.length
      } catch (error) {
        this.error = error.message
        console.error('Failed to load more photos:', error)
        throw error
      } finally {
        this.isLoadMore = false
      }
    },

    // 更新筛选条件并重新加载
    async applyFilters(filters = {}) {
      try {
        // 更新筛选状态
        this.currentFilters = { ...this.currentFilters, ...filters }

        // 重新加载第一页
        await this.loadFirstPage()
      } catch (error) {
        console.error('Failed to apply filters:', error)
        throw error
      }
    },

    // 清除筛选条件
    clearFilters() {
      this.currentFilters = {
        tags: [],
        folder: null,
        location: null,
        rating: null,
        searchQuery: '',
        sortBy: 'date',
        sortOrder: 'desc'
      }
    },

    // 搜索照片
    async searchPhotos(query) {
      try {
        this.setLoadingState('search', true)
        this.error = null
        const response = await photoApi.searchPhotos(query)
        return response.data || []
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '搜索失败')
        throw error
      } finally {
        this.setLoadingState('search', false)
      }
    },

    // 创建照片
    async createPhoto(photoData) {
      try {
        this.isLoading = true
        this.error = null
        const response = await photoApi.createPhoto(photoData)
        if (response.success) {
          this.photos.push(response.data)
        }
        return response
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '发送创建请求失败')

        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 删除照片
    async deletePhoto(id) {
      try {
        this.isLoading = true
        this.error = null
        const response = await photoApi.deletePhoto(id)
        if (response.success) {
          this.photos = this.photos.filter(photo => photo.id !== id)
        }
        return response
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '发送删除请求失败')

        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 获取推荐照片
    async getRecommendPhotos(excludeIds = null) {
      try {
        this.setLoadingState('recommend', true)
        this.error = null

        // 如果没有提供excludeIds，使用上次请求的ID列表
        const idsToExclude = excludeIds !== null ? excludeIds : this.lastRecommendPhotoIds

        const response = await photoApi.getRecommendPhotos(idsToExclude)
        this.recommendPhotos = response.data || []

        // 记录本次请求返回的图片ID，供下次调用使用
        this.lastRecommendPhotoIds = this.recommendPhotos.map(photo => photo.id)

        return this.recommendPhotos
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '加载推荐照片失败')
        throw error
      } finally {
        this.setLoadingState('recommend', false)
      }
    },

    // 获取未分类照片（第一页）
    async getUncategorizedPhotos() {
      try {
        this.setLoadingState('photos', true)
        this.error = null
        this.uncategorizedCurrentPage = 1
        this.hasMore = true

        const response = await photoApi.getUncategorizedPhotos(1, 20, this.currentFilters)
        this.photos = response.data || []

        // 存储总数量信息（如果后端返回了的话）
        this.totalUncategorizedCount = response.pagination.total

        // 如果返回的照片数量小于请求的数量，说明没有更多数据了
        if (this.photos.length < 20) {
          this.hasMore = false
        }

        return this.photos
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '加载未分类照片失败')
        throw error
      } finally {
        this.setLoadingState('photos', false)
      }
    },

    // 加载更多未分类照片
    async loadMoreUncategorizedPhotos() {
      if (this.isLoadMore || !this.hasMore) return

      try {
        this.isLoadMore = true
        const nextPage = this.uncategorizedCurrentPage + 1

        const response = await photoApi.getUncategorizedPhotos(nextPage, 20, this.currentFilters)
        const newPhotos = response.data || []

        // 更新总数量信息（如果后端返回了的话）
        if (response.total !== undefined) {
          this.totalUncategorizedCount = response.total
        }

        if (newPhotos.length > 0) {
          this.photos = [...this.photos, ...newPhotos]
          this.uncategorizedCurrentPage = nextPage

          // 如果返回的照片数量小于请求的数量，说明没有更多数据了
          if (newPhotos.length < 20) {
            this.hasMore = false
          }
        } else {
          this.hasMore = false
        }

        return newPhotos.length
      } catch (error) {
        this.error = error.message
        console.error('Failed to load more uncategorized photos:', error)
        throw error
      } finally {
        this.isLoadMore = false
      }
    },

    // 获取标签数据
    async getTagsData() {
      try {
        this.setLoadingState('tags', true)
        const response = await photoApi.getTags()
        this.tags = response.data?.tags || []
        return this.tags
      } catch (error) {
        this.error = error.message
        console.error('Failed to load tags:', error)
        throw error
      } finally {
        this.setLoadingState('tags', false)
      }
    },

    // 获取文件夹数据
    async getFoldersData() {
      try {
        this.setLoadingState('folders', true)
        const response = await photoApi.getFolders()
        this.folders = response.data || []
        return this.folders
      } catch (error) {
        this.error = error.message
        console.error('Failed to load folders:', error)
        throw error
      } finally {
        this.setLoadingState('folders', false)
      }
    },

    // 获取地点数据
    async getLocationsData() {
      try {
        this.setLoadingState('locations', true)
        const response = await photoApi.getLocations()
        this.locations = response.data || []
        return this.locations
      } catch (error) {
        this.error = error.message
        console.error('Failed to load locations:', error)
        throw error
      } finally {
        this.setLoadingState('locations', false)
      }
    },

    // 上传图片
    async uploadPhotos(formData) {
      try {
        this.setLoadingState('photos', true)
        this.error = null
        const response = await photoApi.uploadPhotos(formData)
        return response
      } catch (error) {
        this.error = error.message
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || '上传图片失败')
        throw error
      } finally {
        this.setLoadingState('photos', false)
      }
    }
  }
})