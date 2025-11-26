<template>
  <div class="photo-editor-container">
    <!-- 左侧：图片展示区域 -->
    <div class="left-panel">
      <div
        class="photo-container"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <img
          class="photo"
          :src="currentImageUrl"
          :alt="photo.title || '图片'"
        />
        <div
          class="original-image-button"
          :class="{
            show:
              showOriginalButton &&
              photo?.compressedFilePath &&
              !isShowingOriginal,
          }"
        >
          <md-filled-tonal-button
            @click="toggleOriginalImage"
            style="padding-left: 15px; padding-right: 15px"
          >
            <md-icon slot="icon">open_in_full</md-icon>
            显示原图
          </md-filled-tonal-button>
        </div>

        <!-- 复制和下载按钮 -->
        <div class="action-buttons" :class="{ show: showActionButtons }">
          <md-filled-tonal-button @click="downloadImage" class="action-button">
            <md-icon slot="icon">download</md-icon>
            下载
          </md-filled-tonal-button>
        </div>
      </div>
    </div>

    <!-- 右侧：详情和编辑区域（竖排） -->
    <div class="right-panel">
      <!-- 图片详情卡片（可折叠） -->
      <div class="collapsible-section details-section" v-if="photo">
        <div class="section-header" @click="toggleDetailsVisibility">
          <h3 class="md-typescale-title-medium">
            <span
              class="material-symbols-outlined collapse-icon"
              :class="{ expanded: isDetailsVisible }"
              >expand_more</span
            >
            图片详情
          </h3>
        </div>

        <div class="section-content" v-show="isDetailsVisible">
          <!-- 文件信息 -->
          <div class="detail-item">
            <div class="detail-label">
              <span class="material-symbols-outlined">description</span>
              <span>文件名</span>
            </div>
            <div class="detail-value">{{ getFileName(photo.filePath) }}</div>
          </div>

          <!-- 日期信息 -->
          <div class="detail-item">
            <div class="detail-label">
              <span class="material-symbols-outlined">calendar_today</span>
              <span>上传时间</span>
            </div>
            <div class="detail-value">{{ formatDate(photo.date) }}</div>
          </div>

          <!-- 文件大小 -->
          <div class="detail-item" v-if="photo.fileSizeKB">
            <div class="detail-label">
              <span class="material-symbols-outlined">storage</span>
              <span>文件大小</span>
            </div>
            <div class="detail-value">
              {{ formatFileSize(photo.fileSizeKB) }}
            </div>
          </div>

          <!-- EXIF 信息 -->
          <div class="exif-section" v-if="filteredExifData.length > 0">
            <div class="exif-header">
              <h4 class="md-typescale-body-medium">EXIF 信息</h4>
              <md-switch
                class="dense"
                :selected="showExifDetails"
                @change="showExifDetails = !showExifDetails"
              />
            </div>
            <div
              v-if="showExifDetails"
              style="display: flex; align-items: center"
            >
              <md-switch
                class="dense"
                :selected="hideUncommonExif"
                @change="hideUncommonExif = !hideUncommonExif"
              />
              <h4 class="md-typescale-body-medium" style="margin-left: 10px">
                隐藏非常用 Exif 值
              </h4>
            </div>
            <div
              v-if="showExifDetails && !hideUncommonExif"
              style="display: flex; align-items: center; margin-bottom: 8px"
            >
              <md-switch
                class="dense"
                :selected="hideUndenfiedExif"
                @change="hideUndenfiedExif = !hideUndenfiedExif"
              />
              <h4 class="md-typescale-body-medium" style="margin-left: 10px">
                隐藏未定义值
              </h4>
            </div>
            <div
              v-show="showExifDetails"
              v-for="exifItem in filteredExifData"
              :key="exifItem.key"
              class="detail-item"
            >
              <div class="detail-label">
                <span class="material-symbols-outlined">{{
                  getExifIcon(exifItem.key)
                }}</span>
                <span>{{ getExifLabel(exifItem.key) }}</span>
              </div>
              <div class="detail-value">{{ exifItem.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑信息区域（可折叠） -->
      <div class="collapsible-section info-section">
        <div class="section-header" @click="toggleInfoVisibility">
          <h3 class="md-typescale-title-medium">
            <span
              class="material-symbols-outlined collapse-icon"
              :class="{ expanded: isInfoVisible }"
              >expand_more</span
            >
            编辑信息
          </h3>
        </div>

        <div class="section-content" v-show="isInfoVisible">
          <md-outlined-text-field
            :value="editablePhoto.title"
            @input="(e) => $emit('update:title', e.target.value)"
            label="标题"
            class="info-field"
          />

          <md-outlined-text-field
            :value="editablePhoto.description"
            @input="(e) => $emit('update:description', e.target.value)"
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
                  v-for="tag in popularTags.slice(0, 20)"
                  :key="tag"
                  :label="`${tag.name} (${tag.count})`"
                  @click="$emit('toggle-tag', tag.name)"
                  :class="[
                    { 'tag-selected': editablePhoto.tags?.includes(tag.name) },
                  ]"
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
                  :class="[
                    {
                      'tag-marked-for-removal': tagsToRemove.includes(tag),
                      'tag-selected': !tagsToRemove.includes(tag),
                    },
                  ]"
                />
              </div>
            </div>

            <!-- 添加新标签 -->
            <div class="add-tag-section">
              <div class="add-tag">
                <md-outlined-text-field
                  :value="newTag"
                  @input="handleTagInput"
                  @focus="handleTagFocus"
                  @blur="handleTagBlur"
                  label="添加标签"
                  @keydown="handleTagKeydown"
                  ref="tagInput"
                  style="width: 100%"
                >
                  <md-icon-button slot="trailing-icon" @click="addTag">
                    <span class="material-symbols-outlined">add</span>
                  </md-icon-button>
                </md-outlined-text-field>
                <div
                  v-if="showTagSuggestions && filteredTags.length > 0"
                  class="tag-suggestions"
                  :class="{ 'fade-out': isTagSuggestionsClosing }"
                  :style="getTagSuggestionsStyle()"
                >
                  <div
                    v-for="(tag, index) in filteredTags"
                    :key="tag"
                    :class="[
                      'suggestion-item',
                      { selected: index === selectedTagIndex },
                    ]"
                    @click="selectTagSuggestion(tag)"
                  >
                    {{ tag }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 评分控件 -->
          <div class="rating-section">
            <h3 class="md-typescale-title-medium">评分</h3>
            <div class="rating-controls">
              <div class="rating-stars">
                <div
                  v-for="star in 5"
                  :key="star"
                  class="star-container"
                  @click="setRating(star)"
                  @mouseenter="hoverRating = star"
                  @mouseleave="hoverRating = null"
                >
                  <span
                    class="material-symbols-outlined star-icon"
                    :class="{
                      filled: getStarFilled(star),
                      half: getStarHalf(star),
                    }"
                  >
                    {{ getStarIcon(star) }}
                  </span>
                </div>
              </div>
              <div
                class="rating-value"
                v-if="
                  editablePhoto.rating !== null &&
                  editablePhoto.rating !== undefined
                "
              >
                {{ formatRating(editablePhoto.rating) }}
              </div>
              <md-text-button
                @click="clearRating"
                v-if="
                  editablePhoto.rating !== null &&
                  editablePhoto.rating !== undefined
                "
                style="padding-left: 10px; padding-right: 10px"
              >
                清除评分
              </md-text-button>
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
              <div
                v-if="showFolderSuggestions && filteredFolders.length > 0"
                class="folder-suggestions"
                :class="{ 'fade-out': isFolderSuggestionsClosing }"
                :style="getFolderSuggestionsStyle()"
              >
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
              @input="(e) => $emit('update:location', e.target.value)"
              label="地点"
              class="info-field"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { usePhotoStore } from "@/stores/photoStore";
