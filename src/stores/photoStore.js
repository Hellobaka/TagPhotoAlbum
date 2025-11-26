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
      return state.activeTab === 'recommend' ? state.recommendPhotos : state.photos
    },

    // 通用的提取唯一值方法
    _extractUniqueValues: (state) => (fieldName) => {
      const values = new Set()
      state.photos.forEach(photo => {
        const value = photo[fieldName]
        if (value) values.add(value)
      })
      return Array.from(values)
    },

    allTags(state) {
      return this._extractUniqueValues('tags').flatMap(tags => tags || [])
    },

    allFolders() {
      return this._extractUniqueValues('folder')
    },

    allLocations() {
      return this._extractUniqueValues('location')
    },

    // 未分类照片
    uncategorizedPhotos: (state) => {
      return state.photos.filter(photo =>
        !photo.folder || photo.folder === '未分类'
      )
    }
  },

  actions: {
    // 通用的API调用包装器 - 减少重复的try-catch-finally代码
    async _apiCall(apiMethod, loadingType, errorMessage, ...args) {
      try {
        if (loadingType) this.setLoadingState(loadingType, true)
        this.error = null
        return await apiMethod(...args)
      } catch (error) {
        this.error = error.message
        console.error(errorMessage, error)
        const notificationStore = useNotificationStore()
        notificationStore.showError(error.message || errorMessage)
        throw error
      } finally {
        if (loadingType) this.setLoadingState(loadingType, false)
      }
    },

    // 通用的分页加载方法
    async _loadPaginatedData(apiMethod, pageNumber, pageSize, options = {}) {
      const {
        loadingType = 'photos',
        storeKey = 'photos',
        pageKey = 'currentPage',
        filters = this.currentFilters
      } = options

      try {
        this.setLoadingState(loadingType, true)
        const response = await apiMethod(pageNumber, pageSize, filters)
        const newPhotos = response.data || []

        if (pageNumber === 1) {
          this[storeKey] = newPhotos
          this[pageKey] = 1
          this.hasMore = newPhotos.length >= pageSize
        } else {
          this[storeKey] = [...this[storeKey], ...newPhotos]
          this[pageKey] = pageNumber
          this.hasMore = newPhotos.length >= pageSize
        }

        // 存储总数（如果有）
        if (response.pagination?.total !== undefined) {
          this.totalUncategorizedCount = response.pagination.total
        }

        return newPhotos
      } catch (error) {
        this.error = error.message
        console.error('Failed to load paginated data:', error)
        throw error
      } finally {
        this.setLoadingState(loadingType, false)
      }
    },

    // 初始化标签数据（在 PhotoGrid 组件加载时调用）
    async initTagsData() {
      if (this.tagsData.hasRequested) return
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

    // 通用的照片更新方法 - 在多个数组中查找并更新
    _updatePhotoInArrays(updatedPhoto) {
      const arrays = [
        { key: 'photos', array: this.photos },
        { key: 'recommendPhotos', array: this.recommendPhotos }
      ]

      arrays.forEach(({ array }) => {
        const index = array.findIndex(photo => photo.id === updatedPhoto.id)
        if (index !== -1) {
          array[index] = updatedPhoto
        }
      })
    },

    async updatePhoto(updatedPhoto) {
      return this._apiCall(
        async () => {
          const response = await photoApi.updatePhoto(updatedPhoto.id, updatedPhoto)
          if (response.success) {
            this._updatePhotoInArrays(updatedPhoto)
            this.updateLocalTagsData(updatedPhoto)
          }
          return response
        },
        null,
        '更新照片失败'
      )
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
      this.currentPage = 1
      this.hasMore = true
      if (filters) {
        this.currentFilters = { ...this.currentFilters, ...filters }
      }

      return this._loadPaginatedData(
        photoApi.getPhotosPaginated.bind(photoApi),
        1,
        20,
        { loadingType: 'photos', storeKey: 'photos', pageKey: 'currentPage' }
      )
    },

    // 加载更多照片
    async loadMorePhotos() {
      if (this.isLoadMore || !this.hasMore) return

      try {
        this.isLoadMore = true
        const nextPage = this.currentPage + 1
        const newPhotos = await this._loadPaginatedData(
          photoApi.getPhotosPaginated.bind(photoApi),
          nextPage,
          20,
          { loadingType: null, storeKey: 'photos', pageKey: 'currentPage' }
        )
        return newPhotos.length
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
      return this._apiCall(
        () => photoApi.searchPhotos(query),
        'search',
        '搜索失败'
      ).then(response => response.data || [])
    },

    // 创建照片
    async createPhoto(photoData) {
      return this._apiCall(
        async () => {
          const response = await photoApi.createPhoto(photoData)
          if (response.success) {
            this.photos.push(response.data)
          }
          return response
        },
        null,
        '发送创建请求失败'
      )
    },

    // 删除照片
    async deletePhoto(id) {
      return this._apiCall(
        async () => {
          const response = await photoApi.deletePhoto(id)
          if (response.success) {
            this.photos = this.photos.filter(photo => photo.id !== id)
          }
          return response
        },
        null,
        '发送删除请求失败'
      )
    },

    // 获取推荐照片
    async getRecommendPhotos(excludeIds = null) {
      if (this.isLoadMore || !this.hasMore) return

      return this._apiCall(
        async () => {
          this.hasMore = true
          const idsToExclude = excludeIds !== null ? excludeIds : this.lastRecommendPhotoIds
          const response = await photoApi.getRecommendPhotos(idsToExclude)

          this.recommendPhotos = response.data || []
          this.lastRecommendPhotoIds = this.recommendPhotos.map(photo => photo.id)
          this.hasMore = this.recommendPhotos.length >= 20

          return this.recommendPhotos
        },
        'recommend',
        '加载推荐照片失败'
      )
    },

    // 获取未分类照片（第一页）
    async getUncategorizedPhotos() {
      this.uncategorizedCurrentPage = 1
      this.hasMore = true

      return this._loadPaginatedData(
        photoApi.getUncategorizedPhotos.bind(photoApi),
        1,
        20,
        { loadingType: 'photos', storeKey: 'photos', pageKey: 'uncategorizedCurrentPage' }
      )
    },

    // 加载更多未分类照片
    async loadMoreUncategorizedPhotos() {
      if (this.isLoadMore || !this.hasMore) return

      try {
        this.isLoadMore = true
        const nextPage = this.uncategorizedCurrentPage + 1
        const newPhotos = await this._loadPaginatedData(
          photoApi.getUncategorizedPhotos.bind(photoApi),
          nextPage,
          20,
          { loadingType: null, storeKey: 'photos', pageKey: 'uncategorizedCurrentPage' }
        )
        return newPhotos.length
      } finally {
        this.isLoadMore = false
      }
    },

    // 通用的数据获取方法 - 用于tags/folders/locations
    async _fetchResourceData(resourceName, apiMethod, loadingType) {
      return this._apiCall(
        async () => {
          const response = await apiMethod()
          const data = response.data?.[resourceName] || response.data || []
          this[resourceName] = data

          // 特殊处理标签数据状态
          if (resourceName === 'tags') {
            this.tagsData.hasRequested = true
            this.tagsData.isEmpty = data.length === 0
          }

          return data
        },
        loadingType,
        `Failed to load ${resourceName}`
      ).catch(error => {
        // 标签请求失败时也标记为已请求
        if (resourceName === 'tags') {
          this.tagsData.hasRequested = true
        }
        throw error
      }).finally(() => {
        if (resourceName === 'tags') {
          this.tagsData.isRequesting = false
        }
      })
    },

    // 获取标签数据
    async getTagsData() {
      this.tagsData.isRequesting = true
      return this._fetchResourceData('tags', photoApi.getTags.bind(photoApi), 'tags')
    },

    // 获取文件夹数据
    async getFoldersData() {
      return this._fetchResourceData('folders', photoApi.getFolders.bind(photoApi), 'folders')
    },

    // 获取地点数据
    async getLocationsData() {
      return this._fetchResourceData('locations', photoApi.getLocations.bind(photoApi), 'locations')
    },

    // 上传图片
    async uploadPhotos(formData, onUploadProgress) {
      try {
        this.setLoadingState('photos', true)
        this.error = null

        // 从formData获取文件列表
        const files = formData.getAll('files')
        const fileCount = files.length

        if (fileCount === 0) {
          throw new Error('没有选择文件')
        }

        // 设置最大并发数
        const MAX_CONCURRENT_UPLOADS = 5
        let completedFiles = 0
        let failedFiles = 0

        // 创建文件上传任务队列
        const uploadTasks = files.map((file, index) => async () => {
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
                loaded: Math.round(currentOverallProgress),
                total: 100
              })
            }
          }

          try {
            // 为每个文件创建独立的超时控制
            const uploadPromise = photoApi.uploadPhotos(singleFileFormData, fileProgressCallback)

            const result = await Promise.race([
              uploadPromise,
              new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`文件上传超时 (${UPLOAD_CONFIG.TIMEOUT_PER_IMAGE / 1000}秒)`)), UPLOAD_CONFIG.TIMEOUT_PER_IMAGE)
              })
            ])

            completedFiles++

            // 更新总体进度（但不显示100%，直到所有文件都完成）
            if (onUploadProgress) {
              const completedProgress = completedFiles * (100 / fileCount)
              // 只有当不是最后一个文件时才更新进度
              if (completedFiles < fileCount) {
                onUploadProgress({
                  loaded: Math.round(completedProgress),
                  total: 100
                })
              }
              // 最后一个文件的100%进度将在所有文件完成后统一设置
            }

            return result
          } catch (error) {
            failedFiles++
            throw error
          }
        })

        // 并发控制函数
        const runWithConcurrency = async (tasks, maxConcurrent) => {
          const results = []
          const executing = []

          for (const task of tasks) {
            const p = task().then(result => {
              executing.splice(executing.indexOf(p), 1)
              return result
            })

            executing.push(p)
            results.push(p)

            if (executing.length >= maxConcurrent) {
              await Promise.race(executing)
            }
          }

          return Promise.allSettled(results)
        }

        // 执行上传任务，控制并发数
        const responses = await runWithConcurrency(uploadTasks, MAX_CONCURRENT_UPLOADS)

        // 检查上传结果
        const successfulUploads = responses.filter(result => result.status === 'fulfilled')
        const failedUploads = responses.filter(result => result.status === 'rejected')

        // 如果有失败的上传
        if (failedUploads.length > 0) {
          console.error('部分文件上传失败:', failedUploads)
          const errorMessage = failedUploads.length === fileCount ?
            '所有文件上传失败' :
            `${failedUploads.length} 个文件上传失败`
          throw new Error(errorMessage)
        }

        // 返回成功上传的响应
        return successfulUploads.map(result => result.value)
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