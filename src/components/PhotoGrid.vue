<template>
  <div>
    <!-- 隐藏图片提示 -->
    <transition name="notice-fade">
      <div
        v-if="hiddenPhotosCount > 0 && showHiddenNotice"
        class="hidden-photos-notice"
      >
        <md-icon>visibility_off</md-icon>
        <span>有 {{ hiddenPhotosCount }} 张图片因 Tag 过滤策略而被隐藏</span>
        <md-icon-button @click="closeHiddenNotice" class="close-button">
          <md-icon>close</md-icon>
        </md-icon-button>
      </div>
    </transition>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-content">
        <md-circular-progress indeterminate></md-circular-progress>
        <p class="md-typescale-body-medium loading-text">{{ loadingText }}</p>
      </div>
    </div>

    <!-- 瀑布流布局 -->
    <div
      v-if="!isLoading && props.layout === 'masonry'"
      class="masonry-container"
      ref="gridContainer"
    >
      <MasonryWall
        :items="visiblePhotos"
        :ssr-columns="4"
        :column-width="300"
        :gap="16"
        :min-columns="1"
        :max-columns="6"
        :rtl="false"
        :scroll-container="scrollContainer"
        v-slot="{ item: photo }"
      >
        <div
          class="masonry-item"
          :class="{
            'photo-blurred':
              shouldBlurPhoto(photo) && !unblurredPhotoIds.has(photo.id),
          }"
          @click="
            shouldBlurPhoto(photo) && !unblurredPhotoIds.has(photo.id)
              ? null
              : openPhotoDetail(photo)
          "
        >
          <div class="image-wrapper">
            <img
              v-if="imageStatus[photo.id] !== 'error'"
              :src="getImageUrl(photo)"
              :alt="photo.title"
              loading="lazy"
              @load="handleImageLoad(photo.id)"
              @error="handleImageError(photo.id)"
              :class="{ 'image-loading': imageStatus[photo.id] === 'loading' }"
              style="display: block; width: 100%; height: auto"
            />
            <!-- 加载中动画 -->
            <div
              v-if="imageStatus[photo.id] === 'loading'"
              class="img-loading-indicator"
            >
              <md-circular-progress indeterminate size="small" />
            </div>
            <!-- 加载失败占位 -->
            <div
              v-if="imageStatus[photo.id] === 'error'"
              class="img-error-indicator"
            >
              <md-icon>broken_image</md-icon>
            </div>
            <!-- 模糊遮罩层 -->
            <transition name="blur-fade">
              <div
                v-if="
                  shouldBlurPhoto(photo) && !unblurredPhotoIds.has(photo.id)
                "
                class="blur-mask"
                @click.stop="removeBlur(photo.id)"
              >
                <div class="blur-mask-content">
                  <md-icon class="blur-icon">visibility_off</md-icon>
                  <span class="blur-text">点击查看</span>
                </div>
              </div>
            </transition>
          </div>
          <div class="photo-overlay">
            <div class="photo-info">
              <h4 class="md-typescale-body-medium">{{ photo.title }}</h4>
              <!-- 评分显示 -->
              <div v-if="photo.rating > 0" class="photo-rating">
                <div class="rating-stars">
                  <div v-for="star in 5" :key="star" class="star-container">
                    <span
                      class="material-symbols-outlined star-icon"
                      :class="{
                        filled: star <= Math.floor(photo.rating),
                        half:
                          star === Math.ceil(photo.rating) &&
                          photo.rating % 1 !== 0,
                      }"
                    >
                      {{ getStarIcon(star, photo.rating) }}
                    </span>
                  </div>
                </div>
                <span class="rating-text">{{ photo.rating.toFixed(1) }}</span>
              </div>
              <div class="photo-meta">
                <span class="meta-item">{{ formatDate(photo.date) }}</span>
                <span class="meta-item">{{
                  formatFileSize(photo.fileSizeKB)
                }}</span>
              </div>
              <div class="tags">
                <md-assist-chip
                  v-for="tag in photo.tags.slice(0, 4)"
                  :key="tag"
                  :label="tag"
                  size="small"
                  :class="getTagChipClass(tag)"
                  @click="handleTagClick(tag, $event)"
                />
                <md-assist-chip
                  v-if="photo.tags.length > 4"
                  :label="'+' + (photo.tags.length - 4)"
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </MasonryWall>
      <!-- 哨兵元素 - 放在 MasonryWall 外部，确保能被正确检测 -->
      <div
        v-if="visiblePhotos.length > 0"
        ref="masonrySentinel"
        class="load-more-sentinel"
      ></div>
    </div>

    <!-- 方形网格布局 -->
    <div
      v-if="!isLoading && props.layout === 'grid'"
      class="grid-container"
      ref="gridContainer"
    >
      <div class="grid-items">
        <div
          v-for="(photo, index) in visiblePhotos"
          :key="photo.id"
          class="grid-item"
          :class="{
            'photo-blurred':
              shouldBlurPhoto(photo) && !unblurredPhotoIds.has(photo.id),
          }"
          @click="
            shouldBlurPhoto(photo) && !unblurredPhotoIds.has(photo.id)
              ? null
              : openPhotoDetail(photo)
          "
        >
          <div class="image-wrapper">
            <img
              v-if="imageStatus[photo.id] !== 'error'"
              :src="getImageUrl(photo)"
              :alt="photo.title"
              loading="lazy"
              @load="handleImageLoad(photo.id)"
              @error="handleImageError(photo.id)"
              :class="{ 'image-loading': imageStatus[photo.id] === 'loading' }"
            />
            <!-- 加载中动画 -->
            <div
              v-if="imageStatus[photo.id] === 'loading'"
              class="img-loading-indicator"
            >
              <md-circular-progress indeterminate size="small" />
            </div>
            <!-- 加载失败占位 -->
            <div
              v-if="imageStatus[photo.id] === 'error'"
              class="img-error-indicator"
            >
              <md-icon>broken_image</md-icon>
            </div>
            <!-- 模糊遮罩层 -->
            <transition name="blur-fade">
              <div
                v-if="
                  shouldBlurPhoto(photo) && !unblurredPhotoIds.has(photo.id)
                "
                class="blur-mask"
                @click.stop="removeBlur(photo.id)"
              >
                <div class="blur-mask-content">
                  <md-icon class="blur-icon">visibility_off</md-icon>
                  <span class="blur-text">点击查看</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
      <!-- 哨兵元素 - 放在网格容器外部，确保能被正确检测 -->
      <div
        v-if="photos.length > 0"
        ref="sentinel"
        class="load-more-sentinel"
      ></div>
    </div>

    <!-- 加载更多状态 -->
    <div v-if="isLoadMore" class="load-more-state">
      <div class="load-more-content">
        <div class="loading-animation">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <p class="md-typescale-body-medium load-more-text">
          正在加载更多照片...
        </p>
      </div>
    </div>

    <!-- 没有更多数据提示 -->
    <div v-if="!hasMore && photos.length > 0" class="no-more-state">
      <div class="no-more-content">
        <md-icon class="no-more-icon">check_circle</md-icon>
        <p class="md-typescale-body-medium no-more-text">
          已经到底了，没有更多照片了
        </p>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!isLoading && visiblePhotos.length === 0 && hiddenPhotosCount === 0"
      class="empty-state"
    >
      <span class="material-symbols-outlined empty-icon">photo</span>
      <h3 class="md-typescale-headline-small">没有找到照片</h3>
      <p class="md-typescale-body-medium">尝试调整筛选条件或搜索关键词</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import MasonryWall from "@yeger/vue-masonry-wall";
