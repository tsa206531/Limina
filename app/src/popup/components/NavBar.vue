<template>
  <nav
    class="flex items-center border-t"
    style="background: rgba(20, 20, 5, 0.9); backdrop-filter: blur(12px); border-color: rgba(255,248,150,0.12)"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center justify-center gap-0.5 flex-1 py-3 text-xs font-medium transition-all duration-150"
      :class="isActive(item.to) ? 'text-primary-400' : 'text-white/35 hover:text-white/60'"
    >
      <span class="text-lg leading-none">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
      <span
        v-if="isActive(item.to)"
        class="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary-400"
      />
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/', icon: '🏠', label: '首頁' },
  { to: '/lists', icon: '📋', label: '名單' },
  { to: '/stats', icon: '📊', label: '統計' },
  { to: '/settings', icon: '⚙️', label: '設定' },
]

function isActive(path: string) {
  return route.path === path
}
</script>
