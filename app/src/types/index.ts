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
  daily: Record<string, number> // "YYYY-MM-DD" -> ms
}

export interface AppSettings {
  isEnabled: boolean
  snoozeDuration: number // minutes
  isSnoozeHidden: boolean
  blockerMessage: string
  installDate: string // "YYYY-MM-DD"
  timerPausesBlocking: boolean // 計時中是否暫停封鎖（預設 false = 繼續封鎖）
  showNotifications: boolean // 計時結束通知
  language: 'en' | 'zh-TW' | 'ja' | 'auto' // 使用者語系偏好
}

export interface TimerState {
  isActive: boolean
  lastInputMin: number
  endTime?: number
}

export type BlockStatus = 'white' | 'locked' | 'none'

export type MessageType =
  | { type: 'GET_STATUS'; url: string }
  | { type: 'SET_TIMER'; minutes: number }
  | { type: 'CANCEL_TIMER' }
  | { type: 'ADD_BLOCK'; entry: Omit<BlockListEntry, 'id' | 'createdAt'> }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'GET_TIME_STATS'; dateRange: string[] }
  | { type: 'EXPORT_DATA' }
  | { type: 'IMPORT_DATA'; data: unknown }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'SNOOZE'; minutes: number }
  | { type: 'STOP_FOR_THIS_TIME' }
  | { type: 'GET_SETTINGS' }
  | { type: 'GET_BLOCKLIST' }
  | { type: 'GET_TIMER_STATE' }

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  isEnabled: true,
  snoozeDuration: 5,
  isSnoozeHidden: false,
  blockerMessage: 'You shall not pass! 🧙‍♂️',
  installDate: new Date().toISOString().slice(0, 10),
  timerPausesBlocking: false,
  showNotifications: true,
  language: 'auto',
}

export const DEFAULT_TIMER_STATE: TimerState = {
  isActive: false,
  lastInputMin: 25,
}
