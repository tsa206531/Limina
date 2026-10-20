// src/background/services/StorageService.ts
// 封裝 chrome.storage.local，所有資料以 JSON 格式儲存

import type {
  AddBlockResult,
  BlockListEntry,
  AppSettings,
  DailyTime,
  DayStats,
  StatsByDay,
  TimeByDay,
  TimerState,
} from '@/types'
import {
  DEFAULT_BLOCKED_DOMAINS,
  DEFAULT_SETTINGS,
  DEFAULT_TIMER_STATE,
  EMPTY_DAY_STATS,
  SNOOZE_MAX,
  SNOOZE_MIN,
  clampInt,
} from '@/types'
import { localDateKey, recentDateKeys } from '@/utils/date'

export const KEYS = {
  BLOCKLIST: 'blocklist',
  SETTINGS: 'settings',
  TIMER: 'timerState',
  SNOOZE_UNTIL: 'snoozeUntil', // Unix timestamp，0 = 無 snooze
  LEGACY_TIME_RECORDS: 'timeRecords', // v2.0 舊格式：所有網域 × 所有日期放在同一個 key
} as const

/**
 * 停留時間依「日」分 key 儲存：time:YYYY-MM-DD -> { domain: ms }
 * 每次寫入只動當天那一小筆，storage.onChanged 廣播的資料量也只有一天
 */
export const TIME_KEY_PREFIX = 'time:'
/** 每日計數：stats:YYYY-MM-DD -> DayStats */
export const STATS_KEY_PREFIX = 'stats:'
export const TIME_RETENTION_DAYS = 90

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
const timeKey = (day: string) => `${TIME_KEY_PREFIX}${day}`
const statsKey = (day: string) => `${STATS_KEY_PREFIX}${day}`

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

function sanitizeDaily(raw: unknown): DailyTime {
  const out: DailyTime = {}
  if (!isPlainObject(raw)) return out
  for (const [domain, ms] of Object.entries(raw)) {
    if (typeof ms === 'number' && ms > 0) out[domain] = ms
  }
  return out
}

/** 新格式：{ "YYYY-MM-DD": { domain: ms } } */
function sanitizeTimeByDay(raw: unknown): TimeByDay {
  const out: TimeByDay = {}
  if (!isPlainObject(raw)) return out
  for (const [day, daily] of Object.entries(raw)) {
    if (!DATE_KEY.test(day)) continue
    const clean = sanitizeDaily(daily)
    if (Object.keys(clean).length > 0) out[day] = clean
  }
  return out
}

/** 舊格式：{ domain: { total, daily: { "YYYY-MM-DD": ms } } } → 新格式 */
function legacyToTimeByDay(raw: unknown): TimeByDay {
  const out: TimeByDay = {}
  if (!isPlainObject(raw)) return out
  for (const [domain, rec] of Object.entries(raw)) {
    if (!isPlainObject(rec) || !isPlainObject(rec.daily)) continue
    for (const [day, ms] of Object.entries(rec.daily)) {
      if (!DATE_KEY.test(day) || typeof ms !== 'number' || ms <= 0) continue
      ;(out[day] ??= {})[domain] = ms
    }
  }
  return out
}

function sanitizeDayStats(raw: unknown): DayStats | null {
  if (!isPlainObject(raw)) return null
  const n = (v: unknown) => (typeof v === 'number' && v >= 0 ? v : 0)
  const out = { blocks: n(raw.blocks), focusSessions: n(raw.focusSessions), focusMs: n(raw.focusMs) }
  return out.blocks || out.focusSessions || out.focusMs ? out : null
}

function sanitizeStatsByDay(raw: unknown): StatsByDay {
  const out: StatsByDay = {}
  if (!isPlainObject(raw)) return out
  for (const [day, stats] of Object.entries(raw)) {
    const clean = DATE_KEY.test(day) ? sanitizeDayStats(stats) : null
    if (clean) out[day] = clean
  }
  return out
}

function oldestKeptDay(): string {
  return recentDateKeys(TIME_RETENTION_DAYS)[0]
}

/** 列出所有每日資料的 key（time:* 與 stats:*） */
async function listDayKeys(): Promise<string[]> {
  const local = chrome.storage.local as chrome.storage.LocalStorageArea & {
    getKeys?: () => Promise<string[]>
  }
  // getKeys（Chrome 130+）只取 key，不必把所有資料讀進記憶體
  const keys = local.getKeys ? await local.getKeys() : Object.keys(await local.get(null))
  return keys.filter((k) => k.startsWith(TIME_KEY_PREFIX) || k.startsWith(STATS_KEY_PREFIX))
}

