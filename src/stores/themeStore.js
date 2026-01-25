import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setStorage, getStorage } from '@/utils/storage'

const THEME_STORAGE_KEY = 'tag-photo-album-theme'
const THEME_MODES = ['light', 'dark', 'auto']

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref('light')
  const currentTheme = ref('light')

  const initTheme = () => {
    const savedTheme = getStorage(THEME_STORAGE_KEY)
    themeMode.value = savedTheme || getSystemThemePreference()
    applyTheme()
  }

  const getSystemThemePreference = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  const applyTheme = () => {
    const effectiveTheme = themeMode.value === 'auto' ? getSystemThemePreference() : themeMode.value

    currentTheme.value = effectiveTheme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    setStorage(THEME_STORAGE_KEY, themeMode.value)
  }

  const toggleTheme = () => {
    const currentIndex = THEME_MODES.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % THEME_MODES.length
    themeMode.value = THEME_MODES[nextIndex]
    applyTheme()
  }

  const setTheme = (mode) => {
    if (THEME_MODES.includes(mode)) {
      themeMode.value = mode
      applyTheme()
    }
  }

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (themeMode.value === 'auto') {
      applyTheme()
    }
  })

  return {
    themeMode,
    currentTheme,
    initTheme,
    toggleTheme,
    setTheme,
    applyTheme
  }
})