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
    <div v-if="!isLoading" class="masonry-grid" ref="gridContainer">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="masonry-item"
        @click="openPhotoDetail(photo)"
      >
        <img :src="getImageUrl(photo.filePath)" :alt="photo.title" />
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

    <!-- 加载更多状态 -->
    <div v-if="isLoadMore" class="load-more-state">
      <div class="load-more-content">
        <md-circular-progress indeterminate></md-circular-progress>
        <p class="md-typescale-body-medium load-more-text">正在加载更多照片...</p>
      </div>
    </div>

    <!-- 没有更多数据提示 -->
    <div v-if="!hasMore && photos.length > 0" class="no-more-state">
      <p class="md-typescale-body-medium no-more-text">没有更多照片了</p>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import API_CONFIG from '@/config/api'

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
  },
  isLoadMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['open-photo-detail', 'load-more'])

const gridContainer = ref(null)
let observer = null

// 设置 Intersection Observer 监听滚动到底部
const setupIntersectionObserver = () => {
  if (!gridContainer.value) return

  // 创建 Intersection Observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !props.isLoadMore && props.hasMore) {
          emit('load-more')
        }
      })
    },
    {
      root: null,
      rootMargin: '100px', // 提前100px触发加载
      threshold: 0.1
    }
  )

  // 创建一个哨兵元素来检测是否滚动到底部
  const sentinel = document.createElement('div')
  sentinel.className = 'load-more-sentinel'
  gridContainer.value.appendChild(sentinel)
  observer.observe(sentinel)
}

onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

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

const getImageUrl = (url) => {
  if (!url) return ''

  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }

  // 如果是相对路径，拼接后端 API 地址
  if (url.startsWith(API_CONFIG.UPLOAD_PATH)) {
    return `${API_CONFIG.BASE_URL}${url}`
  }

  // 其他情况直接返回
  return url
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

/* 加载更多状态 */
.load-more-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 24px;
}

.load-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.load-more-text {
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

/* 没有更多数据提示 */
.no-more-state {
  text-align: center;
  padding: 40px 24px;
  color: var(--md-sys-color-on-surface-variant);
}

.no-more-text {
  opacity: 0.7;
}

/* 哨兵元素 - 用于检测滚动 */
.load-more-sentinel {
  height: 1px;
  width: 100%;
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