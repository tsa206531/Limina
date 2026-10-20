// src/popup/stores/useStatsStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { StatsByDay, TimeByDay } from '@/types'
import { recentDateKeys } from '@/utils/date'

const CACHE_TTL = 60_000 // 60 秒快取
const MAX_RANGE_DAYS = 30 // 統計頁最長顯示範圍，只向背景要這麼多天

/** www.youtube.com 與 youtube.com 視為同一個網站 */
const displayDomain = (host: string) => host.replace(/^www\./, '')

export const useStatsStore = defineStore('stats', () => {
  const byDay = shallowRef<TimeByDay>({})
  const statsByDay = shallowRef<StatsByDay>({})
  const loading = ref(false)
  const lastFetchedAt = ref(0)

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    loading.value = true
    const res = await chrome.runtime
      .sendMessage({ type: 'GET_TIME_STATS', days: MAX_RANGE_DAYS })
      .catch(() => undefined)
    if (res?.success) {
      byDay.value = res.data?.timeByDay ?? {}
      statsByDay.value = res.data?.statsByDay ?? {}
      lastFetchedAt.value = Date.now()
    }
    loading.value = false
  }

  /** 每日總瀏覽時長（全部網域加總） */
  function getDateRangeStats(days: number): { date: string; ms: number }[] {
    return recentDateKeys(days).map((date) => {
      let ms = 0
      for (const v of Object.values(byDay.value[date] ?? {})) ms += v
      return { date, ms }
    })
  }

  /** 區間內各網站的總時長，由多到少 */
  function getDomainStats(days: number): { domain: string; ms: number }[] {
    const totals = new Map<string, number>()
    for (const date of recentDateKeys(days)) {
      for (const [host, ms] of Object.entries(byDay.value[date] ?? {})) {
        const domain = displayDomain(host)
        totals.set(domain, (totals.get(domain) ?? 0) + ms)
      }
    }
    return [...totals]
      .map(([domain, ms]) => ({ domain, ms }))
      .sort((a, b) => b.ms - a.ms)
  }

  /** 區間內完成的專注時段與擋下次數 */
  function getFocusStats(days: number): { sessions: number; focusMs: number; blocks: number } {
    const out = { sessions: 0, focusMs: 0, blocks: 0 }
    for (const date of recentDateKeys(days)) {
      const s = statsByDay.value[date]
      if (!s) continue
      out.sessions += s.focusSessions
      out.focusMs += s.focusMs
      out.blocks += s.blocks
    }
    return out
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return { byDay, statsByDay, loading, load, getDateRangeStats, getDomainStats, getFocusStats, invalidate }
})
