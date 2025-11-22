import { defineStore } from 'pinia'
import { photoApi } from '@/api/photoApi'
import { useNotificationStore } from './notificationStore'
import UPLOAD_CONFIG from '@/config/upload'

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
    },
    // 标签数据状态管理
    tagsData: {
      hasRequested: false, // 是否已经请求过标签数据
      isEmpty: false, // 服务器返回的标签数据是否为空
      isRequesting: false // 是否正在请求标签数据
    }
  }),

  getters: {
    // 计算标签 - 自动确保数据已加载，优先使用服务器标签数据
    computedTags: (state) => {
      // 如果服务器标签数据不为空，使用服务器数据
      if (state.tags.length > 0) {
        return state.tags.map(tag => ({
          name: tag.name || tag,
          count: tag.count || 1
        })).sort((a, b) => b.count - a.count)
      }

      // 如果服务器标签数据为空，使用本地计算
      const tagCounts = {}

      // 统计所有照片中的标签
      const allPhotos = [...state.photos, ...state.recommendPhotos]
      allPhotos.forEach(photo => {
        if (photo.tags && Array.isArray(photo.tags)) {
          photo.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })

      // 转换为数组格式
      return Object.entries(tagCounts).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count)
    },

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
    // 初始化标签数据（在 PhotoGrid 组件加载时调用）
    async initTagsData() {
      // 如果已经请求过，不再重复请求
      if (this.tagsData.hasRequested) {
        return
      }

      await this.getTagsData()
    },

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

          // 更新本地标签数据，避免重复向服务器请求
          this.updateLocalTagsData(updatedPhoto)
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

    // 更新本地标签数据
    updateLocalTagsData(updatedPhoto) {
      if (!updatedPhoto.tags || !Array.isArray(updatedPhoto.tags)) {
        return
      }

      // 如果服务器标签数据为空，我们只在本地维护标签数据
      if (this.tagsData.isEmpty) {
        // 不需要更新服务器标签数据，因为我们已经知道服务器是空的
        return
      }

      // 如果服务器有标签数据，更新本地标签计数
      const newTags = updatedPhoto.tags
      const existingTags = new Set(this.tags.map(tag => tag.name || tag))

      // 更新标签计数
      newTags.forEach(tagName => {
        const existingTag = this.tags.find(tag => (tag.name || tag) === tagName)
        if (existingTag) {
          // 增加现有标签的计数
          existingTag.count = (existingTag.count || 0) + 1
        } else {
          // 添加新标签
          this.tags.push({ name: tagName, count: 1 })
        }
      })

      // 重新排序
      this.tags.sort((a, b) => (b.count || 0) - (a.count || 0))
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
        this.tagsData.isRequesting = true
        this.setLoadingState('tags', true)
        const response = await photoApi.getTags()
        this.tags = response.data?.tags || []

        // 更新标签数据状态
        this.tagsData.hasRequested = true
        this.tagsData.isEmpty = this.tags.length === 0

        return this.tags
      } catch (error) {
        this.error = error.message
        console.error('Failed to load tags:', error)
        // 即使请求失败，也标记为已请求，避免重复请求
        this.tagsData.hasRequested = true
        throw error
      } finally {
        this.tagsData.isRequesting = false
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
    async uploadPhotos(formData, onUploadProgress) {
      try {
        this.setLoadingState('photos', true)
        this.error = null
        
        // 从formData获取文件列表以计算并发数
        const files = formData.getAll('files')
        const fileCount = files.length
        
        // 并发上传所有文件
        let completedFiles = 0
        const uploadPromises = files.map((file, index) => {
          const singleFileFormData = new FormData()
          singleFileFormData.append('files', file)

          // 为每个文件创建独立的上传进度回调
          const fileProgressCallback = (progressEvent) => {
            if (onUploadProgress) {
              // 计算单个文件的进度
              const singleFileProgress = progressEvent.total ?
                Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0

              // 每个文件占总进度的 1/fileCount
              const fileWeight = 100 / fileCount
              const fileProgress = (singleFileProgress / 100) * fileWeight

              // 计算当前总体进度（已完成的文件 + 当前文件的进度）
              const completedProgress = completedFiles * fileWeight
              const currentOverallProgress = completedProgress + fileProgress

              onUploadProgress({
                loaded: Math.min(95, Math.round(currentOverallProgress)),
                total: 100
              })
            }
          }

          return photoApi.uploadPhotos(singleFileFormData, fileProgressCallback)
            .then(result => {
              completedFiles++
              return result
            })
        })
        
        // 计算整体超时时间
        const overallTimeout = Math.min(
          fileCount * UPLOAD_CONFIG.TIMEOUT_PER_IMAGE,
          UPLOAD_CONFIG.MAX_TIMEOUT
        )

        // 为每个上传请求添加超时控制
        const uploadPromisesWithTimeout = uploadPromises.map(promise =>
          Promise.race([
            promise,
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('单个文件上传超时')), UPLOAD_CONFIG.TIMEOUT_PER_IMAGE)
            })
          ])
        )

        // 并发执行所有上传请求
        const responses = await Promise.allSettled(uploadPromisesWithTimeout)
        
        // 检查是否有失败的上传
        const failedUploads = responses.filter(result => result.status === 'rejected')
        if (failedUploads.length > 0) {
          console.error('部分文件上传失败:', failedUploads)
          // 如果有任何失败，抛出错误
          throw new Error(`上传失败: ${failedUploads.length} 个文件上传失败`)
        }
        
        // 返回成功上传的响应
        return responses.map(result => result.value)
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