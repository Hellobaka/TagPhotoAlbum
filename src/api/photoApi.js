import axios from 'axios'
import API_CONFIG from '@/config/api'

const API_BASE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`发起请求: ${config.method?.toUpperCase()} ${config.url}`)

    // 添加 JWT token 到请求头
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API请求错误:', error.response?.data || error.message)

    // 获取错误消息
    let errorMessage = '网络请求失败'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }

    // 处理认证错误
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')

      // 重定向到登录页面
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      } else {
        return Promise.resolve({ success: false })
      }
    } else {
      // 显示错误消息到SnackBar
      // 注意：这里不能直接导入store，需要在组件中处理
      // 错误会通过Promise.reject传递到调用处
    }

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    })
  }
)

export const photoApi = {
  // 用户认证
  login(credentials) {
    return api.post('/auth/login', credentials)
  },

  // 获取照片列表
  getPhotos(params = {}) {
    return api.get('/photos', { params })
  },

  // 分页获取照片列表
  getPhotosPaginated(page = 1, limit = 20, filters = {}) {
    const params = {
      page,
      limit
    }

    // 添加筛选参数
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',')
    }
    if (filters.folder) {
      params.folder = filters.folder
    }
    if (filters.location) {
      params.location = filters.location
    }
    if (filters.searchQuery) {
      params.q = filters.searchQuery
    }

    return api.get('/photos', { params })
  },

  // 获取单个照片
  getPhoto(id) {
    return api.get(`/photos/${id}`)
  },

  // 创建照片
  createPhoto(photoData) {
    return api.post('/photos', photoData)
  },

  // 更新照片
  updatePhoto(id, photoData) {
    return api.put(`/photos/${id}`, photoData)
  },

  // 删除照片
  deletePhoto(id) {
    return api.delete(`/photos/${id}`)
  },

  // 获取所有标签
  getTags() {
    return api.get('/metadata/tags')
  },

  // 获取所有文件夹
  getFolders() {
    return api.get('/metadata/folders')
  },

  // 获取所有地点
  getLocations() {
    return api.get('/metadata/locations')
  },

  // 搜索照片
  searchPhotos(query) {
    return api.get('/search', { params: { q: query } })
  },

  // 获取推荐照片
  getRecommendPhotos() {
    return api.get('/photos/recommend')
  },

  // 上传图片
  uploadPhotos(formData) {
    return api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取未分类照片
  getUncategorizedPhotos() {
    return api.get('/photos/uncategorized')
  },

}

export default photoApi