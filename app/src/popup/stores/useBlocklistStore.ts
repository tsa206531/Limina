// src/popup/stores/useBlocklistStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { AddBlockResult, BlockListEntry } from '@/types'

const CACHE_TTL = 60_000 // 60 秒快取

export const useBlocklistStore = defineStore('blocklist', () => {
  const entries = shallowRef<BlockListEntry[]>([])
  const loading = ref(false)
  const lastFetchedAt = ref(0)

  const lockedList = computed(() => entries.value.filter((e) => e.type === 'locked'))
  const whiteList = computed(() => entries.value.filter((e) => e.type === 'white'))

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    loading.value = true
    const res = await chrome.runtime.sendMessage({ type: 'GET_BLOCKLIST' }).catch(() => undefined)
    if (res?.success) {
      entries.value = res.data ?? []
      lastFetchedAt.value = Date.now()
    }
    loading.value = false
  }

  /**
   * 加入名單；回傳 null 代表失敗，created=false 代表已在同一名單中。
   * 加入一份名單時，背景會自動移除另一份名單中的同名網域。
   */
  async function addEntry(
    entry: Omit<BlockListEntry, 'id' | 'createdAt'>,
  ): Promise<AddBlockResult | null> {
    const res = await chrome.runtime.sendMessage({ type: 'ADD_BLOCK', entry }).catch(() => undefined)
    if (!res?.success || !res.data) return null
    const result = res.data as AddBlockResult
    if (result.created) {
      entries.value = [...entries.value.filter((e) => e.domain !== entry.domain), result.entry]
      lastFetchedAt.value = Date.now()
    }
    return result
  }

  async function removeEntry(id: string) {
    const res = await chrome.runtime.sendMessage({ type: 'REMOVE_BLOCK', id }).catch(() => undefined)
    if (res?.success) {
      entries.value = entries.value.filter((e) => e.id !== id)
      lastFetchedAt.value = Date.now()
    }
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { entries, loading, lockedList, whiteList, load, addEntry, removeEntry, invalidate }
})
