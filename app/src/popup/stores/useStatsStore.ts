// src/popup/stores/useStatsStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { TimeRecord } from '@/types'

const CACHE_TTL = 60_000 // 60 秒快取

export const useStatsStore = defineStore('stats', () => {
  const records = shallowRef<Record<string, TimeRecord>>({})
  const loading = ref(false)
  const lastFetchedAt = ref(0)

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    loading.value = true
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_TIME_STATS', dateRange: [] }, (res) => {
        if (res?.success) {
          records.value = res.data ?? {}
          lastFetchedAt.value = Date.now()
        }
        loading.value = false
        resolve()
      })
    })
  }

  const todayKey = computed(() => new Date().toISOString().slice(0, 10))

  const todayStats = computed(() => {
    const result: { domain: string; ms: number }[] = []
    for (const [domain, rec] of Object.entries(records.value)) {
      const ms = rec.daily[todayKey.value] ?? 0
      if (ms > 0) result.push({ domain, ms })
    }
    return result.sort((a, b) => b.ms - a.ms)
  })

  function getDateRangeStats(days: number): { date: string; ms: number }[] {
    const result: { date: string; ms: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().slice(0, 10)
      let totalMs = 0
      for (const rec of Object.values(records.value)) {
        totalMs += rec.daily[dateKey] ?? 0
      }
      result.push({ date: dateKey, ms: totalMs })
    }
    return result
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { records, loading, todayStats, load, getDateRangeStats, invalidate }
})
