import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { readFileSync } from 'node:fs'

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig(({ mode }) => ({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('md-')
      }
    }
  }),
    vueDevTools(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:5085',
        changeOrigin: true,
        secure: false
      },
      '/external': {
        target: 'http://localhost:5085',
        changeOrigin: true,
        secure: false
      }
    } : undefined,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'axios': ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}))
