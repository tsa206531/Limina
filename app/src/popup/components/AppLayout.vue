<template>
  <div class="relative w-full h-full min-h-screen flex flex-col z-10 glass-panel shadow-2xl overflow-hidden">
    <!-- 背景裝飾球 -->
    <div class="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] -z-10 pointer-events-none animate-fade-in duration-1000">
      <div class="w-full h-full bg-primary/20 rounded-full blur-[80px] animate-breathe"></div>
    </div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] -z-10 pointer-events-none animate-fade-in duration-1000 delay-300 opacity-0" style="animation-fill-mode: forwards;">
      <div class="w-full h-full bg-blue-300/20 dark:bg-blue-900/20 rounded-full blur-[100px] animate-float"></div>
    </div>



    <!-- 頁面內容 -->
    <main class="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10 animate-slide-up-fade delay-100">
      <slot />
    </main>

    <!-- 底部導覽列 -->
    <nav class="fixed bottom-0 w-[360px] glass-card border-t border-white/50 dark:border-white/10 pb-6 pt-2 px-6 flex justify-between items-end z-30 !rounded-t-2xl !rounded-b-none shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] animate-slide-up-fade delay-200">
      <RouterLink 
        v-for="item in navItems" 
        :key="item.to" 
        :to="item.to"
        class="flex flex-col items-center gap-1 group w-16"
      >
        <div class="relative flex flex-col items-center group-active:scale-90 transition-transform duration-200">
          <span 
            class="material-symbols-outlined text-2xl transition-all duration-300"
            :class="isActive(item.to) ? 'text-primary dark:text-primary fill-current -translate-y-1' : 'text-text-secondary dark:text-gray-400 group-hover:text-primary group-hover:-translate-y-1'"
            :style="isActive(item.to) ? 'font-variation-settings: \'FILL\' 1;' : ''"
          >
            {{ item.icon }}
          </span>
          <span 
            class="text-[10px] font-medium transition-colors mt-1"
            :class="isActive(item.to) ? 'text-primary dark:text-primary' : 'text-text-secondary dark:text-gray-400 group-hover:text-primary'"
          >
            {{ $t(item.labelKey) }}
          </span>
        </div>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

// 導覽列項目 (對應原本的 /lists, /stats, /settings, /)
// 使用 Material Symbols 指向原先的頁面
const navItems = [
  { to: '/', icon: 'home', labelKey: 'nav.home' },
  { to: '/lists', icon: 'shield', labelKey: 'nav.blocklist' },
  { to: '/stats', icon: 'bar_chart', labelKey: 'nav.stats' },
  { to: '/settings', icon: 'settings', labelKey: 'nav.settings' },
]

function isActive(path: string) {
  return route.path === path
}
</script>