import { useNotificationStore } from "@/stores/notificationStore";
import API_CONFIG from "@/config/api";
import { isPinyinMatch } from "@/utils/pinyin";

const props = defineProps({
  photo: {
    type: Object,
    default: null,
  },
  editablePhoto: {
    type: Object,
    required: true,
  },
  newTag: {
    type: String,
    default: "",
  },
  tagsToRemove: {
    type: Array,
    default: () => [],
  },
  popularTags: {
    type: Array,
    default: () => [],
  },
  allFolders: {
    type: Array,
    default: () => [],
  },
  showNoPhoto: {
    type: Boolean,
    default: false,
  },
  noPhotoText: {
    type: String,
    default: "没有更多图片",
  },
});

const emit = defineEmits([
  "update:title",
  "update:description",
  "update:location",
  "update:folder",
  "update:newTag",
  "update:rating",
  "toggle-tag",
  "toggle-tag-for-removal",
  "add-tag",
]);

// 响应式数据
const showFolderSuggestions = ref(false);
const folderInput = ref(null);
const showTagSuggestions = ref(false);
const tagInput = ref(null);
const isTagSuggestionsClosing = ref(false);
const isFolderSuggestionsClosing = ref(false);
const showOriginalButton = ref(false);
const showActionButtons = ref(false);
const isShowingOriginal = ref(false);
const currentImageUrl = ref("");
// 折叠展开状态
const isDetailsVisible = ref(true);
const isInfoVisible = ref(true);
const isCompactMode = ref(false);
const showExifDetails = ref(false);
const hideUncommonExif = ref(true);
const hideUndenfiedExif = ref(true);
// 评分相关
const hoverRating = ref(null);
// 标签建议导航
const selectedTagIndex = ref(-1);

