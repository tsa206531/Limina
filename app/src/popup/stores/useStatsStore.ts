// src/popup/stores/useStatsStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { TimeByDay } from '@/types'
import { recentDateKeys } from '@/utils/date'

const CACHE_TTL = 60_000 // 60 秒快取
const MAX_RANGE_DAYS = 30 // 統計頁最長顯示範圍，只向背景要這麼多天

export const useStatsStore = defineStore('stats', () => {
  const byDay = shallowRef<TimeByDay>({})
  const loading = ref(false)
  const lastFetchedAt = ref(0)

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    loading.value = true
    const res = await chrome.runtime
      .sendMessage({ type: 'GET_TIME_STATS', days: MAX_RANGE_DAYS })
      .catch(() => undefined)
    if (res?.success) {
      byDay.value = res.data ?? {}
      lastFetchedAt.value = Date.now()
    }
    loading.value = false
  }

  /** 每日總時長（全部網域加總） */
  function getDateRangeStats(days: number): { date: string; ms: number }[] {
    return recentDateKeys(days).map((date) => {
      let ms = 0
      for (const v of Object.values(byDay.value[date] ?? {})) ms += v
      return { date, ms }
    })
  }

  /** 區間內各網域的總時長，由多到少 */
  function getDomainStats(days: number): { domain: string; ms: number }[] {
    const totals = new Map<string, number>()
    for (const date of recentDateKeys(days)) {
      for (const [domain, ms] of Object.entries(byDay.value[date] ?? {})) {
        totals.set(domain, (totals.get(domain) ?? 0) + ms)
      }
    }
    return [...totals]
      .map(([domain, ms]) => ({ domain, ms }))
      .sort((a, b) => b.ms - a.ms)
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { byDay, loading, load, getDateRangeStats, getDomainStats, invalidate }
})
