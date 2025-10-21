<template>
  <div class="info-section">
    <md-outlined-text-field
      :value="editablePhoto.title"
      @input="e => $emit('update:title', e.target.value)"
      label="标题"
      class="info-field"
    />

    <md-outlined-text-field
      :value="editablePhoto.description"
      @input="e => $emit('update:description', e.target.value)"
      label="描述"
      type="textarea"
      rows="3"
      class="info-field"
    />

    <div class="tags-section">
      <h3 class="md-typescale-title-medium">标签</h3>

      <!-- 常用标签区域 -->
      <div class="popular-tags-section">
        <h4 class="md-typescale-body-medium">常用标签</h4>
        <span v-if="popularTags.length == 0">空</span>
        <div class="popular-tags-container">
          <md-suggestion-chip
            v-for="tag in popularTags"
            :key="tag"
            :label="`${tag.name} (${tag.count})`"
            @click="$emit('toggle-tag', tag.name)"
            :class="[getTagColorClass(tag.name), { 'tag-selected': editablePhoto.tags?.includes(tag.name) }]"
          />
        </div>
      </div>

      <!-- 当前图片标签 -->
      <div class="current-tags-section">
        <h4 class="md-typescale-body-medium">当前标签</h4>
        <div class="tags-container">
          <span v-if="editablePhoto.tags.length == 0">空</span>
          <md-suggestion-chip
            v-for="tag in editablePhoto.tags"
            :key="tag"
            :label="tag"
            @click="$emit('toggle-tag-for-removal', tag)"
            :class="[getTagColorClass(tag), { 'tag-marked-for-removal': tagsToRemove.includes(tag), 'tag-selected': !tagsToRemove.includes(tag) }]"
          />
        </div>
      </div>

      <!-- 添加新标签 -->
      <div class="add-tag-section">
        <div class="add-tag">
          <md-outlined-text-field
            :value="newTag"
            @input="handleTagInput"
            @focus="showTagSuggestions = true"
            @blur="handleTagBlur"
            label="添加标签"
            @keyup.enter="addTag"
            ref="tagInput"
          >
            <md-icon-button slot="trailing-icon" @click="addTag">
              <span class="material-symbols-outlined">add</span>
            </md-icon-button>
          </md-outlined-text-field>
          <div v-if="showTagSuggestions && filteredTags.length > 0" class="tag-suggestions" :class="{ 'fade-out': isTagSuggestionsClosing }" :style="getTagSuggestionsStyle()">
            <div
              v-for="tag in filteredTags"
              :key="tag"
              class="suggestion-item"
              @click="selectTagSuggestion(tag)"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="folder-field">
        <md-outlined-text-field
          :value="editablePhoto.folder"
          @input="handleFolderInput"
          @focus="showFolderSuggestions = true"
          @blur="handleFolderBlur"
          label="文件夹"
          class="info-field"
          ref="folderInput"
        />
        <div v-if="showFolderSuggestions && filteredFolders.length > 0" class="folder-suggestions" :class="{ 'fade-out': isFolderSuggestionsClosing }" :style="getFolderSuggestionsStyle()">
          <div
            v-for="folder in filteredFolders"
            :key="folder"
            class="suggestion-item"
            @click="selectFolderSuggestion(folder)"
          >
            {{ folder }}
          </div>
        </div>
      </div>
      <md-outlined-text-field
        :value="editablePhoto.location"
        @input="e => $emit('update:location', e.target.value)"
        label="地点"
        class="info-field"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'

const props = defineProps({
  editablePhoto: {
    type: Object,
    required: true
  },
  newTag: {
    type: String,
    default: ''
  },
  tagsToRemove: {
    type: Array,
    default: () => []
  },
  popularTags: {
    type: Array,
    default: () => []
  },
  allFolders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:title',
  'update:description',
  'update:location',
  'update:folder',
  'update:newTag',
  'toggle-tag',
  'toggle-tag-for-removal',
  'add-tag'
])

// 响应式数据
const showFolderSuggestions = ref(false)
const folderInput = ref(null)
const showTagSuggestions = ref(false)
const tagInput = ref(null)
const isTagSuggestionsClosing = ref(false)
const isFolderSuggestionsClosing = ref(false)

// 使用 Pinia store
const photoStore = usePhotoStore()

// 计算属性 - 过滤文件夹建议
const filteredFolders = computed(() => {
  if (!props.editablePhoto.folder) {
    return props.allFolders.slice(0, 5) // 显示前5个建议
  }

  const query = props.editablePhoto.folder.toLowerCase()
  return props.allFolders
    .filter(folder => folder.toLowerCase().includes(query))
    .slice(0, 5) // 最多显示5个建议
})

