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
    // 新增加载状态
    loadingStates: {
      photos: false,
      tags: false,
      folders: false,
      locations: false,
      search: false,
      recommend: false
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
        !photo.folder || !photo.location ||
        !photo.title || photo.title === '未命名'
      )
    }
  },

  actions: {
    setActiveTab(tab) {
      this.activeTab = tab
    },

    setSelectedPhoto(photo) {
      this.selectedPhoto = photo
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

    // 初始化数据
    async initializeData() {
      try {
        this.isLoading = true
        this.error = null

        // 显示加载通知
        const notificationStore = useNotificationStore()
        notificationStore.showLoading('正在加载照片数据...')

        // 设置各个部分的加载状态
        this.setLoadingState('photos', true)
        this.setLoadingState('tags', true)
        this.setLoadingState('folders', true)
        this.setLoadingState('locations', true)

        // 从 API 获取照片数据
        const photosResponse = await photoApi.getPhotos()
        this.photos = photosResponse.data || []
        this.setLoadingState('photos', false)

        // 获取标签数据
        const tagsResponse = await photoApi.getTags()
        this.tags = tagsResponse.data || []
        this.setLoadingState('tags', false)

        // 获取文件夹数据
        const foldersResponse = await photoApi.getFolders()
        this.folders = foldersResponse.data || []
        this.setLoadingState('folders', false)

        // 获取地点数据
        const locationsResponse = await photoApi.getLocations()
        this.locations = locationsResponse.data || []
        this.setLoadingState('locations', false)

        // 隐藏加载通知
        notificationStore.removeMessage(notificationStore.activeMessages.find(msg => msg.type === 'loading')?.id)
        notificationStore.showSuccess('数据加载完成')

      } catch (error) {
        this.error = error.message
        console.error('Failed to initialize data:', error)
        const notificationStore = useNotificationStore()
        notificationStore.removeMessage(notificationStore.activeMessages.find(msg => msg.type === 'loading')?.id)
        notificationStore.showError(error.message || '加载数据失败')
        throw error
      } finally {
        this.isLoading = false
        // 重置所有加载状态
        Object.keys(this.loadingStates).forEach(key => {
          this.setLoadingState(key, false)
        })
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
    async getRecommendPhotos() {
      try {
        this.setLoadingState('recommend', true)
        this.error = null
        const response = await photoApi.getRecommendPhotos()
        this.recommendPhotos = response.data || []
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