// 使用 Pinia store
const photoStore = usePhotoStore();
const notificationStore = useNotificationStore();

// 图片相关方法
const getImageUrl = (photo) => {
  if (!photo) return "";

  // 优先使用压缩图片路径
  let url = photo.compressedFilePath || photo.filePath;

  if (!url) return "";

  // 如果已经是完整 URL，直接返回
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // 如果是相对路径，拼接后端 API 地址
  if (url.startsWith(API_CONFIG.UPLOAD_PATH)) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }

  // 其他情况直接返回
  return url;
};

const getOriginalImageUrl = (photo) => {
  if (!photo) return "";

  let url = photo.filePath;

  if (!url) return "";

  // 如果已经是完整 URL，直接返回
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // 如果是相对路径，拼接后端 API 地址
  if (url.startsWith(API_CONFIG.UPLOAD_PATH)) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }

  // 其他情况直接返回
  return url;
};

const toggleOriginalImage = () => {
  if (!props.photo) return;

  if (isShowingOriginal.value) {
    // 切换回压缩图
    currentImageUrl.value = getImageUrl(props.photo);
    isShowingOriginal.value = false;
  } else {
    // 切换到原图
    currentImageUrl.value = getOriginalImageUrl(props.photo);
    isShowingOriginal.value = true;
  }
};

const handleMouseEnter = () => {
  showOriginalButton.value = true;
  showActionButtons.value = true;
};

const handleMouseLeave = () => {
  showOriginalButton.value = false;
  showActionButtons.value = false;
};

// 监听 photo 变化，更新图片 URL
watch(
  () => props.photo,
  (newPhoto) => {
    if (newPhoto) {
      isShowingOriginal.value = false;
      showOriginalButton.value = false;
      showActionButtons.value = false;
      currentImageUrl.value = getImageUrl(newPhoto);
    } else {
      isShowingOriginal.value = false;
      showOriginalButton.value = false;
      showActionButtons.value = false;
      currentImageUrl.value = "";
    }
  },
  { immediate: true }
);

// 计算属性 - 过滤文件夹建议（支持中文、拼音、首字母、模糊匹配）
const filteredFolders = computed(() => {
  if (!props.editablePhoto.folder) {
    return props.allFolders.slice(0, 5); // 显示前5个建议
  }

  return props.allFolders
    .filter((folder) => isPinyinMatch(folder, props.editablePhoto.folder))
    .slice(0, 5); // 最多显示5个建议
});

// 计算属性 - 过滤标签建议（支持中文、拼音、首字母、模糊匹配）
const filteredTags = computed(() => {
  if (!props.newTag) {
    return photoStore.computedTags.map((x) => x.name).slice(0, 5);
  }

  return photoStore.computedTags
    .filter((tag) => isPinyinMatch(tag.name, props.newTag))
    .map((x) => x.name);
});

// 方法
const addTag = () => {
  const trimmedTag = props.newTag.trim();
  if (!trimmedTag) return;

  // 无论标签是否存在，都触发 add-tag 事件
  // 让父组件决定如何处理（添加新标签或取消删除标记）
  emit("add-tag", trimmedTag);
};

const handleTagInput = (e) => {
  emit("update:newTag", e.target.value);
  showTagSuggestions.value = true;
  selectedTagIndex.value = -1; // 重置选择索引
};

// 折叠展开相关方法
const toggleDetailsVisibility = () => {
  isDetailsVisible.value = !isDetailsVisible.value;
};

const toggleInfoVisibility = () => {
  isInfoVisible.value = !isInfoVisible.value;
};

const selectTagSuggestion = (tag) => {
  // 直接触发 add-tag 事件，传递选中的标签
  emit("add-tag", tag);
  // 清空输入框
  emit("update:newTag", "");
  closeTagSuggestionsWithAnimation();
};

const handleTagFocus = () => {
  showTagSuggestions.value = true;
  selectedTagIndex.value = -1;
};

