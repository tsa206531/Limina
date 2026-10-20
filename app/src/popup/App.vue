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
import { setLocale } from '@/composables/useI18n'

const settingsStore = useSettingsStore()
const blocklistStore = useBlocklistStore()
const timerStore = useTimerStore()
const statsStore = useStatsStore()

// 語言設定一改變就套用（含匯入、清除資料後）
watch(() => settingsStore.settings.language, (lang) => setLocale(lang), { immediate: true })

// storage 被更新時（背景、其他視窗、匯入／清除），重新讀取對應的 store
function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area !== 'local') return
  if (changes.settings) void settingsStore.load(true)
  if (changes.blocklist) void blocklistStore.load(true)
  if (changes.timerState) void timerStore.load(true)
  if (changes.timeRecords) statsStore.invalidate()
}

onMounted(async () => {
  chrome.storage.onChanged.addListener(onStorageChanged)
  await settingsStore.load()
})

onUnmounted(() => {
  chrome.storage.onChanged.removeListener(onStorageChanged)
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-8px);
}
</style>
