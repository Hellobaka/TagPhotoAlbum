import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 导入Material Web Components
import '@material/web/all.js'

// 配置Vue忽略Material Web Components作为自定义元素
const app = createApp(App, {
  compilerOptions: {
    isCustomElement: (tag) => tag.startsWith('md-')
  }
})

app.use(createPinia())
app.use(router)

app.mount('#app')