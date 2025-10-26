<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import GlobalSnackbar from '@/components/GlobalSnackbar.vue'

const authStore = useAuthStore()

onMounted(() => {
  // 初始化认证状态
  authStore.initialize()
})
</script>

<template>
  <div id="app">
    <router-view />
    <GlobalSnackbar />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', sans-serif;
  background-color: var(--md-sys-color-background, #fef7ff);
  color: var(--md-sys-color-on-background, #1d1b20);
}

#app {
  min-height: 100vh;
}

/* Material Design 3 主题变量 */
:root {
  /* 基础颜色 */
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;

  --md-sys-color-secondary: #625b71;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;

  --md-sys-color-tertiary: #7d5260;
  --md-sys-color-on-tertiary: #ffffff;
  --md-sys-color-tertiary-container: #ffd8e4;
  --md-sys-color-on-tertiary-container: #31111d;

  /* 表面颜色 */
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface-variant: #49454f;

  /* 容器颜色 */
  --md-sys-color-surface-container-lowest: #ffffff;
  --md-sys-color-surface-container-low: #f7f2fa;
  --md-sys-color-surface-container: #f3edf7;
  --md-sys-color-surface-container-high: #ece6f0;
  --md-sys-color-surface-container-highest: #e6e0e9;

  /* 轮廓颜色 */
  --md-sys-color-outline: #79747e;
  --md-sys-color-outline-variant: #cac4d0;

  /* 背景颜色 */
  --md-sys-color-background: #fef7ff;
  --md-sys-color-on-background: #1d1b20;

  /* 错误颜色 */
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-on-error-container: #410002;

  /* 阴影 */
  --md-sys-elevation-level0: none;
  --md-sys-elevation-level1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
  --md-sys-elevation-level2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
  --md-sys-elevation-level3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
  --md-sys-elevation-level4: 0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3);
  --md-sys-elevation-level5: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3);
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  :root {
    /* 基础颜色 */
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary: #381e72;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-on-primary-container: #eaddff;

    --md-sys-color-secondary: #ccc2dc;
    --md-sys-color-on-secondary: #332d41;
    --md-sys-color-secondary-container: #4a4458;
    --md-sys-color-on-secondary-container: #e8def8;

    --md-sys-color-tertiary: #efb8c8;
    --md-sys-color-on-tertiary: #492532;
    --md-sys-color-tertiary-container: #633b48;
    --md-sys-color-on-tertiary-container: #ffd8e4;

    /* 表面颜色 */
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-on-surface-variant: #cac4d0;

    /* 容器颜色 */
    --md-sys-color-surface-container-lowest: #0f0d13;
    --md-sys-color-surface-container-low: #1d1b20;
    --md-sys-color-surface-container: #211f26;
    --md-sys-color-surface-container-high: #2b2930;
    --md-sys-color-surface-container-highest: #36343b;

    /* 轮廓颜色 */
    --md-sys-color-outline: #938f99;
    --md-sys-color-outline-variant: #49454f;

    /* 背景颜色 */
    --md-sys-color-background: #141218;
    --md-sys-color-on-background: #e6e0e9;

    /* 错误颜色 */
    --md-sys-color-error: #ffb4ab;
    --md-sys-color-on-error: #690005;
    --md-sys-color-error-container: #93000a;
    --md-sys-color-on-error-container: #ffdad6;
  }
}

/* 字体样式 */
.md-typescale-display-large {
  font-family: 'Roboto', sans-serif;
  font-size: 57px;
  font-weight: 400;
  line-height: 64px;
  letter-spacing: -0.25px;
}

.md-typescale-display-medium {
  font-family: 'Roboto', sans-serif;
  font-size: 45px;
  font-weight: 400;
  line-height: 52px;
  letter-spacing: 0px;
}

.md-typescale-display-small {
  font-family: 'Roboto', sans-serif;
  font-size: 36px;
  font-weight: 400;
  line-height: 44px;
  letter-spacing: 0px;
}

.md-typescale-headline-large {
  font-family: 'Roboto', sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 40px;
  letter-spacing: 0px;
}

.md-typescale-headline-medium {
  font-family: 'Roboto', sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
  letter-spacing: 0px;
}

.md-typescale-headline-small {
  font-family: 'Roboto', sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  letter-spacing: 0px;
}

.md-typescale-title-large {
  font-family: 'Roboto', sans-serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 28px;
  letter-spacing: 0px;
}

.md-typescale-title-medium {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.15px;
}

.md-typescale-title-small {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.1px;
}

.md-typescale-body-large {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.5px;
}

.md-typescale-body-medium {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.25px;
}

.md-typescale-body-small {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.4px;
}

.md-typescale-label-large {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.1px;
}

.md-typescale-label-medium {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.5px;
}

.md-typescale-label-small {
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.5px;
}
</style>