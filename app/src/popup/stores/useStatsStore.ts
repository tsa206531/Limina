// src/popup/stores/useStatsStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { TimeRecord } from '@/types'
import { localDateKey } from '@/utils/date'

const CACHE_TTL = 60_000 // 60 秒快取

/** 最近 days 天（含今天）的本地日期 key，由舊到新 */
function recentDateKeys(days: number): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(localDateKey(d))
  }
  return keys
}

export const useStatsStore = defineStore('stats', () => {
  const records = shallowRef<Record<string, TimeRecord>>({})
  const loading = ref(false)
  const lastFetchedAt = ref(0)

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    loading.value = true
    const res = await chrome.runtime.sendMessage({ type: 'GET_TIME_STATS' }).catch(() => undefined)
    if (res?.success) {
      records.value = res.data ?? {}
      lastFetchedAt.value = Date.now()
    }
    loading.value = false
  }

  /** 每日總時長（全部網域加總） */
  function getDateRangeStats(days: number): { date: string; ms: number }[] {
    return recentDateKeys(days).map((date) => {
      let ms = 0
      for (const rec of Object.values(records.value)) ms += rec.daily[date] ?? 0
      return { date, ms }
    })
  }

  /** 區間內各網域的總時長，由多到少 */
  function getDomainStats(days: number): { domain: string; ms: number }[] {
    const dates = recentDateKeys(days)
    const result: { domain: string; ms: number }[] = []
    for (const [domain, rec] of Object.entries(records.value)) {
      const ms = dates.reduce((sum, d) => sum + (rec.daily[d] ?? 0), 0)
      if (ms > 0) result.push({ domain, ms })
    }
    return result.sort((a, b) => b.ms - a.ms)
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { records, loading, load, getDateRangeStats, getDomainStats, invalidate }
})
