// src/types/index.ts
// Limina 2.0 — 共用型別定義

export interface BlockListEntry {
  id: string
  domain: string
  type: 'locked' | 'white'
  createdAt: number // Unix timestamp
}

/** 單日各網域停留時間：domain -> ms */
export type DailyTime = Record<string, number>

/** 本地日期 "YYYY-MM-DD" -> 當日各網域停留時間 */
export type TimeByDay = Record<string, DailyTime>

/** 單日計數 */
export interface DayStats {
  blocks: number // 封鎖頁被觸發的次數
  focusSessions: number // 完成的專注時段數
  focusMs: number // 完成的專注時段總長
}

/** 本地日期 "YYYY-MM-DD" -> 當日計數 */
export type StatsByDay = Record<string, DayStats>

export interface AppSettings {
  snoozeDuration: number // minutes（1–60）
  isSnoozeHidden: boolean // 封鎖頁隱藏「休息」按鈕
  focusWhitelistOnly: boolean // 計時中僅允許白名單
  blockerMessage: string // 空字串 = 使用語系預設訊息
  installDate: string // "YYYY-MM-DD"
  timerPausesBlocking: boolean // 計時中暫停所有封鎖
  showNotifications: boolean // 計時結束通知
  language: 'en' | 'zh-TW' | 'ja' | 'auto' // 使用者語系偏好
}

/**
 * 專注時段的封鎖方式（開始計時前選擇）
 * - blocklist：照封鎖名單擋（預設）
 * - whitelist：只允許「永遠允許」名單
 * - free：計時中不擋任何網站
 */
export type FocusMode = 'blocklist' | 'whitelist' | 'free'

export function focusModeOf(s: Pick<AppSettings, 'focusWhitelistOnly' | 'timerPausesBlocking'>): FocusMode {
  if (s.focusWhitelistOnly) return 'whitelist'
  if (s.timerPausesBlocking) return 'free'
  return 'blocklist'
}

export function settingsForMode(mode: FocusMode): Pick<AppSettings, 'focusWhitelistOnly' | 'timerPausesBlocking'> {
  return { focusWhitelistOnly: mode === 'whitelist', timerPausesBlocking: mode === 'free' }
}

export interface TimerState {
  isActive: boolean // 倒數進行中（暫停時為 false）
  lastInputMin: number
  endTime?: number
  totalMs?: number // 本次計時總長（含 +5 分鐘），供進度環使用
  pausedRemainingMs?: number // 暫停中時的剩餘時間；有值代表處於暫停狀態
  lastSession?: { completedAt: number; ms: number } // 最近一次完成的專注時段（popup 顯示完成卡片用）
}

export type BlockStatus = 'white' | 'locked' | 'none'

export type MessageType =
  | { type: 'SET_TIMER'; minutes: number }
  | { type: 'CANCEL_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'EXTEND_TIMER'; minutes: number }
  | { type: 'DISMISS_SESSION' }
  | { type: 'ADD_BLOCK'; entry: Omit<BlockListEntry, 'id' | 'createdAt'> }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'GET_TIME_STATS'; days: number }
  | { type: 'EXPORT_DATA' }
  | { type: 'IMPORT_DATA'; data: unknown }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'SNOOZE'; minutes?: number; until?: number } // 暫停封鎖（封鎖頁的「休息」與 popup 的「暫停封鎖」共用）
  | { type: 'RESUME_BLOCKING' }
  | { type: 'BLOCK_HIT' }
  | { type: 'CLOSE_TAB' }

export interface AddBlockResult {
  entry: BlockListEntry
  created: boolean // false = 已存在於同一名單
}

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  snoozeDuration: 5,
  isSnoozeHidden: false,
  focusWhitelistOnly: false,
  blockerMessage: '',
  installDate: '', // 於 onInstalled 時寫入
  timerPausesBlocking: false,
  showNotifications: true,
  language: 'auto',
}

export const DEFAULT_TIMER_STATE: TimerState = {
  isActive: false,
  lastInputMin: 25,
}

export const EMPTY_DAY_STATS: DayStats = { blocks: 0, focusSessions: 0, focusMs: 0 }

/** 安裝時預設加入封鎖名單的常見分心網站 */
export const DEFAULT_BLOCKED_DOMAINS = [
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'x.com',
  'reddit.com',
  'threads.com',
  'threads.net',
  'dcard.tw',
]

export const SNOOZE_MIN = 1
export const SNOOZE_MAX = 60
export const TIMER_MIN = 1
export const TIMER_MAX = 999
export const TIMER_PRESETS = [15, 25, 45, 60]

/** 將任意輸入轉為 [min, max] 範圍內的整數；無法解析時回傳 fallback */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
