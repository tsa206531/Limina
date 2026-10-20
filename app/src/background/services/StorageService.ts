// src/background/services/StorageService.ts
// 封裝 chrome.storage.local，所有資料以 JSON 格式儲存

import type {
  AddBlockResult,
  BlockListEntry,
  TimeRecord,
  AppSettings,
  TimerState,
} from '@/types'
import {
  DEFAULT_SETTINGS,
  DEFAULT_TIMER_STATE,
  SNOOZE_MAX,
  SNOOZE_MIN,
  clampInt,
} from '@/types'
import { localDateKey } from '@/utils/date'

const KEYS = {
  BLOCKLIST: 'blocklist',
  SETTINGS: 'settings',
  TIMER: 'timerState',
  TIME_RECORDS: 'timeRecords',
  SNOOZE_UNTIL: 'snoozeUntil', // Unix timestamp，0 = 無 snooze
} as const

// 所有「讀出 → 修改 → 寫回」的操作排進同一條佇列，避免並發寫入互相覆蓋
let writeQueue: Promise<unknown> = Promise.resolve()
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task)
  writeQueue = run.catch(() => {})
  return run
}

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 只保留型別正確、且為已知欄位的設定值 */
function sanitizeSettings(raw: unknown): Partial<AppSettings> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, unknown> = {}
  for (const key of SETTINGS_KEYS) {
    if (key in raw && typeof raw[key] === typeof DEFAULT_SETTINGS[key]) {
      out[key] = raw[key]
    }
  }
  if ('snoozeDuration' in out) {
    out.snoozeDuration = clampInt(out.snoozeDuration, SNOOZE_MIN, SNOOZE_MAX, DEFAULT_SETTINGS.snoozeDuration)
  }
  if (typeof out.blockerMessage === 'string') {
    out.blockerMessage = out.blockerMessage.slice(0, 100)
  }
  if ('language' in out && !['auto', 'en', 'zh-TW', 'ja'].includes(out.language as string)) {
    delete out.language
  }
  return out as Partial<AppSettings>
}

function sanitizeBlocklist(raw: unknown): BlockListEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is BlockListEntry =>
      isPlainObject(e) &&
      typeof e.id === 'string' &&
      typeof e.domain === 'string' &&
      (e.type === 'locked' || e.type === 'white') &&
      typeof e.createdAt === 'number',
  )
}

function sanitizeTimeRecords(raw: unknown): Record<string, TimeRecord> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, TimeRecord> = {}
  for (const [domain, rec] of Object.entries(raw)) {
    if (!isPlainObject(rec) || typeof rec.total !== 'number' || !isPlainObject(rec.daily)) continue
    const daily: Record<string, number> = {}
    for (const [day, ms] of Object.entries(rec.daily)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof ms === 'number' && ms >= 0) daily[day] = ms
    }
    out[domain] = { domain, total: rec.total, daily }
  }
  return out
}

