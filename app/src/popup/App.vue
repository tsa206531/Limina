<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import AppLayout from './components/AppLayout.vue'
import { useSettingsStore } from './stores/useSettingsStore'
import { useBlocklistStore } from './stores/useBlocklistStore'
import { useTimerStore } from './stores/useTimerStore'
import { setLocale } from '@/composables/useI18n'


const settingsStore = useSettingsStore()
const blocklistStore = useBlocklistStore()
const timerStore = useTimerStore()

const currentDomain = ref('')
const blockStatus = ref<'locked' | 'white' | 'none'>('none')

// ── A. storage 變更監聽：storage 被外部更新時，使 store 快取失效 ──
function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area !== 'local') return
  if (changes.settings) {
    settingsStore.invalidate()
    settingsStore.load()
  }
  if (changes.blocklist) {
    blocklistStore.invalidate()
  }
  if (changes.timerState) {
    timerStore.invalidate()
  }
}

// ── A. runtime 訊息監聽：Background 推送 BLOCK_STATUS 時即時更新狀態列 ──
function onRuntimeMessage(message: { type: string; status?: 'locked' | 'white' | 'none' }) {
  if (message.type === 'BLOCK_STATUS' && message.status) {
    blockStatus.value = message.status
  }
}

onMounted(async () => {
  await settingsStore.load()

  // Apply language setting
  let target = settingsStore.settings.language
  if (target === 'auto') {
    target = navigator.language.startsWith('zh') ? 'zh-TW' : navigator.language.startsWith('ja') ? 'ja' : 'en'
  }
  setLocale(target as any)

  // 取得當前 tab URL 與封鎖狀態
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url) {
    try {
      currentDomain.value = new URL(tab.url).hostname
    } catch {
      currentDomain.value = ''
    }
    chrome.runtime.sendMessage({ type: 'GET_STATUS', url: tab.url }, (res) => {
      if (res?.success) blockStatus.value = res.data.status
    })
  }

  // 註冊監聽器
  chrome.storage.onChanged.addListener(onStorageChanged)
  chrome.runtime.onMessage.addListener(onRuntimeMessage)
})

onUnmounted(() => {
  // 清除監聽器防止記憶體洩漏
  chrome.storage.onChanged.removeListener(onStorageChanged)
  chrome.runtime.onMessage.removeListener(onRuntimeMessage)
})

</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
