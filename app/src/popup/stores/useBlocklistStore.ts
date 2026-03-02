// src/popup/stores/useBlocklistStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { BlockListEntry } from '@/types'

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
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_BLOCKLIST' }, (res) => {
        if (res?.success) {
          entries.value = res.data ?? []
          lastFetchedAt.value = Date.now()
        }
        loading.value = false
        resolve()
      })
    })
  }

  async function addEntry(entry: Omit<BlockListEntry, 'id' | 'createdAt'>) {
    const result = await new Promise<BlockListEntry | null>((resolve) => {
      chrome.runtime.sendMessage({ type: 'ADD_BLOCK', entry }, (res) => {
        if (res?.success && res.data) {
          entries.value = [...entries.value, res.data]
          lastFetchedAt.value = Date.now()
          resolve(res.data)
        } else {
          resolve(null)
        }
      })
    })
    return result
  }

  async function removeEntry(id: string) {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'REMOVE_BLOCK', id }, (res) => {
        if (res?.success) {
          entries.value = entries.value.filter((e) => e.id !== id)
          lastFetchedAt.value = Date.now()
        }
        resolve()
      })
    })
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { entries, loading, lockedList, whiteList, load, addEntry, removeEntry, invalidate }
})
