// src/popup/stores/useBlockingStore.ts
// 「暫停封鎖」狀態（與封鎖頁的「休息」共用 snoozeUntil）

import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref } from 'vue'

export const useBlockingStore = defineStore('blocking', () => {
  const snoozeUntil = ref(0)
  const now = ref(Date.now())

  // 每 15 秒更新一次「現在」，讓剩餘時間與到期自動反映
  const ticker = setInterval(() => { now.value = Date.now() }, 15_000)
  onScopeDispose(() => clearInterval(ticker))

  const isPaused = computed(() => snoozeUntil.value > now.value)
  const remainingMs = computed(() => Math.max(0, snoozeUntil.value - now.value))

  async function load() {
    const { snoozeUntil: stored } = await chrome.storage.local.get('snoozeUntil')
    snoozeUntil.value = (stored as number | undefined) ?? 0
    now.value = Date.now()
  }

  async function pauseFor(minutes: number) {
    await chrome.runtime.sendMessage({ type: 'SNOOZE', minutes }).catch(() => undefined)
    await load()
  }

  async function pauseUntilTomorrow() {
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    await chrome.runtime.sendMessage({ type: 'SNOOZE', until: tomorrow.getTime() }).catch(() => undefined)
    await load()
  }

  async function resume() {
    await chrome.runtime.sendMessage({ type: 'RESUME_BLOCKING' }).catch(() => undefined)
    await load()
  }

  return { snoozeUntil, isPaused, remainingMs, load, pauseFor, pauseUntilTomorrow, resume }
})