const handleTagBlur = () => {
  // 使用 setTimeout 确保点击建议项时不会立即关闭列表
  setTimeout(() => {
    closeTagSuggestionsWithAnimation();
  }, 150);
};

const handleTagKeydown = (e) => {
  if (
    e.key != "Enter" &&
    (!showTagSuggestions.value || filteredTags.value.length === 0)
  ) {
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedTagIndex.value = Math.min(
        selectedTagIndex.value + 1,
        filteredTags.value.length - 1
      );
      break;
    case "ArrowUp":
      e.preventDefault();
      selectedTagIndex.value = Math.max(selectedTagIndex.value - 1, -1);
      break;
    case "Enter":
      e.preventDefault();
      if (selectedTagIndex.value >= 0) {
        // 如果有选中的建议项，添加该建议项
        selectTagSuggestion(filteredTags.value[selectedTagIndex.value]);
      } else {
        // 如果没有选中的建议项，添加当前输入的内容
        addTag();
      }
      break;
    case "Escape":
      e.preventDefault();
      closeTagSuggestionsWithAnimation();
      break;
  }
};

const closeTagSuggestionsWithAnimation = () => {
  if (showTagSuggestions.value && !isTagSuggestionsClosing.value) {
    isTagSuggestionsClosing.value = true;
    setTimeout(() => {
      showTagSuggestions.value = false;
      isTagSuggestionsClosing.value = false;
    }, 200);
  }
};

const handleFolderInput = (e) => {
  emit("update:folder", e.target.value);
  showFolderSuggestions.value = true;
};

const selectFolderSuggestion = (folder) => {
  emit("update:folder", folder);
  closeFolderSuggestionsWithAnimation();
};

const handleFolderBlur = () => {
  // 使用 setTimeout 确保点击建议项时不会立即关闭列表
  setTimeout(() => {
    closeFolderSuggestionsWithAnimation();
  }, 150);
};

const closeFolderSuggestionsWithAnimation = () => {
  if (showFolderSuggestions.value && !isFolderSuggestionsClosing.value) {
    isFolderSuggestionsClosing.value = true;
    setTimeout(() => {
      showFolderSuggestions.value = false;
      isFolderSuggestionsClosing.value = false;
    }, 200);
  }
};

// 点击外部关闭建议列表
const handleClickOutside = (event) => {
  // 检查是否点击了建议项
  const isSuggestionItem = event.target.classList.contains("suggestion-item");

  if (
    folderInput.value &&
    !folderInput.value.contains(event.target) &&
    !isSuggestionItem
  ) {
    closeFolderSuggestionsWithAnimation();
  }
  if (
    tagInput.value &&
    !tagInput.value.contains(event.target) &&
    !isSuggestionItem
  ) {
    closeTagSuggestionsWithAnimation();
  }
};

// 添加全局点击事件监听
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const getTagSuggestionsStyle = () => {
  if (!tagInput.value) return {};

  const rect = tagInput.value.getBoundingClientRect();
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
  };
};

const getFolderSuggestionsStyle = () => {
  if (!folderInput.value) return {};

  const rect = folderInput.value.getBoundingClientRect();
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
  };
};

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};

