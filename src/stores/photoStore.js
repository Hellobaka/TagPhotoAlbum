import { defineStore } from 'pinia'
import { photoApi } from '@/api/photoApi'

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
    recommendPhotos: []
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
    }
  },

  actions: {
    setActiveTab(tab) {
      this.activeTab = tab
    },

    setSelectedPhoto(photo) {
      this.selectedPhoto = photo
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

        // 从 API 获取照片数据
        const photosResponse = await photoApi.getPhotos()
        this.photos = photosResponse.data || []

        // 获取标签数据
        const tagsResponse = await photoApi.getTags()
        this.tags = tagsResponse.data || []

        // 获取文件夹数据
        const foldersResponse = await photoApi.getFolders()
        this.folders = foldersResponse.data || []

        // 获取地点数据
        const locationsResponse = await photoApi.getLocations()
        this.locations = locationsResponse.data || []

      } catch (error) {
        this.error = error.message
        console.error('Failed to initialize data:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 搜索照片
    async searchPhotos(query) {
      try {
        this.isLoading = true
        this.error = null
        const response = await photoApi.searchPhotos(query)
        return response.data || []
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
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
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 获取推荐照片
    async getRecommendPhotos() {
      try {
        this.isLoading = true
        this.error = null
        const response = await photoApi.getRecommendPhotos()
        this.recommendPhotos = response.data || []
        return this.recommendPhotos
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})