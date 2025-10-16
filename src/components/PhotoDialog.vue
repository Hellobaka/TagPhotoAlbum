<template>
  <div v-if="selectedPhoto" class="dialog-overlay" @click="closePhotoDetail">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h2 class="md-typescale-headline-small">图片详情</h2>
        <md-icon-button @click="closePhotoDetail" class="close-btn">
          <span class="material-symbols-outlined">close</span>
        </md-icon-button>
      </div>

      <div class="dialog-content">
        <div class="photo-container">
          <img :src="selectedPhoto.url" :alt="selectedPhoto.title" />
        </div>

        <div class="info-section">
          <md-outlined-text-field
            :value="editablePhoto.title"
            @input="e => editablePhoto.title = e.target.value"
            label="标题"
            class="info-field"
          />

          <md-outlined-text-field
            :value="editablePhoto.description"
            @input="e => editablePhoto.description = e.target.value"
            label="描述"
            type="textarea"
            rows="3"
            class="info-field"
          />

          <div class="tags-section">
            <h3 class="md-typescale-title-medium">标签</h3>
            <div class="tags-container">
              <md-suggestion-chip
                v-for="tag in editablePhoto.tags"
                :key="tag"
                :label="tag"
                @click="removeTag(tag)"
                :class="getTagColorClass(tag)"
              />
              <div class="add-tag">
                <md-outlined-text-field
                  :value="newTag"
                  @input="e => newTag = e.target.value"
                  label="添加标签"
                  @keyup.enter="addTag"
                >
                  <md-icon-button
                    slot="trailing-icon"
                    @click="addTag"
                  >
                    <span class="material-symbols-outlined">add</span>
                  </md-icon-button>
                </md-outlined-text-field>
              </div>
            </div>
          </div>

          <div class="info-grid">
              <md-outlined-select :value="editablePhoto.folder" @change="e => editablePhoto.folder = e.target.value" label="文件夹" class="info-field">
                <md-select-option
                  v-for="option in photoStore.allFolders"
                  :key="option.value"
                  :value="option.value"
                >
                  <div slot="headline">{{ option }}</div>
                </md-select-option>
              </md-outlined-select>
              <md-outlined-text-field
              :value="editablePhoto.location"
              @input="e => editablePhoto.location = e.target.value"
              label="地点"
              class="info-field"
            />
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <md-text-button @click="closePhotoDetail" style="padding-left: 15px; padding-right: 15px;" :disabled="isSaving">取消</md-text-button>
        <md-text-button @click="savePhotoInfo" style="padding-left: 15px; padding-right: 15px;" :disabled="isSaving">
          <span v-if="isSaving" class="loading-spinner"></span>
          {{ isSaving ? '保存中...' : '保存' }}
        </md-text-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'

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

// 使用 Pinia store
const photoStore = usePhotoStore()

// 监听选中的照片变化
watch(() => props.selectedPhoto, (newPhoto) => {
  if (newPhoto) {
    editablePhoto.value = { ...newPhoto }
    newTag.value = ''
  } else {
    editablePhoto.value = {}
    newTag.value = ''
  }
}, { immediate: true })

// 方法
const closePhotoDetail = () => {
  emit('close-photo-detail')
}

const addTag = () => {
  if (newTag.value.trim() && !editablePhoto.value.tags.includes(newTag.value.trim())) {
    editablePhoto.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag) => {
  editablePhoto.value.tags = editablePhoto.value.tags.filter(t => t !== tag)
}

const savePhotoInfo = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true
    await photoStore.updatePhoto(editablePhoto.value)
    emit('save-photo-info', editablePhoto.value)
  } catch (error) {
    console.error('保存图片信息失败:', error)
    // 这里可以添加错误提示，比如使用 toast 通知用户
    alert('保存失败，请稍后重试')
  } finally {
    isSaving.value = false
  }
}

const getTagColorClass = (tag) => {
  // 预定义一组颜色类名
  const colorClasses = [
    'tag-color-art',
    'tag-color-abstract',
    'tag-color-color',
    'tag-color-nature',
    'tag-color-travel',
    'tag-color-people',
    'tag-color-building',
    'tag-color-design',
    'tag-color-modern',
    'tag-color-photo'
  ]

  // 根据标签字符串生成一个稳定的哈希值
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }

  // 使用哈希值选择颜色类名
  const index = Math.abs(hash) % colorClasses.length
  return colorClasses[index]
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
  z-index: 1000;
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
  display: flex;
  gap: 24px;
  padding: 0 24px;
  flex: 1;
  overflow: auto;
}

.photo-container {
  flex: 1;
  background: var(--md-sys-color-surface-container-high);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  margin-top: 10px;
}

.photo-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.info-section {
  flex: 1;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
  padding-bottom: 16px;
}

.info-field {
  width: 100%;
}

.tags-section {
  margin-top: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.add-tag {
  width: 100%;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dialog-content {
    flex-direction: column;
  }

  .photo-container {
    max-height: 300px;
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

  .info-grid {
    grid-template-columns: 1fr;
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
</style>