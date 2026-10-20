import { describe, expect, it } from 'vitest'
import { localDateKey, parseDateKey } from './date'

describe('localDateKey', () => {
  it('uses the local calendar date, not UTC', () => {
    // 本地時間 00:30 — 在 UTC+ 時區用 toISOString 會得到前一天
    expect(localDateKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
    expect(localDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  it('round-trips with parseDateKey', () => {
    const d = parseDateKey('2026-03-09')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 9])
    expect(localDateKey(d)).toBe('2026-03-09')
  })
})
