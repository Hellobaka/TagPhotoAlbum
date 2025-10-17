<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-content">
        <md-circular-progress indeterminate></md-circular-progress>
        <p class="md-typescale-body-medium loading-text">{{ loadingText }}</p>
      </div>
    </div>

    <!-- 瀑布流图片展示 -->
    <div v-if="!isLoading" class="masonry-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="masonry-item"
        @click="openPhotoDetail(photo)"
      >
        <img :src="photo.url" :alt="photo.title" />
        <div class="photo-overlay">
          <div class="photo-info">
            <h4 class="md-typescale-body-medium">{{ photo.title }}</h4>
            <div class="tags">
              <md-assist-chip
                v-for="tag in photo.tags.slice(0, 2)"
                :key="tag"
                :label="tag"
                size="small"
                :class="getTagColorClass(tag)"
              />
              <md-assist-chip
                v-if="photo.tags.length > 2"
                :label="'+' + (photo.tags.length - 2)"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && photos.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon">photo</span>
      <h3 class="md-typescale-headline-small">没有找到照片</h3>
      <p class="md-typescale-body-medium">尝试调整筛选条件或搜索关键词</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  photos: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  loadingType: {
    type: String,
    default: 'photos'
  }
})

const emit = defineEmits(['open-photo-detail'])

// 计算加载文本
const loadingText = computed(() => {
  const texts = {
    photos: '正在加载照片...',
    search: '正在搜索...',
    recommend: '正在加载推荐...',
    tags: '正在加载标签...',
    folders: '正在加载文件夹...',
    locations: '正在加载地点...'
  }
  return texts[props.loadingType] || '正在加载...'
})

// 方法
const openPhotoDetail = (photo) => {
  emit('open-photo-detail', photo)
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
/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 80px 24px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

/* 瀑布流样式 */
.masonry-grid {
  padding: 24px;
  column-count: 4;
  column-gap: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--md-sys-elevation-level1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.masonry-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--md-sys-elevation-level3);
}

.masonry-item img {
  width: 100%;
  height: auto;
  display: block;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.masonry-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info h4 {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>