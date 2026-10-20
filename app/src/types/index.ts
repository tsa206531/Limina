// src/types/index.ts
// Limina 2.0 — 共用型別定義

export interface BlockListEntry {
  id: string
  domain: string
  type: 'locked' | 'white'
  createdAt: number // Unix timestamp
}

export interface TimeRecord {
  domain: string
  total: number // ms
  daily: Record<string, number> // 本地日期 "YYYY-MM-DD" -> ms
}

export interface AppSettings {
  isEnabled: boolean
  snoozeDuration: number // minutes（1–60）
  isSnoozeHidden: boolean // 封鎖頁隱藏 snooze 按鈕
  focusWhitelistOnly: boolean // 計時中僅允許白名單（終極專注模式）
  blockerMessage: string
  installDate: string // "YYYY-MM-DD"
  timerPausesBlocking: boolean // 計時中是否暫停封鎖（預設 false = 繼續封鎖）
  showNotifications: boolean // 計時結束通知
  language: 'en' | 'zh-TW' | 'ja' | 'auto' // 使用者語系偏好
}

export interface TimerState {
  isActive: boolean // 倒數進行中（暫停時為 false）
  lastInputMin: number
  endTime?: number
  totalMs?: number // 本次計時總長（含 +5 分鐘），供進度環使用
  pausedRemainingMs?: number // 暫停中時的剩餘時間；有值代表處於暫停狀態
}

export type BlockStatus = 'white' | 'locked' | 'none'

export type MessageType =
  | { type: 'GET_STATUS'; url: string }
  | { type: 'SET_TIMER'; minutes: number }
  | { type: 'CANCEL_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'EXTEND_TIMER'; minutes: number }
  | { type: 'ADD_BLOCK'; entry: Omit<BlockListEntry, 'id' | 'createdAt'> }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'GET_TIME_STATS' }
  | { type: 'EXPORT_DATA' }
  | { type: 'IMPORT_DATA'; data: unknown }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'SNOOZE'; minutes: number }
  | { type: 'CLOSE_TAB' }
  | { type: 'GET_SETTINGS' }
  | { type: 'GET_BLOCKLIST' }
  | { type: 'GET_TIMER_STATE' }

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
  isEnabled: true,
  snoozeDuration: 5,
  isSnoozeHidden: false,
  focusWhitelistOnly: false,
  blockerMessage: 'You shall not pass! 🧙‍♂️',
  installDate: '', // 於 onInstalled 時寫入
  timerPausesBlocking: false,
  showNotifications: true,
  language: 'auto',
}

export const DEFAULT_TIMER_STATE: TimerState = {
  isActive: false,
  lastInputMin: 25,
}

export const SNOOZE_MIN = 1
export const SNOOZE_MAX = 60
export const TIMER_MIN = 1
export const TIMER_MAX = 999

/** 將任意輸入轉為 [min, max] 範圍內的整數；無法解析時回傳 fallback */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
