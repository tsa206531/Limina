// src/popup/stores/useTimerStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { TimerState } from '@/types'
import { DEFAULT_TIMER_STATE } from '@/types'

const CACHE_TTL = 5_000 // 計時器狀態 5 秒快取

/** 秒數 → 時鐘格式：25:00、1:30:00 */
export function formatClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

function send(message: object): Promise<{ success: boolean; data?: unknown } | undefined> {
  return chrome.runtime.sendMessage(message).catch(() => undefined)
}

export const useTimerStore = defineStore('timer', () => {
  const state = shallowRef<TimerState>({ ...DEFAULT_TIMER_STATE })
  const remainingSec = ref(0) // Local reactive ref for the UI
  const lastFetchedAt = ref(0)
  let intervalId: ReturnType<typeof setInterval> | null = null

  const isPaused = computed(() => !state.value.isActive && Boolean(state.value.pausedRemainingMs))
  /** 有進行中或暫停中的計時 */
  const hasTimer = computed(() => state.value.isActive || isPaused.value)
  const totalSec = computed(() =>
    Math.round((state.value.totalMs ?? state.value.lastInputMin * 60_000) / 1000),
  )

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return
    // 讀取直接走 storage，不經過 Service Worker；指令仍交給背景處理
    const { timerState } = await chrome.storage.local.get('timerState')
    state.value = { ...DEFAULT_TIMER_STATE, ...(timerState as Partial<TimerState> | undefined) }
    lastFetchedAt.value = Date.now()
    syncTick()
  }

  /** 送出指令後以背景的實際狀態為準 */
  async function command(message: object) {
    const res = await send(message)
    if (res?.success) await load(true)
  }

  const start = (minutes: number) => command({ type: 'SET_TIMER', minutes })
  const pause = () => command({ type: 'PAUSE_TIMER' })
  const resume = () => command({ type: 'RESUME_TIMER' })
  const extend = (minutes: number) => command({ type: 'EXTEND_TIMER', minutes })
  const cancel = () => command({ type: 'CANCEL_TIMER' })
  const dismissSession = () => command({ type: 'DISMISS_SESSION' })

  /** 30 分鐘內完成、尚未關閉的專注時段（顯示完成卡片） */
  const recentSession = computed(() => {
    const s = state.value.lastSession
    if (!s || hasTimer.value || Date.now() - s.completedAt > 30 * 60_000) return null
    return s
  })

  function updateRemainingSec() {
    const s = state.value
    if (s.isActive && s.endTime) {
      remainingSec.value = Math.max(0, Math.ceil((s.endTime - Date.now()) / 1000))
    } else if (s.pausedRemainingMs) {
      remainingSec.value = Math.ceil(s.pausedRemainingMs / 1000)
    } else {
      remainingSec.value = 0
    }
  }

  function syncTick() {
    updateRemainingSec()
    if (state.value.isActive) startLocalTick()
    else stopLocalTick()
  }

  // 本地更新 UI 用，不影響 background logic
  function startLocalTick() {
    stopLocalTick()
    intervalId = setInterval(() => {
      updateRemainingSec()
      if (remainingSec.value <= 0) {
        stopLocalTick()
        // 背景 alarm 會結束計時，稍後同步實際狀態
        setTimeout(() => void load(true), 1500)
      }
    }, 1000)
  }

  function stopLocalTick() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function formatted(): string {
    return formatClock(remainingSec.value)
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return {
    state, remainingSec, totalSec, isPaused, hasTimer, recentSession,
    load, start, pause, resume, extend, cancel, dismissSession, formatted, invalidate,
  }
})
