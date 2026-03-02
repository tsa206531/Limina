// src/background/services/TimerService.ts
// 使用 chrome.alarms API 實作計時器（MV3 Service Worker 友好）

import { StorageService } from './StorageService'

const ALARM_TIMER = 'limina-done'

export const TimerService = {
  async start(minutes: number): Promise<void> {
    // 清除舊的 alarms
    await chrome.alarms.clearAll()

    const endTime = Date.now() + minutes * 60 * 1000

    await chrome.alarms.create(ALARM_TIMER, {
      when: endTime,
    })

    await StorageService.setTimerState({
      isActive: true,
      lastInputMin: minutes,
      endTime,
    })

    // 初次啟動時設定一個基本的 Badge (後續由前端接管倒數，背景不再每秒打字)
    chrome.action.setBadgeText({ text: `${minutes}m` })
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' })
  },

  async cancel(): Promise<void> {
    await chrome.alarms.clear(ALARM_TIMER)
    await StorageService.setTimerState({
      isActive: false,
      endTime: undefined,
    })
    chrome.action.setBadgeText({ text: '' })
  },

  async done(): Promise<void> {
    await this.cancel()

    const settings = await StorageService.getSettings()
    if (settings.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Limina ⏰',
        message: '時間到！好好休息一下吧。',
        priority: 2,
      })
    }
  },
}