import API_CONFIG from "@/config/api";
import { usePhotoStore } from "@/stores/photoStore";

const props = defineProps({
  photos: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  loadingType: {
    type: String,
    default: "photos",
  },
  isLoadMore: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: true,
  },
  layout: {
    type: String,
    default: "masonry",
  },
});

const emit = defineEmits([
  "open-photo-detail",
  "load-more",
  "tag-click",
  "ready",
]);

const gridContainer = ref(null);
let observer = null;
const sentinel = ref(null);
const masonrySentinel = ref(null); // 瀑布流布局的哨兵元素

// 使用 Pinia store
const photoStore = usePhotoStore();

// 获取滚动容器，优先使用父级容器，否则使用window
const scrollContainer = ref(null);

// 图片加载状态管理
const imageStatus = ref({}); // { [photo.id]: 'loading' | 'loaded' | 'error' }

// Tag 过滤策略
const tagFilterStrategies = ref([]);
const unblurredPhotoIds = ref(new Set()); // 已取消模糊的图片ID
const showHiddenNotice = ref(true); // 控制隐藏提示的显示

// 加载 Tag 过滤策略
const loadTagFilterStrategies = () => {
  const saved = localStorage.getItem("tagFilterStrategies");
  if (saved) {
    try {
      tagFilterStrategies.value = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse tag filter strategies:", e);
      tagFilterStrategies.value = [];
    }
  }
};

