import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 导入Material Web Components - 选择性导入以优化包大小
import './assets/global.css'

// 只导入实际使用的Material Web组件
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/button/elevated-button.js'
import '@material/web/chips/filter-chip.js'
import '@material/web/chips/suggestion-chip.js'
import '@material/web/chips/assist-chip.js'
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/icon/icon.js'
import '@material/web/switch/switch.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'

// 配置Vue忽略Material Web Components作为自定义元素
const app = createApp(App, {
  compilerOptions: {
    isCustomElement: (tag) => tag.startsWith('md-')
  }
})

app.use(createPinia())
app.use(router)

app.mount('#app')