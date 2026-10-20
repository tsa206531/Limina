import { describe, expect, it } from 'vitest'
import en from './en.json'
import ja from './ja.json'
import zhTW from './zh-TW.json'
import { formatDuration, translate } from './translate'

describe('formatDuration', () => {
  it('formats accumulated time (floor)', () => {
    expect(formatDuration('zh-TW', 30_000)).toBe('30 秒')
    expect(formatDuration('zh-TW', 45 * 60_000 + 59_000)).toBe('45 分')
    expect(formatDuration('en', 80 * 60_000)).toBe('1h 20m')
    expect(formatDuration('ja', 80 * 60_000)).toBe('1時間20分')
  })

  it('rounds remaining time up and never shows zero minutes', () => {
    expect(formatDuration('en', 1_000, 'ceil')).toBe('1m')
    expect(formatDuration('en', 4 * 60_000 + 1, 'ceil')).toBe('5m')
  })
})

describe('translate', () => {
  it('falls back to English, then to the key', () => {
    expect(translate('ja', 'nav.home')).toBe('集中')
    expect(translate('ja', 'does.not.exist')).toBe('does.not.exist')
  })

  it('interpolates params', () => {
    expect(translate('en', 'overlay.blockedToday', { n: 3 })).toBe('Blocked 3 times today')
  })
})

/** 所有語系必須有相同的 key，避免某個語言漏翻 */
function keysOf(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k)).sort()
}

describe('locale files', () => {
  it('have identical keys', () => {
    expect(keysOf(zhTW)).toEqual(keysOf(en))
    expect(keysOf(ja)).toEqual(keysOf(en))
  })
})
