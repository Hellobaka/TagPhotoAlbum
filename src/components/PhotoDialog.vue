<template>
  <Transition name="dialog-fade">
    <div v-if="selectedPhoto" class="dialog-overlay" @click="closePhotoDetail">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">图片详情</h2>
            <md-icon-button @click="closePhotoDetail" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <PhotoEditor
              :photo="selectedPhoto"
              :editable-photo="editablePhoto"
              :new-tag="newTag"
              :tags-to-remove="tagsToRemove"
              :popular-tags="popularTags"
              :all-folders="photoStore.allFolders"
              @update:title="value => editablePhoto.title = value"
              @update:description="value => editablePhoto.description = value"
              @update:location="value => editablePhoto.location = value"
              @update:folder="value => editablePhoto.folder = value"
              @update:rating="value => editablePhoto.rating = value"
              @update:newTag="value => newTag = value"
              @toggle-tag="toggleTag"
              @toggle-tag-for-removal="toggleTagForRemoval"
              @add-tag="addTag"
            />
          </div>

          <div class="dialog-actions">
            <md-text-button @click="closePhotoDetail" style="padding-left: 15px; padding-right: 15px;"
              :disabled="isSaving">取消</md-text-button>
            <md-text-button @click="savePhotoInfo" style="padding-left: 15px; padding-right: 15px;"
              :disabled="isSaving">
              <span v-if="isSaving" class="loading-spinner"></span>
              {{ isSaving ? '保存中...' : '保存' }}
            </md-text-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- 未保存标签确认对话框 -->
  <Transition name="dialog-fade">
    <div v-if="showUnsavedTagDialog" class="dialog-overlay" @click="showUnsavedTagDialog = false">
      <Transition name="dialog-scale">
        <div class="confirm-dialog" @click.stop>
          <div class="dialog-header">
            <h3 class="md-typescale-title-large">未保存的标签</h3>
          </div>
          <div class="dialog-content">
            <p class="md-typescale-body-medium">
              您有一个未保存的标签 "{{ newTag }}"。是否要添加此标签后再保存？
            </p>
          </div>
          <div class="dialog-actions">
            <md-text-button @click="cancelUnsavedTag" style="padding-left: 15px; padding-right: 15px;">
              取消
            </md-text-button>
            <md-text-button @click="saveWithoutUnsavedTag" style="padding-left: 15px; padding-right: 15px;">
              不添加，直接保存
            </md-text-button>
            <md-text-button @click="addUnsavedTagAndSave" style="padding-left: 15px; padding-right: 15px;">
              添加并保存
            </md-text-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useNotificationStore } from '@/stores/notificationStore'
import PhotoEditor from '@/components/PhotoEditor.vue'

