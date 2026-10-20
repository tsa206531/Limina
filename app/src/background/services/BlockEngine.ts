// src/background/services/BlockEngine.ts
// 白名單優先 > 鎖定名單 的 URL 比對引擎

import type { BlockListEntry, BlockStatus } from '@/types'
import { extractDomainLevels } from '@/utils/domain'
import { StorageService } from './StorageService'

function matches(list: BlockListEntry[], levels: string[]): boolean {
  return levels.some((level) => list.some((e) => e.domain === level))
}

/**
 * 封鎖判斷，優先順序：
 * 1. 封鎖關閉 / 全域 Snooze 生效 → 放行
 * 2. 白名單 → 放行（任何模式下皆優先）
 * 3. 終極專注模式（focusWhitelistOnly）且計時中 → 白名單以外全部封鎖
 * 4. 自由時間模式（timerPausesBlocking）且計時中 → 放行
 * 5. 鎖定名單 → 封鎖
 */
export async function checkBlockWithTimer(url: string): Promise<BlockStatus> {
  const [settings, timerState, snoozeUntil, blocklist] = await Promise.all([
    StorageService.getSettings(),
    StorageService.getTimerState(),
    StorageService.getSnoozeUntil(),
    StorageService.getBlocklist(),
  ])

  if (!settings.isEnabled) return 'none'
  if (snoozeUntil > 0 && Date.now() < snoozeUntil) return 'none'

  const levels = extractDomainLevels(url)
  if (levels.length === 0) return 'none'

  const whiteList = blocklist.filter((e) => e.type === 'white')
  const lockList = blocklist.filter((e) => e.type === 'locked')

  if (matches(whiteList, levels)) return 'white'
  if (settings.focusWhitelistOnly && timerState.isActive) return 'locked'
  if (settings.timerPausesBlocking && timerState.isActive) return 'none'
  if (matches(lockList, levels)) return 'locked'
  return 'none'
}
