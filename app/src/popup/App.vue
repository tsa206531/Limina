<template>
  <AppLayout>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppLayout from './components/AppLayout.vue'
import { useSettingsStore } from './stores/useSettingsStore'
import { useBlocklistStore } from './stores/useBlocklistStore'
import { useTimerStore } from './stores/useTimerStore'
import { useStatsStore } from './stores/useStatsStore'
import { useBlockingStore } from './stores/useBlockingStore'
import { setLocale } from '@/composables/useI18n'

const settingsStore = useSettingsStore()
const blocklistStore = useBlocklistStore()
const timerStore = useTimerStore()
const statsStore = useStatsStore()
const blockingStore = useBlockingStore()

// 語言設定一改變就套用（含匯入、清除資料後）
watch(() => settingsStore.settings.language, (lang) => {
  setLocale(lang)
  document.documentElement.lang = lang === 'auto' ? navigator.language : lang
}, { immediate: true })

// storage 被更新時（背景、其他視窗、匯入／清除），重新讀取對應的 store
function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area !== 'local') return
  if (changes.settings) void settingsStore.load(true)
  if (changes.blocklist) void blocklistStore.load(true)
  if (changes.timerState) void timerStore.load(true)
  if (changes.snoozeUntil) void blockingStore.load()
  if (Object.keys(changes).some((k) => k.startsWith('time:') || k.startsWith('stats:'))) {
    statsStore.invalidate()
  }
}

onMounted(async () => {
  chrome.storage.onChanged.addListener(onStorageChanged)
  await Promise.all([settingsStore.load(), blockingStore.load()])
})

onUnmounted(() => {
  chrome.storage.onChanged.removeListener(onStorageChanged)
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
