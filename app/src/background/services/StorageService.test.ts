import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDateKey, recentDateKeys } from '@/utils/date'

// 最小的 chrome.storage.local 記憶體實作
let data: Record<string, unknown> = {}
const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)))
const local = {
  async get(keys: string | string[] | null) {
    if (keys === null) return clone(data)
    const out: Record<string, unknown> = {}
    for (const k of Array.isArray(keys) ? keys : [keys]) if (k in data) out[k] = clone(data[k])
    return out
  },
  async set(items: Record<string, unknown>) {
    Object.assign(data, clone(items))
  },
  async remove(keys: string | string[]) {
    for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k]
  },
  async clear() {
    data = {}
  },
}
vi.stubGlobal('chrome', { storage: { local } })

const { StorageService, TIME_RETENTION_DAYS } = await import('./StorageService')

const today = localDateKey()
const [yesterday] = recentDateKeys(2)
const tooOld = recentDateKeys(TIME_RETENTION_DAYS + 5)[0]

beforeEach(() => {
  data = {}
})

describe('per-day time records', () => {
  it('writes only the key for the given day', async () => {
    await StorageService.recordTime('a.com', 1000)
    await StorageService.recordTime('a.com', 500)
    await StorageService.recordTime('b.com', 200, yesterday)
    expect(data[`time:${today}`]).toEqual({ 'a.com': 1500 })
    expect(data[`time:${yesterday}`]).toEqual({ 'b.com': 200 })
  })

  it('does not lose concurrent writes', async () => {
    await Promise.all(Array.from({ length: 20 }, () => StorageService.recordTime('a.com', 100)))
    expect(data[`time:${today}`]).toEqual({ 'a.com': 2000 })
  })

  it('returns only requested days that have data', async () => {
    data[`time:${today}`] = { 'a.com': 1 }
    expect(await StorageService.getTimeByDay([yesterday, today])).toEqual({ [today]: { 'a.com': 1 } })
  })

  it('prunes days older than the retention window', async () => {
    data[`time:${today}`] = { 'a.com': 1 }
    data[`time:${tooOld}`] = { 'a.com': 1 }
    data.settings = { language: 'en' }
    await StorageService.pruneTimeRecords()
    expect(Object.keys(data).sort()).toEqual(['settings', `time:${today}`])
  })
})

describe('day stats', () => {
  it('increments counters for the given day', async () => {
    await StorageService.incrementDayStats({ blocks: 1 })
    await StorageService.incrementDayStats({ blocks: 1, focusSessions: 1, focusMs: 1500 })
    expect(await StorageService.getStatsByDay([today])).toEqual({
      [today]: { blocks: 2, focusSessions: 1, focusMs: 1500 },
    })
  })

  it('prunes old stats together with time records', async () => {
    data[`stats:${tooOld}`] = { blocks: 1, focusSessions: 0, focusMs: 0 }
    data[`stats:${today}`] = { blocks: 1, focusSessions: 0, focusMs: 0 }
    await StorageService.pruneTimeRecords()
    expect(Object.keys(data)).toEqual([`stats:${today}`])
  })
})

describe('seedDefaultBlocklist', () => {
  it('adds the default distracting sites to an empty list', async () => {
    await StorageService.seedDefaultBlocklist()
    const list = await StorageService.getBlocklist()
    expect(list.map((e) => e.domain)).toContain('youtube.com')
    expect(list.every((e) => e.type === 'locked')).toBe(true)
  })

  it('leaves an existing list alone', async () => {
    data.blocklist = [{ id: '1', domain: 'a.com', type: 'locked', createdAt: 0 }]
    await StorageService.seedDefaultBlocklist()
    expect(await StorageService.getBlocklist()).toHaveLength(1)
  })
})

describe('migrateLegacyTimeRecords', () => {
  it('splits the legacy blob into per-day keys and merges existing data', async () => {
    data.timeRecords = {
      'a.com': { domain: 'a.com', total: 3000, daily: { [today]: 1000, [yesterday]: 2000, [tooOld]: 9 } },
      'b.com': { domain: 'b.com', total: 50, daily: { [today]: 50 } },
    }
    data[`time:${today}`] = { 'a.com': 1 }

    await StorageService.migrateLegacyTimeRecords()

    expect(data.timeRecords).toBeUndefined()
    expect(data[`time:${today}`]).toEqual({ 'a.com': 1001, 'b.com': 50 })
    expect(data[`time:${yesterday}`]).toEqual({ 'a.com': 2000 })
    expect(data[`time:${tooOld}`]).toBeUndefined()
  })

  it('is a no-op without legacy data', async () => {
    data[`time:${today}`] = { 'a.com': 1 }
    await StorageService.migrateLegacyTimeRecords()
    expect(data).toEqual({ [`time:${today}`]: { 'a.com': 1 } })
  })
})

describe('importAll', () => {
  it('accepts the new timeByDay format and replaces existing time data', async () => {
    data[`time:${yesterday}`] = { 'old.com': 1 }
    await StorageService.importAll({ timeByDay: { [today]: { 'a.com': 10, bad: -1 }, nope: {} } })
    expect(data[`time:${today}`]).toEqual({ 'a.com': 10 })
    expect(data[`time:${yesterday}`]).toBeUndefined()
  })

  it('accepts legacy v2.0 backups', async () => {
    await StorageService.importAll({ timeRecords: { 'a.com': { total: 5, daily: { [today]: 5 } } } })
    expect(data[`time:${today}`]).toEqual({ 'a.com': 5 })
  })

  it('round-trips through exportAll', async () => {
    await StorageService.recordTime('a.com', 42)
    await StorageService.incrementDayStats({ blocks: 3 })
    const backup = await StorageService.exportAll()
    data = {}
    await StorageService.importAll(backup)
    expect(data[`time:${today}`]).toEqual({ 'a.com': 42 })
    expect(data[`stats:${today}`]).toEqual({ blocks: 3, focusSessions: 0, focusMs: 0 })
  })

  it('rejects non-Limina data without writing', async () => {
    await expect(StorageService.importAll({ foo: 1 })).rejects.toThrow()
    expect(data).toEqual({})
  })
})
