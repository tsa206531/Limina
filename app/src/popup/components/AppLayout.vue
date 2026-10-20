<template>
  <div class="flex h-full min-h-[580px] flex-col" :style="{ backgroundImage: 'var(--hero-glow)' }">
    <!-- 頁首：Logo 字標 + 暫停封鎖 -->
    <header class="flex items-center justify-between px-4 pb-2 pt-4">
      <div class="flex items-center gap-2">
        <LogoMark :size="28" />
        <span class="text-lg font-bold tracking-[-0.025em] text-ink-800">Limina</span>
      </div>
      <PauseMenu v-if="!blocking.isPaused" />
    </header>

    <!-- 封鎖暫停中：每一頁都看得到，並可直接恢復 -->
    <div v-if="blocking.isPaused" class="px-4 pb-2">
      <div class="notice-warning items-center">
        <AppIcon name="pause" :size="18" class="text-warning" />
        <span class="flex-1 font-medium text-ink-800">
          {{ $t('home.pausedBanner', { time: duration(blocking.remainingMs, 'ceil') }) }}
        </span>
        <button class="btn-neutral btn-sm" @click="blocking.resume()">{{ $t('home.resumeBlocking') }}</button>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 pb-24 pt-2">
      <slot />
    </main>

    <!-- 底部導覽：全站唯一的毛玻璃 -->
    <nav
      class="fixed bottom-0 left-0 z-30 flex w-[360px] justify-between gap-1 border-t border-line-200 px-3 pb-3 pt-2 backdrop-blur-md"
      :style="{ background: 'var(--glass-nav)' }"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-1 flex-col items-center gap-0.5 rounded-sm py-1.5 text-xs transition"
        :class="isActive(item.to) ? 'bg-brand/10 font-bold text-brand' : 'font-medium text-ink-500 hover:bg-brand/10 hover:text-brand'"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <AppIcon :name="isActive(item.to) ? item.activeIcon : item.icon" :size="22" />
        {{ $t(item.labelKey) }}
      </RouterLink>
    </nav>

    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import AppIcon from './AppIcon.vue'
import AppToast from './AppToast.vue'
import LogoMark from './LogoMark.vue'
import PauseMenu from './PauseMenu.vue'
import type { IconName } from '../icons'
import { useBlockingStore } from '../stores/useBlockingStore'

const route = useRoute()
const { duration } = useI18n()
const blocking = useBlockingStore()

const navItems: { to: string; icon: IconName; activeIcon: IconName; labelKey: string }[] = [
  { to: '/', icon: 'house', activeIcon: 'house-fill', labelKey: 'nav.home' },
  { to: '/lists', icon: 'shield', activeIcon: 'shield-fill', labelKey: 'nav.blocklist' },
  { to: '/stats', icon: 'chart-bar', activeIcon: 'chart-bar-fill', labelKey: 'nav.stats' },
  { to: '/settings', icon: 'gear', activeIcon: 'gear-fill', labelKey: 'nav.settings' },
]

function isActive(path: string) {
  return route.path === path
}
</script>
