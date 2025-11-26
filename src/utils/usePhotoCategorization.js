import { ref } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'

/**
 * 照片分类管理的组合函数
 */
export function usePhotoCategorization() {
  const photoStore = usePhotoStore()
  const isCategorizing = ref(false)

  // 开始分类
  const startCategorization = (selectedPhoto = null, filteredPhotos = []) => {
    isCategorizing.value = true
    if (selectedPhoto) {
      photoStore.setCurrentCategorizePhoto(selectedPhoto)
    } else if (filteredPhotos.length > 0) {
      photoStore.setCurrentCategorizePhoto(filteredPhotos[0])
    }
  }

  // 停止分类
  const stopCategorization = () => {
    isCategorizing.value = false
  }

  // 保存并进入下一张
  const handleSaveAndNext = async (photoData) => {
    try {
      await photoStore.updatePhoto(photoData)

      // 从本地数据中移除当前照片
      const photoId = photoData.id

      // 从 photos 数组中移除
      const photoIndex = photoStore.photos.findIndex(photo => photo.id === photoId)
      if (photoIndex !== -1) {
        photoStore.photos.splice(photoIndex, 1)
      }

      // 从 recommendPhotos 数组中移除
      const recommendIndex = photoStore.recommendPhotos.findIndex(photo => photo.id === photoId)
      if (recommendIndex !== -1) {
        photoStore.recommendPhotos.splice(recommendIndex, 1)
      }
    } catch (error) {
      console.error('保存图片信息失败:', error)
    }
  }

  // 跳过当前照片
  const handleNext = () => {
    // 直接进入下一张，不保存当前图片
  }

  return {
    isCategorizing,
    startCategorization,
    stopCategorization,
    handleSaveAndNext,
    handleNext
  }
}
