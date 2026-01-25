import { ref } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { findAndRemove } from '@/utils/dataHelper'

/**
 * 照片分类管理的组合函数
 */
export function usePhotoCategorization() {
  const photoStore = usePhotoStore()
  const notificationStore = useNotificationStore()
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

      // 使用 dataHelper 从本地数据中移除当前照片
      const photoId = photoData.id
      findAndRemove(photoStore.photos, 'id', photoId)
      findAndRemove(photoStore.recommendPhotos, 'id', photoId)
      
      notificationStore.showSnackbar('照片已分类', 'success')
    } catch (error) {
      console.error('保存图片信息失败:', error)
      notificationStore.showSnackbar('保存失败，请重试', 'error')
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