// 文件大小格式化
const formatFileSize = (sizeKB) => {
  if (!sizeKB || sizeKB === 0) return "0 KB";

  const units = ["KB", "MB", "GB"];
  let size = sizeKB;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// 获取文件名
const getFileName = (filePath) => {
  if (!filePath) return "-";
  // 提取最后一个 / 或 \ 后的文件名
  const fileName = filePath.replace(/\\/g, "/").split("/").pop();
  return fileName || filePath;
};

// EXIF 标签中文映射
const commonExifLabelMap = {
  camera: "相机",
  lens: "镜头",
  iso: "ISO",
  aperture: "光圈",
  shutterSpeed: "快门",
  focalLength: "焦距",
  exposure: "曝光",
  whiteBalance: "白平衡",
  flashMode: "闪光灯",
  meteringMode: "测光",
  model: "型号",
  make: "制造商",
  // 常见 EXIF 字段
  Make: "制造商",
  Model: "型号",
  DateTimeOriginal: "拍摄时间",
  ExposureTime: "快门速度",
  FNumber: "光圈值",
  ISOSpeedRatings: "ISO",
  FocalLength: "焦距",
  WhiteBalance: "白平衡",
  Flash: "闪光灯",
  GPSLatitude: "纬度",
  GPSLongitude: "经度",
  GPSAltitude: "海拔",
  ExposureBiasValue: "曝光补偿",
  MaxApertureValue: "最大光圈",
  DigitalZoomRatio: "数字变焦比",
  LensMake: "镜头生产商",
  LensModel: "镜头型号",
};

const uncommonExifLabelMap = {
  OffsetTime: "时区",
  Software: "软件",
  ExposureProgram: "曝光程序",
  Contrast: "对比度",
  Saturation: "饱和度",
  Sharpness: "锐度",
  PixelXDimension: "像素宽度",
  PixelYDimension: "像素高度",
  ImageWidth: "图像宽度",
  ImageLength: "图像高度",
  SubjectDistance: "主体距离",
  FocalLengthIn35mmFilm: "35mm等效焦距",
  SerialNumber: "序列号",
  LensSerialNumber: "镜头序列号",
  Orientation: "方向",
  CompressedBitsPerPixel: "压缩位深度",
  XResolution: "X轴分辨率",
  YResolution: "Y轴分辨率",
};

const iconMap = {
  camera: "photo_camera",
  lens: "zoom_in",
  iso: "contrast",
  aperture: "circle",
  shutterSpeed: "shutter_speed",
  exposure: "exposure",
  whiteBalance: "balance",
  flashMode: "flash_on",
  meteringMode: "light_mode",
  model: "info",
  make: "info",
  // 常见 EXIF 字段图标
  Make: "manufacturing",
  Model: "view_in_ar",
  DateTimeOriginal: "calendar_today",
  ExposureTime: "shutter_speed",
  FNumber: "circle",
  ISOSpeedRatings: "contrast",
  FocalLength: "straighten",
  WhiteBalance: "balance",
  Flash: "flash_on",
  MeteringMode: "light_mode",
  ExposureProgram: "exposure",
  ExposureMode: "exposure",
  SceneCaptureType: "photo_camera",
  GPSLatitude: "location_on",
  GPSLongitude: "location_on",
  GPSAltitude: "height",
  Software: "computer",
  ImageWidth: "aspect_ratio",
  ImageLength: "aspect_ratio",
  Orientation: "rotate_right",
  ColorSpace: "palette",
  ComponentsConfiguration: "settings",
  CompressedBitsPerPixel: "data_usage",
  PixelXDimension: "aspect_ratio",
  PixelYDimension: "aspect_ratio",
  SensingMethod: "sensors",
  SceneType: "photo_camera",
  CustomRendered: "edit",
  ExposureBiasValue: "exposure",
  MaxApertureValue: "circle",
  SubjectDistance: "distance",
  SubjectDistanceRange: "distance",
  DigitalZoomRatio: "zoom_in",
  FocalLengthIn35mmFilm: "straighten",
  Contrast: "contrast",
  Saturation: "invert_colors",
  Sharpness: "filter_center_focus",
  SubjectLocation: "location_on",
  LightSource: "lightbulb",
  SensingMethod: "sensors",
  LensMake: "camera",
  LensModel: "lens_blur",
  SerialNumber: "numbers",
  LensSerialNumber: "numbers",
};

const exifObjectKey = [
  "ExposureTime",
  "FNumber",
  "ISOSpeedRatings",
  "FocalLength",
  "CompressedBitsPerPixel",
  "ExposureBiasValue",
  "XResolution",
  "YResolution",
];

const getExifIsCommon = (key) => {
  return commonExifLabelMap[key];
};

// 获取 EXIF 标签的中文名称
const getExifLabel = (key) => {
  return commonExifLabelMap[key] || uncommonExifLabelMap[key] || key;
};

// 获取 EXIF 标签的图标
const getExifIcon = (key) => {
  return iconMap[key] || "info";
};

// 格式化 EXIF 值
const formatExifValue = (key, value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  // 处理对象类型的值
  if (typeof value === "object" && !exifObjectKey.includes(key)) {
    // 处理分数格式
    if (value.numerator !== undefined && value.denominator !== undefined) {
      if (value.denominator === 1) {
        return value.numerator.toString();
      }
      return `${value.numerator}/${value.denominator}`;
    }

    // 处理数组格式（如GPS坐标）
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (
            typeof item === "object" &&
            item.numerator !== undefined &&
            item.denominator !== undefined
          ) {
            return item.numerator / item.denominator;
          }
          return item;
        })
        .join(", ");
    }

    // 其他对象格式转为字符串
    return JSON.stringify(value);
  }

  // 处理特殊字段
  switch (key) {
    case "ExposureTime":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        const exposure = value.numerator / value.denominator;
        return exposure >= 1
          ? `${exposure}秒`
          : `1/${Math.round(1 / exposure)}秒`;
      }
      break;

    case "FNumber":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `f/${(value.numerator / value.denominator).toFixed(1)}`;
      }
      break;

    case "CompressedBitsPerPixel":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `${(value.numerator / value.denominator).toFixed(1)}`;
      }
      break;

    case "ExposureBiasValue":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `${
          value.numerator > 0 ? "+" : value.numerator == 0 ? "" : "-"
        }${(value.numerator / value.denominator).toFixed(1)} EV`;
      }
      break;

    case "XResolution":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `${(value.numerator / value.denominator).toFixed(1)} DPI`;
      }
      break;

    case "YResolution":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `${(value.numerator / value.denominator).toFixed(1)} DPI`;
      }
      break;

    case "FocalLength":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `${(value.numerator / value.denominator).toFixed(1)}mm`;
      }
      break;

    case "ISOSpeedRatings":
      if (Array.isArray(value)) {
        return `ISO ${value.join(", ")}`;
      }
      break;

    case "GPSLatitude":
    case "GPSLongitude":
      if (Array.isArray(value) && value.length === 3) {
        const degrees = value[0].numerator / value[0].denominator;
        const minutes = value[1].numerator / value[1].denominator;
        const seconds = value[2].numerator / value[2].denominator;
        return `${degrees.toFixed(6)}° ${minutes.toFixed(0)}' ${seconds.toFixed(
          2
        )}\"`;
      }
      break;

    case "GPSAltitude":
      if (
        typeof value === "object" &&
        value.numerator !== undefined &&
        value.denominator !== undefined
      ) {
        return `${(value.numerator / value.denominator).toFixed(2)}米`;
      }
      break;

    case "DateTimeOriginal":
      try {
        let date = new Date(value);
        if (isNaN(date.getTime())) {
          // 处理自定义格式 "YYYY:MM:DD HH:MM:SS"
          date = parseCustomDateString(value);
        }
        return date.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch {
        return value;
      }

    case "Flash":
      const flashMap = {
        0: "未使用",
        1: "使用",
        5: "闪光灯未闪光",
        7: "闪光灯闪光",
        9: "强制闪光",
        13: "强制闪光，未检测到返回光",
        15: "强制闪光，检测到返回光",
        16: "闪光灯关闭",
        24: "自动闪光",
        25: "自动闪光，未检测到返回光",
        29: "自动闪光，检测到返回光",
      };
      return flashMap[value] || value;

    case "WhiteBalance":
      const wbMap = {
        0: "自动",
        1: "手动",
      };
      return wbMap[value] || value;

    case "ExposureProgram":
      const programMap = {
        0: "未定义",
        1: "手动",
        2: "程序自动",
        3: "光圈优先",
        4: "快门优先",
        5: "创意程序",
        6: "动作程序",
        7: "肖像模式",
        8: "风景模式",
      };
      return programMap[value] || value;
  }

  // 默认返回字符串
  return String(value);
};

