import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 主题模式：'light' | 'dark' | 'auto'
  const themeMode = ref('light')

  // 当前实际应用的主题：'light' | 'dark'
  const currentTheme = ref('light')

  // 初始化主题
  const initTheme = () => {
    // 从本地存储读取主题配置
    const savedTheme = localStorage.getItem('tag-photo-album-theme')
    if (savedTheme) {
      themeMode.value = savedTheme
    } else {
      // 如果没有保存的配置，检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      themeMode.value = prefersDark ? 'dark' : 'light'
    }

    applyTheme()
  }

  // 应用主题
  const applyTheme = () => {
    let effectiveTheme = themeMode.value

    if (themeMode.value === 'auto') {
      // 自动模式：跟随系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effectiveTheme = prefersDark ? 'dark' : 'light'
    }

    currentTheme.value = effectiveTheme

    // 设置HTML元素的data-theme属性
    document.documentElement.setAttribute('data-theme', effectiveTheme)

    // 保存到本地存储
    localStorage.setItem('tag-photo-album-theme', themeMode.value)
  }

  // 切换主题模式
  const toggleTheme = () => {
    const modes = ['light', 'dark', 'auto']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    themeMode.value = modes[nextIndex]
    applyTheme()
  }

  // 设置特定主题模式
  const setTheme = (mode) => {
    if (['light', 'dark', 'auto'].includes(mode)) {
      themeMode.value = mode
      applyTheme()
    }
  }

  // 监听系统主题变化（仅在auto模式下）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e) => {
    if (themeMode.value === 'auto') {
      applyTheme()
    }
  }

  // 添加系统主题变化监听器
  mediaQuery.addEventListener('change', handleSystemThemeChange)

  return {
    themeMode,
    currentTheme,
    initTheme,
    toggleTheme,
    setTheme,
    applyTheme
  }
})