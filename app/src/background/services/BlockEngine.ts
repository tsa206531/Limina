// src/background/services/BlockEngine.ts
// 白名單優先 > 鎖定名單 的 URL 比對引擎

import type { BlockListEntry, BlockStatus } from '@/types'
import { StorageService } from './StorageService'

/**
 * 從完整 URL 提取所有可比對層次的網域字串
 * e.g. https://mail.youtube.com/inbox
 * → ['mail.youtube.com', 'youtube.com']
 */
export function extractDomainLevels(url: string): string[] {
  try {
    const { hostname } = new URL(url)
    const parts = hostname.split('.')
    const levels: string[] = []
    for (let i = 0; i < parts.length - 1; i++) {
      levels.push(parts.slice(i).join('.'))
    }
    return levels
  } catch {
    return []
  }
}

/**
 * 核心封鎖判斷演算法
 * 白名單優先：命中白名單立即返回 'white'，不再檢查鎖定名單
 */
export async function checkBlock(url: string): Promise<BlockStatus> {
  const settings = await StorageService.getSettings()
  if (!settings.isEnabled) return 'none'

  const blocklist = await StorageService.getBlocklist()
  const levels = extractDomainLevels(url)
  if (levels.length === 0) return 'none'

  const whiteList = blocklist.filter((e) => e.type === 'white')
  const lockList = blocklist.filter((e) => e.type === 'locked')

  // 1. 白名單優先
  for (const level of levels) {
    if (whiteList.some((e) => e.domain === level)) {
      return 'white'
    }
  }

  // 2. 鎖定名單
  for (const level of levels) {
    if (lockList.some((e) => e.domain === level)) {
      return 'locked'
    }
  }

  return 'none'
}

/**
 * 計時器狀態影響封鎖邏輯：
 * 1. 全域 Snooze 生效中 → 所有網站暫時放行
 * 2. timerPausesBlocking=true 且計時器 active → 所有網站放行
 */
export async function checkBlockWithTimer(url: string): Promise<BlockStatus> {
  const [settings, timerState, snoozeUntil] = await Promise.all([
    StorageService.getSettings(),
    StorageService.getTimerState(),
    StorageService.getSnoozeUntil(),
  ])

  if (!settings.isEnabled) return 'none'

  // 全域 Snooze 生效：snoozeUntil > 0 且尚未過期 → 全部放行
  if (snoozeUntil > 0 && Date.now() < snoozeUntil) return 'none'

  // 計時器暫停封鎖 (Free Time Mode)
  if (settings.timerPausesBlocking && timerState.isActive) return 'none'

  // 終極專注模式 (Whitelist-Only Mode)
  // 當計時器進行中，且開啟了「嚴格模式」(isSnoozeHidden)，除了白名單之外的網站全數封鎖
  if (settings.isSnoozeHidden && timerState.isActive) {
    const blocklist = await StorageService.getBlocklist()
    const levels = extractDomainLevels(url)
    const whiteList = blocklist.filter((e) => e.type === 'white')
    
    // 檢查是否命中白名單
    for (const level of levels) {
      if (whiteList.some((e) => e.domain === level)) {
        return 'white' // 命中白名單，放行
      }
    }
    
    // 如果未命中白名單，無條件封鎖
    return 'locked'
  }

  return checkBlock(url)
}

/**
 * 取得網域列表（供 Popup 顯示當前分頁可選層次）
 */
export function getUrlDomainOptions(url: string): string[] {
  return extractDomainLevels(url)
}

/**
 * 快速取得基礎網域（e.g., 'youtube.com'）
 */
export function getBaseDomain(url: string): string {
  const levels = extractDomainLevels(url)
  return levels[levels.length - 1] ?? ''
}

/**
 * 快速加入：加入基礎網域至鎖定名單
 */
export async function quickAddLock(url: string): Promise<BlockListEntry | null> {
  const domain = getBaseDomain(url)
  if (!domain) return null
  return StorageService.addBlockEntry({ domain, type: 'locked' })
}

/**
 * 快速加入：加入基礎網域至白名單
 */
export async function quickAddWhite(url: string): Promise<BlockListEntry | null> {
  const domain = getBaseDomain(url)
  if (!domain) return null
  return StorageService.addBlockEntry({ domain, type: 'white' })
}
