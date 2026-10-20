// src/popup/stores/useTimerStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { TimerState } from '@/types'
import { DEFAULT_TIMER_STATE } from '@/types'

const CACHE_TTL = 5_000 // 計時器狀態 5 秒快取

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
    const res = await send({ type: 'GET_TIMER_STATE' })
    if (res?.success) {
      state.value = res.data as TimerState
      lastFetchedAt.value = Date.now()
      syncTick()
    }
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
    const s = remainingSec.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':')
  }

  function invalidate() {
    lastFetchedAt.value = 0
  }

  return {
    state, remainingSec, totalSec, isPaused, hasTimer,
    load, start, pause, resume, extend, cancel, formatted, invalidate,
  }
})
