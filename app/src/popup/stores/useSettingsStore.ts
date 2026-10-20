// src/popup/stores/useSettingsStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const CACHE_TTL = 60_000 // 60 秒快取

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
  const loading = ref(false)
  const lastFetchedAt = ref(0)

  async function load(force = false) {
    // 快取未過期且非強制重新整理，直接跳過
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    loading.value = true
    const res = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }).catch(() => undefined)
    if (res?.success) {
      settings.value = { ...DEFAULT_SETTINGS, ...res.data }
      lastFetchedAt.value = Date.now()
    }
    loading.value = false
  }

  /** 樂觀更新；回傳是否成功寫入 */
  async function update(patch: Partial<AppSettings>): Promise<boolean> {
    settings.value = { ...settings.value, ...patch }
    lastFetchedAt.value = Date.now()
    const res = await chrome.runtime
      .sendMessage({ type: 'UPDATE_SETTINGS', settings: patch })
      .catch(() => undefined)
    return Boolean(res?.success)
  }

  /** 強制使快取失效（供外部觸發用） */
  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { settings, loading, load, update, invalidate }
})
