<template>
  <Transition name="dialog-fade">
    <div v-if="show" class="dialog-overlay" @click="handleClose">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">Tag 过滤策略管理</h2>
            <md-icon-button @click="handleClose" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <div class="add-section">
              <md-outlined-text-field
                v-model="newTagName"
                label="添加 Tag"
                dense
                class="tag-input"
                @keydown.enter="handleAddTag"
              >
                <span slot="leading-icon" class="material-symbols-outlined">sell</span>
              </md-outlined-text-field>
              <md-filled-button @click="handleAddTag" class="upload-button">
                <md-icon slot="icon">add</md-icon>
                <span>添加</span>
              </md-filled-button>
            </div>

            <div class="existing-tags-section" v-if="availableTags.length > 0">
              <h4>从现有 Tag 中选择：</h4>
              <div class="tags-chips">
                <md-filter-chip
                  v-for="tag in availableTags"
                  :key="tag.name"
                  :label="`${tag.name} (${tag.count})`"
                  @click="handleSelectExistingTag(tag.name)"
                />
              </div>
            </div>

            <div class="filter-list" v-if="tagFilters.length > 0">
              <h4>已设置的过滤策略：</h4>
              <div class="filter-item" v-for="filter in tagFilters" :key="filter.tag">
                <md-assist-chip :label="filter.tag" />
                <div class="filter-actions">
                  <md-icon-button 
                    @click="toggleStrategy(filter.tag)"
                    :title="filter.strategy === 'blur' ? '当前：模糊遮罩，点击切换为完全隐藏' : '当前：完全隐藏，点击切换为模糊遮罩'"
                  >
                    <span class="material-symbols-outlined" :class="filter.strategy === 'blur' ? 'blur-icon' : 'hide-icon'">
                      {{ filter.strategy === 'blur' ? 'visibility_off' : 'block' }}
                    </span>
                  </md-icon-button>
                  <md-icon-button @click="removeFilter(filter.tag)" title="删除">
                    <span class="material-symbols-outlined">delete</span>
                  </md-icon-button>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p class="md-typescale-body-medium">尚未设置任何过滤策略</p>
            </div>
          </div>

          <div class="dialog-actions">
            <md-text-button @click="handleClose" style="padding-left: 15px; padding-right: 15px;">关闭</md-text-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update'])

const photoStore = usePhotoStore()
const notificationStore = useNotificationStore()

const newTagName = ref('')
const tagFilters = ref([])

// 从 localStorage 加载过滤策略
const loadFilters = () => {
  const saved = localStorage.getItem('tagFilterStrategies')
  if (saved) {
    try {
      tagFilters.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse tag filters:', e)
      tagFilters.value = []
    }
  }
}

// 保存过滤策略到 localStorage
const saveFilters = () => {
  localStorage.setItem('tagFilterStrategies', JSON.stringify(tagFilters.value))
  emit('update', tagFilters.value)
}

// 获取可用的 Tag（未设置过滤策略的）
const availableTags = computed(() => {
  const filterSet = new Set(tagFilters.value.map(f => f.tag))
  return photoStore.computedTags.filter(tag => !filterSet.has(tag.name))
})

// 添加新 Tag
const handleAddTag = () => {
  const tagName = newTagName.value.trim()
  if (!tagName) {
    notificationStore.showWarning('请输入 Tag 名称')
    return
  }

  if (tagFilters.value.some(f => f.tag === tagName)) {
    notificationStore.showWarning('该 Tag 已存在过滤策略')
    return
  }

  tagFilters.value.push({
    tag: tagName,
    strategy: 'blur' // 默认使用模糊遮罩
  })
  newTagName.value = ''
  saveFilters()
  notificationStore.showSuccess(`已添加 ${tagName} 的过滤策略`)
}

// 从现有 Tag 中选择
const handleSelectExistingTag = (tagName) => {
  tagFilters.value.push({
    tag: tagName,
    strategy: 'blur'
  })
  saveFilters()
  notificationStore.showSuccess(`已添加 ${tagName} 的过滤策略`)
}

// 更新策略（切换）
const toggleStrategy = (tag) => {
  const filter = tagFilters.value.find(f => f.tag === tag)
  if (filter) {
    filter.strategy = filter.strategy === 'blur' ? 'hide' : 'blur'
    saveFilters()
    notificationStore.showSuccess(`已切换 ${tag} 为${filter.strategy === 'blur' ? '模糊遮罩' : '完全隐藏'}`)
  }
}

// 删除过滤策略
const removeFilter = (tag) => {
  tagFilters.value = tagFilters.value.filter(f => f.tag !== tag)
  saveFilters()
  notificationStore.showSuccess(`已移除 ${tag} 的过滤策略`)
}

const handleClose = () => {
  emit('close')
}

// 监听对话框打开，加载数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadFilters()
  }
})
</script>

<style scoped>
/* 对话框遮罩层 */
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

/* 对话框容器 */
.dialog-container {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--md-sys-elevation-level3);
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.dialog-header h2 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.close-btn {
  margin-right: -12px;
}

/* 对话框内容 */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.add-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tag-input {
  flex: 1;
}

.existing-tags-section {
  margin-bottom: 24px;
}

.existing-tags-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-list {
  margin-top: 24px;
}

.filter-list h4 {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  transition: background 0.2s;
}

.filter-item:hover {
  background: var(--md-sys-color-surface-variant);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.blur-icon {
  color: var(--md-sys-color-tertiary);
}

.hide-icon {
  color: var(--md-sys-color-error);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--md-sys-color-on-surface-variant);
}

/* 对话框底部操作栏 */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

/* 过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .dialog-container {
    max-width: 100%;
    max-height: 90vh;
    margin: 0;
    border-radius: 28px 28px 0 0;
  }

  .dialog-overlay {
    align-items: flex-end;
    padding: 0;
  }
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  white-space: nowrap;
}
</style>