export const StorageService = {
  // ─── BlockList ───────────────────────────────────────────
  async getBlocklist(): Promise<BlockListEntry[]> {
    const result = await chrome.storage.local.get(KEYS.BLOCKLIST)
    return (result[KEYS.BLOCKLIST] as BlockListEntry[]) ?? []
  },

  async setBlocklist(list: BlockListEntry[]): Promise<void> {
    await chrome.storage.local.set({ [KEYS.BLOCKLIST]: list })
  },

  /**
   * 加入名單項目。
   * - 同名單已存在 → created: false
   * - 存在於另一份名單 → 從另一份移除（同一網域不可同時被鎖定與放行）
   */
  addBlockEntry(
    entry: Omit<BlockListEntry, 'id' | 'createdAt'>,
  ): Promise<AddBlockResult> {
    return serialize(async () => {
      const list = await this.getBlocklist()
      const exists = list.find(
        (e) => e.domain === entry.domain && e.type === entry.type,
      )
      if (exists) return { entry: exists, created: false }
      const newEntry: BlockListEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      }
      const rest = list.filter((e) => e.domain !== entry.domain)
      await this.setBlocklist([...rest, newEntry])
      return { entry: newEntry, created: true }
    })
  },

  removeBlockEntry(id: string): Promise<void> {
    return serialize(async () => {
      const list = await this.getBlocklist()
      await this.setBlocklist(list.filter((e) => e.id !== id))
    })
  },

  // ─── Settings ────────────────────────────────────────────
  async getSettings(): Promise<AppSettings> {
    const result = await chrome.storage.local.get(KEYS.SETTINGS)
    return { ...DEFAULT_SETTINGS, ...(result[KEYS.SETTINGS] as Partial<AppSettings>) }
  },

  updateSettings(patch: Partial<AppSettings>): Promise<void> {
    return serialize(async () => {
      const current = await this.getSettings()
      await chrome.storage.local.set({
        [KEYS.SETTINGS]: { ...current, ...sanitizeSettings(patch) },
      })
    })
  },

  // ─── TimerState ──────────────────────────────────────────
  async getTimerState(): Promise<TimerState> {
    const result = await chrome.storage.local.get(KEYS.TIMER)
    return { ...DEFAULT_TIMER_STATE, ...(result[KEYS.TIMER] as Partial<TimerState>) }
  },

  setTimerState(patch: Partial<TimerState>): Promise<void> {
    return serialize(async () => {
      const current = await this.getTimerState()
      await chrome.storage.local.set({ [KEYS.TIMER]: { ...current, ...patch } })
    })
  },

  // ─── TimeRecords ─────────────────────────────────────────
  async getTimeRecords(): Promise<Record<string, TimeRecord>> {
    const result = await chrome.storage.local.get(KEYS.TIME_RECORDS)
    return (result[KEYS.TIME_RECORDS] as Record<string, TimeRecord>) ?? {}
  },

  async setTimeRecords(records: Record<string, TimeRecord>): Promise<void> {
    await chrome.storage.local.set({ [KEYS.TIME_RECORDS]: records })
  },

  /** @param day 記錄歸屬的本地日期 key，預設為今天 */
  recordTime(domain: string, ms: number, day: string = localDateKey()): Promise<void> {
    return serialize(async () => {
      const records = await this.getTimeRecords()
      const rec: TimeRecord = records[domain] ?? { domain, total: 0, daily: {} }
      rec.total += ms
      rec.daily[day] = (rec.daily[day] ?? 0) + ms
      records[domain] = rec
      await this.setTimeRecords(records)
    })
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
    const [blocklist, settings, timeRecords] = await Promise.all([
      this.getBlocklist(),
      this.getSettings(),
      this.getTimeRecords(),
    ])
    return { blocklist, settings, timeRecords, exportedAt: new Date().toISOString() }
  },

  /** 驗證後覆蓋匯入；格式錯誤時拋出例外，不寫入任何資料 */
  importAll(data: unknown): Promise<void> {
    return serialize(async () => {
      if (!isPlainObject(data)) throw new Error('Invalid backup format')
      const hasAny = 'blocklist' in data || 'settings' in data || 'timeRecords' in data
      if (!hasAny) throw new Error('Backup contains no Limina data')

      const patch: Record<string, unknown> = {}
      if ('blocklist' in data) patch[KEYS.BLOCKLIST] = sanitizeBlocklist(data.blocklist)
      if ('timeRecords' in data) patch[KEYS.TIME_RECORDS] = sanitizeTimeRecords(data.timeRecords)
      if ('settings' in data) {
        const current = await this.getSettings()
        patch[KEYS.SETTINGS] = { ...current, ...sanitizeSettings(data.settings) }
      }
      await chrome.storage.local.set(patch)
    })
  },

  clearAll(): Promise<void> {
    return serialize(async () => {
      // 保留安裝日期，其他全部清除
      const { installDate } = await this.getSettings()
      await chrome.storage.local.clear()
      await chrome.storage.local.set({ [KEYS.SETTINGS]: { ...DEFAULT_SETTINGS, installDate } })
    })
  },
}