// 过滤 EXIF 数据（只显示有值的项）
const filteredExifData = computed(() => {
  if (!props.photo?.exifData) {
    return [];
  }

  const exifItems = [];

  // 递归处理嵌套的 EXIF 对象
  const processExifObject = (obj, prefix = "") => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && value !== undefined && value !== "") {
        if (exifObjectKey.includes(key)) {
          if (
            !hideUncommonExif.value ||
            (hideUncommonExif.value && getExifIsCommon(fullKey))
          ) {
            exifItems.push({
              key: key,
              value: formatExifValue(key, value),
            });
          }
        } else if (typeof value === "object" && !Array.isArray(value)) {
          // 递归处理嵌套对象
          processExifObject(value, fullKey);
        } else if (
          !hideUncommonExif.value ||
          (hideUncommonExif.value && getExifIsCommon(fullKey))
        ) {
          if (
            hideUndenfiedExif.value &&
            !(
              commonExifLabelMap[fullKey] ||
              uncommonExifLabelMap[fullKey] ||
              commonExifLabelMap[key] ||
              uncommonExifLabelMap[key]
            )
          ) {
            continue;
          }
          exifItems.push({
            key: fullKey,
            value: formatExifValue(key, value),
          });
        }
      }
    }
  };

  processExifObject(JSON.parse(props.photo.exifData).Exif);
  //processExifObject(JSON.parse(props.photo.exifData).CommonExif)

  // 按重要性排序
  const priorityKeys = [
    "Make",
    "Model",
    "LensMake",
    "LensModel",
    "DateTimeOriginal",
    "ExposureTime",
    "ExposureBiasValue",
    "FNumber",
    "ISOSpeedRatings",
    "FocalLength",
    "WhiteBalance",
    "Flash",
    "GPSLatitude",
    "GPSLongitude",
    "GPSAltitude",
  ];

  return exifItems.sort((a, b) => {
    const aIndex = priorityKeys.indexOf(a.key.split(".").pop());
    const bIndex = priorityKeys.indexOf(b.key.split(".").pop());

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else if (
      (commonExifLabelMap[a.key] || uncommonExifLabelMap[a.key]) &&
      !commonExifLabelMap[b.key] &&
      !uncommonExifLabelMap[b.key]
    ) {
      return -1;
    } else if (
      (commonExifLabelMap[b.key] || uncommonExifLabelMap[b.key]) &&
      !commonExifLabelMap[a.key] &&
      !uncommonExifLabelMap[a.key]
    ) {
      return 1;
    } else {
      return a.key.localeCompare(b.key);
    }
  });
});