// 判断图片是否应该被隐藏
const shouldHidePhoto = (photo) => {
  if (!photo.tags || !Array.isArray(photo.tags)) return false;
  return photo.tags.some((tag) => {
    const filter = tagFilterStrategies.value.find((f) => f.tag === tag);
    return filter && filter.strategy === "hide";
  });
};

// 判断图片是否应该被模糊
const shouldBlurPhoto = (photo) => {
  if (!photo.tags || !Array.isArray(photo.tags)) return false;
  return photo.tags.some((tag) => {
    const filter = tagFilterStrategies.value.find((f) => f.tag === tag);
    return filter && filter.strategy === "blur";
  });
};

// 可见的图片列表（过滤掉被隐藏的）
const visiblePhotos = computed(() => {
  return props.photos.filter((photo) => !shouldHidePhoto(photo));
});

// 被隐藏的图片数量
const hiddenPhotosCount = computed(() => {
  return props.photos.length - visiblePhotos.value.length;
});

// 移除模糊效果
const removeBlur = (photoId) => {
  const hasBlur = unblurredPhotoIds.value.has(photoId);
  unblurredPhotoIds.value.add(photoId);
  return !hasBlur;
};

// 获取 Tag Chip 的 CSS 类
const getTagChipClass = (tagName) => {
  const filter = tagFilterStrategies.value.find((f) => f.tag === tagName);
  if (!filter) return "";
  return "tag-filter";
};

// 监听 photos，初始化每张图片的加载状态
watch(
  () => props.photos,
  async (newPhotos) => {
    const newIds = newPhotos.map((p) => p.id);
    // 添加新的
    newPhotos.forEach((photo) => {
      if (!(photo.id in imageStatus.value)) {
        imageStatus.value[photo.id] = "loading";
      }
    });
    // 移除不存在的
    Object.keys(imageStatus.value).forEach((id) => {
      if (!newIds.includes(id)) {
        delete imageStatus.value[id];
      }
    });

    // 等待 DOM 更新后重新设置 Observer
    await nextTick();
    setupIntersectionObserver();
  },
  { immediate: true }
);

const handleImageLoad = (photoId) => {
  imageStatus.value[photoId] = "loaded";
};
const handleImageError = (photoId) => {
  imageStatus.value[photoId] = "error";
};

