// src/background/services/BadgeService.ts
// 依目前狀態更新工具列：
// - 圖示：封鎖暫停中顯示灰色版，其他時候為品牌色
// - Badge：計時器（綠）優先，其次計時暫停（❚❚），最後是封鎖暫停的剩餘時間（琥珀）

import { StorageService } from './StorageService'

const ICON_SIZES = [16, 32, 48, 128] as const
const iconPaths = (prefix: string) =>
  Object.fromEntries(ICON_SIZES.map((s) => [s, `icons/${prefix}${s}.png`]))

let lastIconPaused: boolean | null = null // 避免每分鐘重複設定相同圖示

/** 剩餘時間的簡短表示：59m、3h */
function shortDuration(ms: number): string {
  const min = Math.ceil(ms / 60000)
  return min < 60 ? `${min}m` : `${Math.ceil(min / 60)}h`
}

export async function updateBadge(): Promise<void> {
  const [timer, snoozeUntil] = await Promise.all([
    StorageService.getTimerState(),
    StorageService.getSnoozeUntil(),
  ])
  const now = Date.now()
  const blockingPaused = snoozeUntil > now

  if (blockingPaused !== lastIconPaused) {
    lastIconPaused = blockingPaused
    await chrome.action.setIcon({ path: iconPaths(blockingPaused ? 'icon-paused' : 'icon') })
  }

  if (timer.isActive && timer.endTime && timer.endTime > now) {
    await chrome.action.setBadgeBackgroundColor({ color: '#009fb7' })
    await chrome.action.setBadgeText({ text: shortDuration(timer.endTime - now) })
    return
  }

  if (timer.pausedRemainingMs) {
    await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' })
    await chrome.action.setBadgeText({ text: '❚❚' })
    return
  }

  if (blockingPaused) {
    await chrome.action.setBadgeBackgroundColor({ color: '#fe9a00' })
    await chrome.action.setBadgeText({ text: shortDuration(snoozeUntil - now) })
    return
  }

  await chrome.action.setBadgeText({ text: '' })
}