const parseCustomDateString = (dateString) => {
  // 按空格分割日期和时间部分
  const [datePart, timePart] = dateString.split(" ");

  // 分割日期部分 (年:月:日)
  const [year, month, day] = datePart.split(":").map(Number);

  // 分割时间部分 (时:分:秒)
  const [hour, minute, second] = timePart.split(":").map(Number);

  // Date 构造函数中，月份是 0-indexed 的 (0 表示 1月，11 表示 12月)
  // 所以需要将获取到的月份减 1
  const dateObject = new Date(year, month - 1, day, hour, minute, second);

  return dateObject;
};

// 评分相关方法
const setRating = (star) => {
  // 计算评分值（支持半分）
  const currentRating = props.editablePhoto.rating;
  let newRating;

  if (currentRating === star) {
    // 如果点击的是当前评分，设置为半分
    newRating = star - 0.5;
  } else {
    newRating = star;
  }

  emit("update:rating", newRating);
};

const clearRating = () => {
  emit("update:rating", null);
};

const getStarFilled = (star) => {
  const displayRating = hoverRating.value || props.editablePhoto.rating;
  if (displayRating === null || displayRating === undefined) return false;
  return star <= Math.floor(displayRating);
};

const getStarHalf = (star) => {
  const displayRating = hoverRating.value || props.editablePhoto.rating;
  if (displayRating === null || displayRating === undefined) return false;
  return star === Math.ceil(displayRating) && displayRating % 1 !== 0;
};

const getStarIcon = (star) => {
  const displayRating = hoverRating.value || props.editablePhoto.rating;
  if (displayRating === null || displayRating === undefined) return "star";

  if (star <= Math.floor(displayRating)) {
    return "star";
  } else if (star === Math.ceil(displayRating) && displayRating % 1 !== 0) {
    return "star_half";
  } else {
    return "star_outline";
  }
};

const formatRating = (rating) => {
  if (rating === null || rating === undefined) return "";
  return `${rating.toFixed(1)}`;
};

const downloadImage = async () => {
  if (!props.photo) return;

  try {
    // 拉取图片内容
    const response = await fetch(currentImageUrl.value, { mode: "cors" });
    if (!response.ok) throw new Error("图片下载失败");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement("a");
    link.href = url;
    link.download = getFileName(props.photo.filePath) || "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放 blob url
    URL.revokeObjectURL(url);

    photoStore.showNotification("图片下载中...", "success");
  } catch (error) {
    console.error("下载失败:", error);
    photoStore.showNotification("下载失败，请重试", "error");
  }
};
</script>

<style scoped>
.photo-editor-container {
  display: flex;
  gap: 20px;
  flex: 1;
  height: 100%;
  min-height: 0;
}

/* 左侧：图片区域 */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: sticky;
  top: 0;
  align-self: stretch;
  max-height: 100%;
  height: 100%;
}

/* 右侧：详情和编辑区域 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow-y: auto;
  padding-right: 4px;
  max-height: 100%;
}

.right-panel::-webkit-scrollbar {
  width: 6px;
}

.right-panel::-webkit-scrollbar-track {
  background: transparent;
}

.right-panel::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant);
  border-radius: 3px;
}

.photo-container {
  width: 100%;
  background: var(--md-sys-color-surface-container-high);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: 100%;
  position: relative;
  flex-shrink: 0;
  height: calc(90vh - 165px);
}

.bottom-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 8px;
}

/* 可折叠部分 */
.collapsible-section {
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  overflow: hidden;
}

