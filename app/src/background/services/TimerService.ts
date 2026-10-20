// src/background/services/TimerService.ts
// 使用 chrome.alarms API 實作計時器（MV3 Service Worker 友好）

import { StorageService } from './StorageService'
import { updateBadge } from './BadgeService'
import { resolveLang, translate } from '@/locales/translate'

const ALARM_TIMER = 'limina-done'

async function schedule(endTime: number): Promise<void> {
  // 只清除計時器自己的 alarm，不可動到 time-tracker / day-change / snooze
  await chrome.alarms.clear(ALARM_TIMER)
  await chrome.alarms.create(ALARM_TIMER, { when: endTime })
}

export const TimerService = {
  async start(minutes: number): Promise<void> {
    const totalMs = minutes * 60 * 1000
    const endTime = Date.now() + totalMs
    await schedule(endTime)
    await StorageService.setTimerState({
      isActive: true,
      lastInputMin: minutes,
      endTime,
      totalMs,
      pausedRemainingMs: undefined,
      lastSession: undefined,
    })
    await updateBadge()
  },

  /** 使用者看過完成卡片後關閉 */
  async dismissSession(): Promise<void> {
    await StorageService.setTimerState({ lastSession: undefined })
  },

  async pause(): Promise<void> {
    const state = await StorageService.getTimerState()
    if (!state.isActive || !state.endTime) return
    await chrome.alarms.clear(ALARM_TIMER)
    await StorageService.setTimerState({
      isActive: false,
      endTime: undefined,
      pausedRemainingMs: Math.max(0, state.endTime - Date.now()),
    })
    await updateBadge()
  },

  async resume(): Promise<void> {
    const state = await StorageService.getTimerState()
    if (state.isActive || !state.pausedRemainingMs) return
    const endTime = Date.now() + state.pausedRemainingMs
    await schedule(endTime)
    await StorageService.setTimerState({
      isActive: true,
      endTime,
      pausedRemainingMs: undefined,
    })
    await updateBadge()
  },

  /** 延長目前計時（不重設進度環的總長基準以外的狀態） */
  async extend(minutes: number): Promise<void> {
    const state = await StorageService.getTimerState()
    const addMs = minutes * 60 * 1000
    const totalMs = (state.totalMs ?? state.lastInputMin * 60 * 1000) + addMs
    if (state.isActive && state.endTime) {
      const endTime = state.endTime + addMs
      await schedule(endTime)
      await StorageService.setTimerState({ endTime, totalMs })
    } else if (state.pausedRemainingMs) {
      await StorageService.setTimerState({
        pausedRemainingMs: state.pausedRemainingMs + addMs,
        totalMs,
      })
    }
    await updateBadge()
  },

  async cancel(): Promise<void> {
    await chrome.alarms.clear(ALARM_TIMER)
    await StorageService.setTimerState({
      isActive: false,
      endTime: undefined,
      totalMs: undefined,
      pausedRemainingMs: undefined,
    })
    await updateBadge()
  },

  /** 計時自然結束：記錄完成的專注時段，popup 下次開啟時顯示完成卡片 */
  async done(): Promise<void> {
    const state = await StorageService.getTimerState()
    const ms = state.totalMs ?? state.lastInputMin * 60 * 1000
    await this.cancel()
    await StorageService.setTimerState({ lastSession: { completedAt: Date.now(), ms } })
    await StorageService.incrementDayStats({ focusSessions: 1, focusMs: ms })

    const settings = await StorageService.getSettings()
    if (settings.showNotifications) {
      const lang = resolveLang(settings.language)
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: translate(lang, 'notification.timerDoneTitle'),
        message: translate(lang, 'notification.timerDoneBody'),
        priority: 2,
      })
    }
  },
}
