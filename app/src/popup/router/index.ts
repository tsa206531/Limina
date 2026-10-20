// src/popup/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// 首頁直接打包；其他頁面用到才載入（統計頁的 Chart.js 不會拖慢 popup 開啟）
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView, name: 'home' },
    { path: '/lists', component: () => import('../views/ListsView.vue'), name: 'lists' },
    { path: '/stats', component: () => import('../views/StatsView.vue'), name: 'stats' },
    { path: '/settings', component: () => import('../views/SettingsView.vue'), name: 'settings' },
  ],
})

export default router
