// src/popup/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
// 字型與圖示改為本地打包：離線可用、不向第三方發送請求
import '@fontsource-variable/inter'
import 'material-symbols/outlined.css'
import './style.css'
import { useI18n } from '@/composables/useI18n'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Register $t globally so all templates can use it without importing
;(app.config.globalProperties as Record<string, unknown>).$t = (key: string, params?: Record<string, string | number>): string => {
  const { t } = useI18n()
  return t(key, params)
}

app.mount('#app')
