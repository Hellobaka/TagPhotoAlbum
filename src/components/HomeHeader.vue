<template>
  <div class="content-header">
    <div class="header-content">
      <div class="header-title-section">
        <!-- 移动端侧边栏切换按钮 -->
        <md-icon-button
          v-if="isMobile"
          @click="$emit('toggle-sidebar')"
          class="mobile-menu-button"
        >
          <span class="material-symbols-outlined">menu</span>
        </md-icon-button>
        <h1 class="md-typescale-headline-small">{{ title }}</h1>
        <!-- 刷新按钮 -->
        <md-icon-button
          @click="handleRefresh"
          :disabled="isRefreshing"
          class="refresh-icon-button"
        >
          <span
            class="material-symbols-outlined refresh-icon"
            :class="{ refreshing: isRefreshing }"
          >
            refresh
          </span>
        </md-icon-button>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <md-outlined-text-field
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            label="搜索图片"
            type="search"
            has-trailing-icon
          >
            <span slot="leading-icon" class="material-symbols-outlined"
              >search</span
            >
            <md-icon-button
              v-if="searchQuery"
              slot="trailing-icon"
              @click="$emit('clear-search')"
            >
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </md-outlined-text-field>
        </div>
        <!-- 主题切换按钮 -->
        <md-icon-button
          @click="toggleTheme"
          class="theme-toggle-btn"
          :title="themeTooltip"
        >
          <span class="material-symbols-outlined">{{ themeIcon }}</span>
        </md-icon-button>
        <!-- 上传按钮 -->
        <md-filled-button @click="$emit('open-upload')" class="upload-button">
          <md-icon slot="icon">add_photo_alternate</md-icon>
          <span class="upload-button-text">上传图片</span>
        </md-filled-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useThemeStore } from "@/stores/themeStore";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  searchQuery: {
    type: String,
    default: "",
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "toggle-sidebar",
  "refresh",
  "update:searchQuery",
  "clear-search",
  "open-upload",
]);

// 内部状态管理
const themeStore = useThemeStore();
const isRefreshing = ref(false);

// 计算主题图标
const themeIcon = computed(() => {
  switch (themeStore.themeMode) {
    case "light":
      return "light_mode";
    case "dark":
      return "dark_mode";
    case "auto":
      return "auto_mode";
    default:
      return "light_mode";
  }
});

// 计算主题提示文本
const themeTooltip = computed(() => {
  switch (themeStore.themeMode) {
    case "light":
      return "切换到深色模式";
    case "dark":
      return "切换到自动模式";
    case "auto":
      return "切换到浅色模式";
    default:
      return "切换主题";
  }
});

// 主题切换
const toggleTheme = () => {
  themeStore.toggleTheme();
};

// 刷新处理
const handleRefresh = async () => {
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  try {
    await emit("refresh");
  } finally {
    // 确保在操作完成后重置状态
    setTimeout(() => {
      isRefreshing.value = false;
    }, 500);
  }
};
</script>

<style scoped>
.content-header {
  background: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title-section h1 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
}

.mobile-menu-button {
  --md-icon-button-icon-color: var(--md-sys-color-on-surface);
}

.refresh-icon-button {
  --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
}

.refresh-icon {
  transition: transform 0.3s ease;
}

.refresh-icon.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  min-width: 300px;
}

.search-box md-outlined-text-field {
  width: 100%;
  --md-outlined-text-field-container-shape: 28px;
}

.theme-toggle-btn {
  --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-header {
    padding: 12px 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-title-section {
    gap: 8px;
  }

  .header-title-section h1 {
    font-size: 1.25rem;
  }

  .header-actions {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .search-box {
    flex: 1;
    min-width: 0;
  }

  .search-box md-outlined-text-field {
    width: 100%;
  }

  .theme-toggle-btn {
    flex-shrink: 0;
  }

  .upload-button {
    flex-shrink: 0;
    padding: 0;
    min-width: 40px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .upload-button md-icon {
    margin-left: 7px;
  }

  /* 移动端隐藏上传按钮文字 */
  .upload-button .upload-button-text {
    display: none;
  }
}
</style>