.section-header {
  cursor: pointer;
  padding: 16px;
  user-select: none;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.section-header:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.section-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 24px;
  width: 24px;
  height: 24px;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

.section-content {
  padding: 0 16px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 详情卡片专用样式 */
.details-section {
  flex-shrink: 0;
}

.details-section .section-content {
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-label .material-symbols-outlined {
  font-size: 18px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.detail-value {
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
  word-break: break-word;
  padding-left: 26px;
  line-height: 1.4;
}

.file-name {
  font-family: "Monaco", "Menlo", "Courier", monospace;
  font-size: 12px;
  background: var(--md-sys-color-surface-container-highest);
  padding: 8px;
  border-radius: 4px;
  overflow-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  margin-left: 0;
  padding-left: 8px;
  line-height: 1.5;
}

.exif-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.exif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exif-header h4 {
  margin: 0;
  padding: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 编辑信息区域 */
.info-section {
  flex-shrink: 0;
}

.info-field {
  width: 100%;
}

.photo-container img {
  max-width: 100%;
  object-fit: contain;
  width: auto;
  height: auto;
}

.photo {
  max-height: calc(90vh - 165px);
}

.original-image-button {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.original-image-button.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 复制和下载按钮 */
.action-buttons {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(10px);
}

.action-buttons.show {
  opacity: 1;
  transform: translateY(0);
}

.action-button {
  padding-left: 12px;
  padding-right: 12px;
}

.no-photo {
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  padding: 40px;
}

.no-photo .material-symbols-outlined {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
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

/* 评分控件样式 */
.rating-section {
  margin-top: 8px;
}

.rating-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.rating-stars {
  display: flex;
  gap: 4px;
}

.star-container {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.star-container:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.star-icon {
  font-size: 24px;
  color: var(--md-sys-color-outline);
  transition: color 0.2s;
}

.star-icon.filled {
  color: var(--md-sys-color-primary);
  font-variation-settings: "FILL" 1, "wght" 700, "GRAD" 0, "opsz" 48;
}

.star-icon.half {
  color: var(--md-sys-color-primary);
}

.rating-value {
  color: var(--md-sys-color-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
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

.suggestion-item.selected {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.suggestion-item:not(:last-child) {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.photo {
  max-height: calc(90vh - 165px);
}

/* 响应式设计 */
/* 平板和小屏幕：改为竖向堆叠 */
@media (max-width: 1200px) {
  .photo-editor-container {
    flex-direction: column;
    gap: 16px;
  }

  .left-panel {
    min-width: 100%;
    position: static;
    max-height: none;
  }

  .right-panel {
    min-width: 100%;
    padding-right: 0;
    max-height: none;
  }

  .photo-container {
    max-height: max(400px, 50vh);
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .right-panel {
    max-height: none;
    gap: 12px;
  }

  .photo-container {
    max-height: max(350px, 50vh);
    min-height: 200px;
  }

  .section-header {
    padding: 12px;
  }

  .section-content {
    padding: 0 12px 12px 12px;
  }

  .detail-value {
    font-size: 13px;
    padding-left: 24px;
  }

  .detail-label {
    font-size: 11px;
  }

  .file-name {
    font-size: 11px;
    padding: 6px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .photo-editor-container {
    gap: 12px;
  }

  .right-panel {
    gap: 12px;
    max-height: none;
  }

  .photo-container {
    max-height: max(300px, 50vh);
    min-height: 180px;
  }

  .collapsible-section {
    border-radius: 8px;
  }

  .section-header {
    padding: 12px;
  }

  .section-header h3 {
    font-size: 14px;
  }

  .collapse-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }

  .section-content {
    padding: 0 12px 12px 12px;
    gap: 12px;
  }

  .detail-item {
    gap: 3px;
  }

  .detail-label {
    font-size: 10px;
  }

  .detail-label .material-symbols-outlined {
    font-size: 16px;
    width: 16px;
    height: 16px;
  }

  .detail-value {
    font-size: 12px;
    padding-left: 22px;
  }

  .file-name {
    font-size: 11px;
    padding: 6px;
    line-height: 1.4;
  }

  .exif-section {
    gap: 10px;
    padding-top: 8px;
  }

  .exif-section h4 {
    font-size: 10px;
  }
}

md-switch.dense {
  --md-switch-track-height: 20px;
  --md-switch-track-width: 34px;
  --md-switch-selected-handle-height: 10px;
  --md-switch-selected-handle-width: 10px;
  --md-switch-handle-height: 10px;
  --md-switch-handle-width: 10px;
  --md-switch-state-layer-size: 25px;
}
</style>