// 设置 Intersection Observer 监听滚动到底部
const setupIntersectionObserver = () => {
  // 根据布局类型选择正确的哨兵元素
  const currentSentinel = props.layout === 'masonry' ? masonrySentinel.value : sentinel.value;

  if (!currentSentinel) {
    console.log("❌ No sentinel element found for layout:", props.layout);
    return;
  }
  if (observer) observer.disconnect();

  // 使用检测到的滚动容器作为根元素
  const root = scrollContainer.value || null;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !props.isLoadMore && props.hasMore) {
          console.log("🚀 Triggering load-more event");
          emit("load-more");
        }
      });
    },
    {
      root: root,
      rootMargin: "300px", // 提前触发
      threshold: 0.01,
    }
  );

  // 观察当前布局的哨兵元素
  observer.observe(currentSentinel);
};
onMounted(async () => {
  await photoStore.initTagsData();

  // 加载过滤策略
  loadTagFilterStrategies();
  // 监听 localStorage 变化，及时更新策略
  window.addEventListener("storage", (e) => {
    if (e.key === "tagFilterStrategies") {
      loadTagFilterStrategies();
    }
  });

  // 延迟设置Intersection Observer，确保MasonryWall已经渲染完成
  setTimeout(() => {
    // 设置滚动容器为最近的滚动父元素
    if (gridContainer.value) {
      let parent = gridContainer.value.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          scrollContainer.value = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    setupIntersectionObserver();
    emit("ready");
  }, 100);
});

watch(
  () => props.layout,
  async () => {
    await nextTick();
    reconfigureObserver();
  }
);

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

// 公开方法：重新配置Intersection Observer
const reconfigureObserver = () => {
  console.log("🔄 Reconfiguring Intersection Observer");
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  setupIntersectionObserver();
};

// 公开方法：刷新过滤策略
const refreshFilters = () => {
  console.log("🔄 Refreshing tag filter strategies");
  loadTagFilterStrategies();
  // 重置已取消模糊的图片列表
  unblurredPhotoIds.value.clear();
  // 显示隐藏提示（如果有隐藏的图片）
  if (hiddenPhotosCount.value > 0) {
    showHiddenNotice.value = true;
  }
};

// 组件就绪时通知父组件
defineExpose({
  reconfigureObserver,
  refreshFilters,
});

// 计算加载文本
const loadingText = computed(() => {
  const texts = {
    photos: "正在加载照片...",
    search: "正在搜索...",
    recommend: "正在加载推荐...",
    tags: "正在加载标签...",
    folders: "正在加载文件夹...",
    locations: "正在加载地点...",
  };
  return texts[props.loadingType] || "正在加载...";
});

// 方法
const openPhotoDetail = (photo) => {
  emit("open-photo-detail", photo);
};

const handleTagClick = (tag, event) => {
  event.stopPropagation();
  emit("tag-click", tag);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
};

// 获取星星图标
const getStarIcon = (star, rating) => {
  if (rating === null || rating === undefined || rating === 0)
    return "star_outline";

  if (star <= Math.floor(rating)) {
    return "star";
  } else if (star === Math.ceil(rating) && rating % 1 !== 0) {
    return "star_half";
  } else {
    return "star_outline";
  }
};

// 格式化文件大小
const formatFileSize = (fileSizeKB) => {
  if (!fileSizeKB) return "";
  if (fileSizeKB < 1024) {
    return `${fileSizeKB} KB`;
  } else {
    const fileSizeMB = (fileSizeKB / 1024).toFixed(1);
    return `${fileSizeMB} MB`;
  }
};

const getImageUrl = (photo) => {
  if (!photo) return "";
  let url = photo.compressedFilePath || photo.filePath;
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  if (url.startsWith(API_CONFIG.UPLOAD_PATH)) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }
  return url;
};

// 关闭隐藏提示
const closeHiddenNotice = () => {
  showHiddenNotice.value = false;
};

// 监听隐藏图片数量变化，自动显示提示
watch(hiddenPhotosCount, (newCount) => {
  if (newCount > 0) {
    showHiddenNotice.value = true;
  }
});
</script>

<style scoped>
/* 隐藏图片提示 */
.hidden-photos-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  margin: 16px 24px 0;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-radius: 8px;
  font-size: 0.875rem;
  position: relative;
}

.hidden-photos-notice md-icon {
  font-size: 20px;
}

.hidden-photos-notice .close-button {
  margin-left: auto;
  --md-icon-button-icon-size: 20px;
}

/* 隐藏提示过渡动画 */
.notice-fade-enter-active,
.notice-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease,
    margin 0.3s ease;
}

.notice-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.notice-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

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

/* masonry布局样式 */
.masonry-container {
  padding: 24px;
}

