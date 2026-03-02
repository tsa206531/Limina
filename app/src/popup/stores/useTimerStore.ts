// src/popup/stores/useTimerStore.ts
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { TimerState } from '@/types'
import { DEFAULT_TIMER_STATE } from '@/types'

const CACHE_TTL = 5_000 // 計時器狀態 5 秒快取（此快取機制對依賴 endTime 來說也可以保留）

export const useTimerStore = defineStore('timer', () => {
  const state = shallowRef<TimerState>({ ...DEFAULT_TIMER_STATE })
  const remainingSec = ref(0) // Local reactive ref for the UI
  const lastFetchedAt = ref(0)
  let intervalId: ReturnType<typeof setInterval> | null = null

  async function load(force = false) {
    if (!force && lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (res) => {
        if (res?.success) {
          state.value = res.data
          lastFetchedAt.value = Date.now()
          updateRemainingSec()
          if (state.value.isActive && state.value.endTime) {
            startLocalTick()
          } else {
            stopLocalTick()
          }
        }
        resolve()
      })
    })
  }

  async function start(minutes: number) {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'SET_TIMER', minutes }, (res) => {
        if (res?.success) {
          const endTime = Date.now() + minutes * 60 * 1000
          state.value = { isActive: true, endTime, lastInputMin: minutes }
          lastFetchedAt.value = Date.now()
          updateRemainingSec()
          startLocalTick()
        }
        resolve()
      })
    })
  }

  async function cancel() {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'CANCEL_TIMER' }, (res) => {
        if (res?.success) {
          state.value = { ...DEFAULT_TIMER_STATE }
          lastFetchedAt.value = Date.now()
          updateRemainingSec()
          stopLocalTick()
        }
        resolve()
      })
    })
  }

  function updateRemainingSec() {
    if (state.value.isActive && state.value.endTime) {
      const diff = Math.floor((state.value.endTime - Date.now()) / 1000)
      remainingSec.value = Math.max(0, diff)
    } else {
      remainingSec.value = 0
    }
  }

  // 本地更新 UI 用，不影響 background logic
  function startLocalTick() {
    stopLocalTick()
    intervalId = setInterval(() => {
      updateRemainingSec()
      if (remainingSec.value <= 0) {
        state.value = { ...state.value, isActive: false }
        stopLocalTick()
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

  return { state, remainingSec, load, start, cancel, formatted, invalidate }
})
