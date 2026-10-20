// src/utils/block.ts
// 封鎖判斷的純邏輯（不經過 Service Worker）
// background、content script、popup 共用：各自讀 chrome.storage.local 後呼叫 evaluateBlock

import type { AppSettings, BlockListEntry, BlockStatus, TimerState } from '@/types'
import { DEFAULT_SETTINGS, DEFAULT_TIMER_STATE } from '@/types'
import { extractDomainLevels } from './domain'

export interface BlockState {
  settings: AppSettings
  timer: TimerState
  snoozeUntil: number
  blocklist: BlockListEntry[]
}

/** 判斷封鎖所需的 storage key；其他 key（例如 time:*）變動時不必重新判斷 */
export const BLOCK_STATE_KEYS = ['settings', 'timerState', 'snoozeUntil', 'blocklist'] as const

/** 將 storage 原始值補上預設值 */
export function toBlockState(raw: Record<string, unknown>): BlockState {
  return {
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings as Partial<AppSettings> | undefined) },
    timer: { ...DEFAULT_TIMER_STATE, ...(raw.timerState as Partial<TimerState> | undefined) },
    snoozeUntil: (raw.snoozeUntil as number | undefined) ?? 0,
    blocklist: (raw.blocklist as BlockListEntry[] | undefined) ?? [],
  }
}

export async function readBlockState(): Promise<BlockState> {
  return toBlockState(await chrome.storage.local.get([...BLOCK_STATE_KEYS]))
}

function matches(list: BlockListEntry[], type: BlockListEntry['type'], levels: string[]): boolean {
  return list.some((e) => e.type === type && levels.includes(e.domain))
}

/** 封鎖是否暫停中（封鎖頁的「休息」或 popup 的「暫停封鎖」） */
export function isBlockingPaused(state: BlockState, now: number = Date.now()): boolean {
  return state.snoozeUntil > 0 && now < state.snoozeUntil
}

/**
 * 封鎖判斷，優先順序：
 * 1. 封鎖暫停中 → 放行
 * 2. 永遠允許（白名單）→ 放行（任何模式下皆優先）
 * 3. 只允許白名單模式且計時中 → 其他網站全部封鎖
 * 4. 自由時間模式且計時中 → 放行
 * 5. 封鎖名單 → 封鎖
 */
export function evaluateBlock(state: BlockState, url: string, now: number = Date.now()): BlockStatus {
  const { settings, timer, blocklist } = state
  if (isBlockingPaused(state, now)) return 'none'

  const levels = extractDomainLevels(url)
  if (levels.length === 0) return 'none'

  if (matches(blocklist, 'white', levels)) return 'white'
  if (settings.focusWhitelistOnly && timer.isActive) return 'locked'
  if (settings.timerPausesBlocking && timer.isActive) return 'none'
  if (matches(blocklist, 'locked', levels)) return 'locked'
  return 'none'
}

/** 被封鎖的原因（封鎖頁顯示用）；呼叫前應已確認 evaluateBlock === 'locked' */
export function blockReason(state: BlockState, url: string): 'focus-whitelist' | 'blocklist' {
  const { settings, timer, blocklist } = state
  const listed = matches(blocklist, 'locked', extractDomainLevels(url))
  return settings.focusWhitelistOnly && timer.isActive && !listed ? 'focus-whitelist' : 'blocklist'
}