.masonry-item {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--md-sys-elevation-level1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  margin-bottom: 16px;
}

.masonry-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--md-sys-elevation-level3);
}

/* 模糊图片样式 */
.photo-blurred .image-wrapper img {
  filter: blur(20px);
}

/* 模糊遮罩层 */
.blur-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8;
  cursor: pointer;
  transition: background 0.2s;
}

/* 模糊遮罩淡出过渡动画 */
.blur-fade-enter-active,
.blur-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.blur-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.blur-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.blur-mask:hover {
  background: rgba(0, 0, 0, 0.7);
}

.blur-mask-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: white;
  text-align: center;
  padding: 20px;
}

.blur-mask-content .blur-icon {
  opacity: 0.9;
  transition: all 0.3s ease;
}

.blur-mask-content .blur-text {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  transform: translateY(-10px);
}

/* hover 时显示文字 */
.blur-mask:hover .blur-icon {
  margin-bottom: 4px;
}

.blur-mask:hover .blur-text {
  opacity: 1;
  max-height: 50px;
  transform: translateY(0);
}

.blur-text {
  font-size: 1rem;
  font-weight: 500;
}

.tag-filter {
  background-color: var(--md-sys-color-error-container);
  font-weight: 500;
}

/* 方形网格布局样式 */
.grid-container {
  padding: 16px;
}

.grid-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.grid-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--md-sys-elevation-level1);
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
  aspect-ratio: 1 / 1; /* 保持方形 */
  /* 启用GPU加速 */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

.grid-item:hover {
  transform: scale(1.02) translateZ(0);
  box-shadow: var(--md-sys-elevation-level2);
}

.grid-item .image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 裁剪显示中心部分 */
  display: block;
  /* 优化图片渲染性能 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* 图片加载中和失败效果 */
.image-wrapper {
  position: relative;
  width: 100%;
  min-height: 120px;
  background: var(--md-sys-color-surface-container-low, #1d1b20);
  display: flex;
  justify-content: center;
  align-items: center;
}

.img-loading-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  padding: 12px;
}

.img-error-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.img-error-icon {
  font-size: 36px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.img-error-text {
  font-size: 14px;
  opacity: 0.7;
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
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.2s 0.3s;
  z-index: 9;
}

.masonry-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info h4 {
  margin: 0 0 4px 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 评分显示样式 */
.photo-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star-container {
  padding: 2px;
}

.star-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s;
}

.star-icon.filled {
  color: var(--md-sys-color-primary);
  font-variation-settings: "FILL" 1, "wght" 700, "GRAD" 0, "opsz" 48;
}

.star-icon.half {
  color: var(--md-sys-color-primary);
}

.rating-text {
  font-size: 12px;
  opacity: 0.8;
}

.photo-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 12px;
  opacity: 0.8;
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
  padding: 60px 24px;
  animation: fadeInUp 0.5s ease-out;
}

.load-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 加载动画 */
.loading-animation {
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--md-sys-color-primary);
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.load-more-text {
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
  font-weight: 500;
  animation: pulse 2s infinite;
}

/* 没有更多数据提示 */
.no-more-state {
  text-align: center;
  padding: 60px 24px;
  color: var(--md-sys-color-on-surface-variant);
  animation: fadeInUp 0.5s ease-out;
}

.no-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.no-more-icon {
  font-size: 48px;
  color: var(--md-sys-color-primary);
  animation: checkmark 0.6s ease-out;
}

.no-more-text {
  opacity: 0.8;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
}

/* 动画关键帧 */
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 哨兵元素 - 用于检测滚动 */
.load-more-sentinel {
  height: 1px;
  width: 100%;
  /* 确保哨兵元素能被正确检测 */
  margin-top: 20px;
  background: transparent;
  /* 确保哨兵元素不被网格布局影响 */
  display: block !important;
  position: relative !important;
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

/* 响应式设计 - 方形网格布局 */
@media (max-width: 1200px) {
  .grid-items {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .grid-items {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .grid-container {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .grid-items {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }
}
</style>