// 计算属性 - 过滤标签建议
const filteredTags = computed(() => {
  if (!props.newTag) {
    return photoStore.tags.map(x=>x.name).slice(0, 5)
  }

  const query = props.newTag.toLowerCase()
  return photoStore.tags
    .filter(tag => tag.name.toLowerCase().includes(query)).map(x=>x.name)
})

// 方法
const addTag = () => {
  if (props.newTag.trim() && !props.editablePhoto.tags.includes(props.newTag.trim())) {
    emit('add-tag', props.newTag.trim())
  }
}

const handleTagInput = (e) => {
  emit('update:newTag', e.target.value)
  showTagSuggestions.value = true
}

const selectTagSuggestion = (tag) => {
  emit('update:newTag', tag)
  closeTagSuggestionsWithAnimation()
}

const handleTagBlur = () => {
  // 使用 setTimeout 确保点击建议项时不会立即关闭列表
  setTimeout(() => {
    closeTagSuggestionsWithAnimation()
  }, 150)
}

const closeTagSuggestionsWithAnimation = () => {
  if (showTagSuggestions.value && !isTagSuggestionsClosing.value) {
    isTagSuggestionsClosing.value = true
    setTimeout(() => {
      showTagSuggestions.value = false
      isTagSuggestionsClosing.value = false
    }, 200)
  }
}

const handleFolderInput = (e) => {
  emit('update:folder', e.target.value)
  showFolderSuggestions.value = true
}

const selectFolderSuggestion = (folder) => {
  emit('update:folder', folder)
  closeFolderSuggestionsWithAnimation()
}

const handleFolderBlur = () => {
  // 使用 setTimeout 确保点击建议项时不会立即关闭列表
  setTimeout(() => {
    closeFolderSuggestionsWithAnimation()
  }, 150)
}

const closeFolderSuggestionsWithAnimation = () => {
  if (showFolderSuggestions.value && !isFolderSuggestionsClosing.value) {
    isFolderSuggestionsClosing.value = true
    setTimeout(() => {
      showFolderSuggestions.value = false
      isFolderSuggestionsClosing.value = false
    }, 200)
  }
}

// 点击外部关闭建议列表
const handleClickOutside = (event) => {
  // 检查是否点击了建议项
  const isSuggestionItem = event.target.classList.contains('suggestion-item')

  if (folderInput.value && !folderInput.value.contains(event.target) && !isSuggestionItem) {
    closeFolderSuggestionsWithAnimation()
  }
  if (tagInput.value && !tagInput.value.contains(event.target) && !isSuggestionItem) {
    closeTagSuggestionsWithAnimation()
  }
}

// 添加全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const getTagSuggestionsStyle = () => {
  if (!tagInput.value) return {}

  const rect = tagInput.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`
  }
}

const getFolderSuggestionsStyle = () => {
  if (!folderInput.value) return {}

  const rect = folderInput.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`
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

.popular-tags-section {
  margin-bottom: 16px;
}

.popular-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.current-tags-section {
  margin-bottom: 16px;
}

.add-tag-section {
  margin-top: 16px;
}

.add-tag {
  width: 100%;
  position: relative;
}

.tag-selected {
  background-color: var(--md-sys-color-primary-container) !important;
  color: var(--md-sys-color-on-primary-container) !important;
}

.tag-marked-for-removal {
  opacity: 0.5;
  text-decoration: line-through;
  background-color: var(--md-sys-color-error-container) !important;
  color: var(--md-sys-color-on-error-container) !important;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.folder-field {
  position: relative;
}

.tag-suggestions {
  position: fixed;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: var(--md-sys-elevation-level2);
  z-index: 1001;
  max-height: 200px;
  overflow-y: auto;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
  opacity: 0;
  transform: translateY(-8px);
}

.tag-suggestions:not(.fade-out) {
  opacity: 1;
  transform: translateY(0);
}

.tag-suggestions.fade-out {
  opacity: 0;
  transform: translateY(-8px);
}

.folder-suggestions {
  position: fixed;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: var(--md-sys-elevation-level2);
  z-index: 1001;
  max-height: 200px;
  overflow-y: auto;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
  opacity: 0;
  transform: translateY(-8px);
}

.folder-suggestions:not(.fade-out) {
  opacity: 1;
  transform: translateY(0);
}

.folder-suggestions.fade-out {
  opacity: 0;
  transform: translateY(-8px);
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-item:hover {
  background: var(--md-sys-color-surface-container-highest);
}

.suggestion-item:not(:last-child) {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>