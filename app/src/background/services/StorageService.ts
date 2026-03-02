// src/background/services/StorageService.ts
// 封裝 chrome.storage.local，所有資料以 JSON 格式儲存

import type {
  BlockListEntry,
  TimeRecord,
  AppSettings,
  TimerState,
} from '@/types'
import {
  DEFAULT_SETTINGS,
  DEFAULT_TIMER_STATE,
} from '@/types'

const KEYS = {
  BLOCKLIST: 'blocklist',
  SETTINGS: 'settings',
  TIMER: 'timerState',
  TIME_RECORDS: 'timeRecords',
  SNOOZE_UNTIL: 'snoozeUntil', // Unix timestamp，0 = 無 snooze
} as const

export const StorageService = {
  // ─── BlockList ───────────────────────────────────────────
  async getBlocklist(): Promise<BlockListEntry[]> {
    const result = await chrome.storage.local.get(KEYS.BLOCKLIST)
    return (result[KEYS.BLOCKLIST] as BlockListEntry[]) ?? []
  },

  async setBlocklist(list: BlockListEntry[]): Promise<void> {
    await chrome.storage.local.set({ [KEYS.BLOCKLIST]: list })
  },

  async addBlockEntry(
    entry: Omit<BlockListEntry, 'id' | 'createdAt'>,
  ): Promise<BlockListEntry> {
    const list = await this.getBlocklist()
    // 避免重複
    const exists = list.find(
      (e) => e.domain === entry.domain && e.type === entry.type,
    )
    if (exists) return exists
    const newEntry: BlockListEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    }
    await this.setBlocklist([...list, newEntry])
    return newEntry
  },

  async removeBlockEntry(id: string): Promise<void> {
    const list = await this.getBlocklist()
    await this.setBlocklist(list.filter((e) => e.id !== id))
  },

  // ─── Settings ────────────────────────────────────────────
  async getSettings(): Promise<AppSettings> {
    const result = await chrome.storage.local.get(KEYS.SETTINGS)
    return { ...DEFAULT_SETTINGS, ...(result[KEYS.SETTINGS] as Partial<AppSettings>) }
  },

  async updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings()
    await chrome.storage.local.set({ [KEYS.SETTINGS]: { ...current, ...patch } })
  },

  // ─── TimerState ──────────────────────────────────────────
  async getTimerState(): Promise<TimerState> {
    const result = await chrome.storage.local.get(KEYS.TIMER)
    return { ...DEFAULT_TIMER_STATE, ...(result[KEYS.TIMER] as Partial<TimerState>) }
  },

  async setTimerState(patch: Partial<TimerState>): Promise<void> {
    const current = await this.getTimerState()
    await chrome.storage.local.set({ [KEYS.TIMER]: { ...current, ...patch } })
  },

  // ─── TimeRecords ─────────────────────────────────────────
  async getTimeRecords(): Promise<Record<string, TimeRecord>> {
    const result = await chrome.storage.local.get(KEYS.TIME_RECORDS)
    return (result[KEYS.TIME_RECORDS] as Record<string, TimeRecord>) ?? {}
  },

  async setTimeRecords(records: Record<string, TimeRecord>): Promise<void> {
    await chrome.storage.local.set({ [KEYS.TIME_RECORDS]: records })
  },

  async recordTime(domain: string, ms: number): Promise<void> {
    const records = await this.getTimeRecords()
    const today = new Date().toISOString().slice(0, 10)
    const rec: TimeRecord = records[domain] ?? { domain, total: 0, daily: {} }
    rec.total += ms
    rec.daily[today] = (rec.daily[today] ?? 0) + ms
    records[domain] = rec
    await this.setTimeRecords(records)
  },

  // ─── Snooze ────────────────────────────────────────
  async getSnoozeUntil(): Promise<number> {
    const result = await chrome.storage.local.get(KEYS.SNOOZE_UNTIL)
    return (result[KEYS.SNOOZE_UNTIL] as number) ?? 0
  },

  async setSnoozeUntil(until: number): Promise<void> {
    await chrome.storage.local.set({ [KEYS.SNOOZE_UNTIL]: until })
  },

  async clearSnooze(): Promise<void> {
    await chrome.storage.local.remove(KEYS.SNOOZE_UNTIL)
  },

  // ─── Export / Import / Clear ─────────────────────────────
  async exportAll(): Promise<object> {
    const [blocklist, settings, timeRecords, timerState] = await Promise.all([
      this.getBlocklist(),
      this.getSettings(),
      this.getTimeRecords(),
      this.getTimerState(),
    ])
    return { blocklist, settings, timeRecords, timerState, exportedAt: new Date().toISOString() }
  },

  async importAll(data: unknown): Promise<void> {
    const d = data as {
      blocklist?: BlockListEntry[]
      settings?: Partial<AppSettings>
      timeRecords?: Record<string, TimeRecord>
    }
    if (d.blocklist) await this.setBlocklist(d.blocklist)
    if (d.settings) await this.updateSettings(d.settings)
    if (d.timeRecords) await this.setTimeRecords(d.timeRecords)
  },

  async clearAll(): Promise<void> {
    await chrome.storage.local.clear()
  },
}
