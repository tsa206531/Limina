// src/background/services/BadgeService.ts
// 依目前狀態重新計算 badge：計時器（綠）優先，其次 snooze（琥珀），暫停顯示 ❚❚

import { StorageService } from './StorageService'

export async function updateBadge(): Promise<void> {
  const [timer, snoozeUntil] = await Promise.all([
    StorageService.getTimerState(),
    StorageService.getSnoozeUntil(),
  ])
  const now = Date.now()

  if (timer.isActive && timer.endTime && timer.endTime > now) {
    const min = Math.ceil((timer.endTime - now) / 60000)
    await chrome.action.setBadgeBackgroundColor({ color: '#22c55e' })
    await chrome.action.setBadgeText({ text: `${min}m` })
    return
  }

  if (timer.pausedRemainingMs) {
    await chrome.action.setBadgeBackgroundColor({ color: '#64748b' })
    await chrome.action.setBadgeText({ text: '❚❚' })
    return
  }

  if (snoozeUntil > now) {
    const min = Math.ceil((snoozeUntil - now) / 60000)
    await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' })
    await chrome.action.setBadgeText({ text: `${min}m` })
    return
  }

  await chrome.action.setBadgeText({ text: '' })
}
