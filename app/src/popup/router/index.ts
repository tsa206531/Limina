// src/popup/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ListsView from '../views/ListsView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView, name: 'home' },
    { path: '/lists', component: ListsView, name: 'lists' },
    { path: '/stats', component: StatsView, name: 'stats' },
    { path: '/settings', component: SettingsView, name: 'settings' },
  ],
})

export default router