const props = defineProps({
  selectedPhoto: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close-photo-detail', 'save-photo-info'])

// 响应式数据
const editablePhoto = ref({})
const newTag = ref('')
const isSaving = ref(false)
const tagsToRemove = ref([])
const showUnsavedTagDialog = ref(false)

// 使用 Pinia store
const photoStore = usePhotoStore()
const notificationStore = useNotificationStore()

// 计算属性 - 获取常用标签及其使用次数
const popularTags = computed(() => {
  return photoStore.computedTags
})

// 监听选中的照片变化
watch(() => props.selectedPhoto, (newPhoto) => {
  if (newPhoto) {
    editablePhoto.value = { ...newPhoto }
    newTag.value = ''
    tagsToRemove.value = []
  } else {
    editablePhoto.value = {}
    newTag.value = ''
    tagsToRemove.value = []
  }
}, { immediate: true })

// 方法
const closePhotoDetail = () => {
  // 重置待删除标签列表
  tagsToRemove.value = []
  emit('close-photo-detail')
}

const addTag = (tagToAdd = null) => {
  // 如果传入了标签参数，使用参数；否则使用 newTag.value
  const trimmedTag = tagToAdd ? tagToAdd.trim() : newTag.value.trim()
  if (!trimmedTag) return
  
  // 检查标签是否已存在
  if (editablePhoto.value.tags.includes(trimmedTag)) {
    // 如果标签在待删除列表中，从列表中移除（取消删除）
    const removeIndex = tagsToRemove.value.indexOf(trimmedTag)
    if (removeIndex > -1) {
      tagsToRemove.value.splice(removeIndex, 1)
      newTag.value = ''
    }
    // 如果标签已存在且不在待删除列表中，不做任何操作
  } else {
    // 标签不存在，添加到标签列表
    editablePhoto.value.tags.push(trimmedTag)
    newTag.value = ''
  }
}

const toggleTagForRemoval = (tag) => {
  const index = tagsToRemove.value.indexOf(tag)
  if (index > -1) {
    // 如果标签已经在待删除列表中，则移除
    tagsToRemove.value.splice(index, 1)
  } else {
    // 如果标签不在待删除列表中，则添加
    tagsToRemove.value.push(tag)
  }
}

const toggleTag = (tag) => {
  // 检查标签是否在照片的标签列表中
  const tagExistsInPhoto = editablePhoto.value.tags.includes(tag)
  
  if (tagExistsInPhoto) {
    // 标签已存在，切换待删除状态
    const index = tagsToRemove.value.indexOf(tag)
    if (index > -1) {
      // 标签已被标记为删除，取消删除标记
      tagsToRemove.value.splice(index, 1)
    } else {
      // 标签未被标记为删除，标记为删除
      tagsToRemove.value.push(tag)
    }
  } else {
    // 标签不存在，添加标签
    editablePhoto.value.tags.push(tag)
  }
}

const savePhotoInfo = async () => {
  if (isSaving.value) return

  // 检查是否有未保存的标签
  if (newTag.value.trim() && !editablePhoto.value.tags.includes(newTag.value.trim())) {
    showUnsavedTagDialog.value = true
    return
  }

  await performSave()
}

const performSave = async () => {
  try {
    isSaving.value = true

    // 在保存前移除标记为删除的标签
    if (tagsToRemove.value.length > 0) {
      editablePhoto.value.tags = editablePhoto.value.tags.filter(tag => !tagsToRemove.value.includes(tag))
      tagsToRemove.value = []
    }

    await photoStore.updatePhoto(editablePhoto.value)
    emit('save-photo-info', editablePhoto.value)

    // 保存成功后显示成功通知
    notificationStore.showSuccess('保存成功')
  } catch (error) {
    console.error('保存图片信息失败:', error)
    notificationStore.showError('保存失败，请稍后重试')
  } finally {
    isSaving.value = false
  }
}

const addUnsavedTagAndSave = () => {
  if (newTag.value.trim() && !editablePhoto.value.tags.includes(newTag.value.trim())) {
    editablePhoto.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
  showUnsavedTagDialog.value = false
  performSave()
}

const saveWithoutUnsavedTag = () => {
  newTag.value = ''
  showUnsavedTagDialog.value = false
  performSave()
}

const cancelUnsavedTag = () => {
  showUnsavedTagDialog.value = false
}

</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.dialog-container {
  background: var(--md-sys-color-surface);
  border-radius: 28px;
  box-shadow: var(--md-sys-elevation-level3);
  max-width: 1200px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  margin-bottom: 16px;
}

.close-btn {
  margin-left: auto;
}

.dialog-content {
  padding: 0 24px;
  flex: 1;
  overflow: auto;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--md-sys-color-on-surface);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 动画样式 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dialog-content {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .dialog-overlay {
    padding: 10px;
  }

  .dialog-container {
    max-height: 95vh;
  }

  .dialog-content {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px 16px 0 16px;
  }

  .dialog-actions {
    padding: 12px 16px 16px 16px;
  }
}

/* 确认对话框样式 */
.confirm-dialog {
  background: var(--md-sys-color-surface);
  border-radius: 28px;
  box-shadow: var(--md-sys-elevation-level3);
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.confirm-dialog .dialog-header {
  padding: 24px 24px 0 24px;
  margin-bottom: 16px;
}

.confirm-dialog .dialog-content {
  padding: 0 24px 16px 24px;
  flex: 1;
}

.confirm-dialog .dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}
</style>