const dayOfKey = (key: string) => key.slice(key.indexOf(':') + 1)

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

  /** 首次安裝：名單為空時加入常見分心網站，讓使用者一裝好就有效果 */
  seedDefaultBlocklist(): Promise<void> {
    return serialize(async () => {
      if ((await this.getBlocklist()).length > 0) return
      const now = Date.now()
      await this.setBlocklist(
        DEFAULT_BLOCKED_DOMAINS.map((domain, i) => ({
          id: `default-${i}-${domain}`,
          domain,
          type: 'locked' as const,
          createdAt: now,
        })),
      )
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

  // ─── 停留時間（每日一筆）─────────────────────────────────
  /** 讀取指定日期的資料；沒有資料的日期不會出現在結果中 */
  async getTimeByDay(days: string[]): Promise<TimeByDay> {
    const result = await chrome.storage.local.get(days.map(timeKey))
    const out: TimeByDay = {}
    for (const day of days) {
      const daily = result[timeKey(day)] as DailyTime | undefined
      if (daily) out[day] = daily
    }
    return out
  },

  /** @param day 記錄歸屬的本地日期 key，預設為今天 */
  recordTime(domain: string, ms: number, day: string = localDateKey()): Promise<void> {
    return serialize(async () => {
      const key = timeKey(day)
      const result = await chrome.storage.local.get(key)
      const daily = (result[key] as DailyTime | undefined) ?? {}
      daily[domain] = (daily[domain] ?? 0) + ms
      await chrome.storage.local.set({ [key]: daily })
    })
  },

  // ─── 每日計數 ────────────────────────────────────────────
  async getStatsByDay(days: string[]): Promise<StatsByDay> {
    const result = await chrome.storage.local.get(days.map(statsKey))
    const out: StatsByDay = {}
    for (const day of days) {
      const stats = result[statsKey(day)] as DayStats | undefined
      if (stats) out[day] = { ...EMPTY_DAY_STATS, ...stats }
    }
    return out
  },

  incrementDayStats(delta: Partial<DayStats>, day: string = localDateKey()): Promise<void> {
    return serialize(async () => {
      const key = statsKey(day)
      const result = await chrome.storage.local.get(key)
      const stats: DayStats = { ...EMPTY_DAY_STATS, ...(result[key] as DayStats | undefined) }
      for (const [k, v] of Object.entries(delta) as [keyof DayStats, number][]) stats[k] += v
      await chrome.storage.local.set({ [key]: stats })
    })
  },

  /** 刪除超過保留天數的每日資料（停留時間與計數） */
  pruneTimeRecords(): Promise<void> {
    return serialize(async () => {
      const oldest = oldestKeptDay()
      const stale = (await listDayKeys()).filter((k) => dayOfKey(k) < oldest)
      if (stale.length > 0) await chrome.storage.local.remove(stale)
    })
  },

  /** v2.0 舊格式（單一 timeRecords key）轉為每日一筆，並與已存在的新資料合併 */
  migrateLegacyTimeRecords(): Promise<void> {
    return serialize(async () => {
      const result = await chrome.storage.local.get(KEYS.LEGACY_TIME_RECORDS)
      if (!(KEYS.LEGACY_TIME_RECORDS in result)) return

      const legacy = legacyToTimeByDay(result[KEYS.LEGACY_TIME_RECORDS])
      const oldest = oldestKeptDay()
      const days = Object.keys(legacy).filter((d) => d >= oldest)
      const existing = await this.getTimeByDay(days)

      const patch: Record<string, DailyTime> = {}
      for (const day of days) {
        const merged = { ...existing[day] }
        for (const [domain, ms] of Object.entries(legacy[day])) {
          merged[domain] = (merged[domain] ?? 0) + ms
        }
        patch[timeKey(day)] = merged
      }
      if (days.length > 0) await chrome.storage.local.set(patch)
      await chrome.storage.local.remove(KEYS.LEGACY_TIME_RECORDS)
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
    const days = recentDateKeys(TIME_RETENTION_DAYS)
    const [blocklist, settings, timeByDay, statsByDay] = await Promise.all([
      this.getBlocklist(),
      this.getSettings(),
      this.getTimeByDay(days),
      this.getStatsByDay(days),
    ])
    return { version: 2, blocklist, settings, timeByDay, statsByDay, exportedAt: new Date().toISOString() }
  },

  /**
   * 驗證後覆蓋匯入；格式錯誤時拋出例外，不寫入任何資料
   * 接受新格式 timeByDay / statsByDay 與 v2.0 舊格式 timeRecords
   */
  importAll(data: unknown): Promise<void> {
    return serialize(async () => {
      if (!isPlainObject(data)) throw new Error('Invalid backup format')
      const hasTime = 'timeByDay' in data || 'timeRecords' in data
      const hasStats = 'statsByDay' in data
      if (!('blocklist' in data) && !('settings' in data) && !hasTime && !hasStats) {
        throw new Error('Backup contains no Limina data')
      }

      const patch: Record<string, unknown> = {}
      if ('blocklist' in data) patch[KEYS.BLOCKLIST] = sanitizeBlocklist(data.blocklist)
      if ('settings' in data) {
        const current = await this.getSettings()
        patch[KEYS.SETTINGS] = { ...current, ...sanitizeSettings(data.settings) }
      }
      if (hasTime) {
        const byDay = 'timeByDay' in data
          ? sanitizeTimeByDay(data.timeByDay)
          : legacyToTimeByDay(data.timeRecords)
        const oldest = oldestKeptDay()
        for (const [day, daily] of Object.entries(byDay)) {
          if (day >= oldest) patch[timeKey(day)] = daily
        }
      }
      if (hasStats) {
        const oldest = oldestKeptDay()
        for (const [day, stats] of Object.entries(sanitizeStatsByDay(data.statsByDay))) {
          if (day >= oldest) patch[statsKey(day)] = stats
        }
      }
      if (hasTime || hasStats) {
        // 匯入的每日資料取代現有資料（只清掉備份中有提供的那一類）
        const existing = (await listDayKeys()).filter(
          (k) => (hasTime && k.startsWith(TIME_KEY_PREFIX)) || (hasStats && k.startsWith(STATS_KEY_PREFIX)),
        )
        await chrome.storage.local.remove([...existing, KEYS.LEGACY_TIME_RECORDS])
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
