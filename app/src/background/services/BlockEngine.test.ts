import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings, BlockListEntry, TimerState } from '@/types'
import { DEFAULT_SETTINGS, DEFAULT_TIMER_STATE } from '@/types'

const store = {
  settings: { ...DEFAULT_SETTINGS } as AppSettings,
  timer: { ...DEFAULT_TIMER_STATE } as TimerState,
  snoozeUntil: 0,
  blocklist: [] as BlockListEntry[],
}

vi.mock('./StorageService', () => ({
  StorageService: {
    getSettings: async () => store.settings,
    getTimerState: async () => store.timer,
    getSnoozeUntil: async () => store.snoozeUntil,
    getBlocklist: async () => store.blocklist,
  },
}))

const { checkBlockWithTimer } = await import('./BlockEngine')

const entry = (domain: string, type: 'locked' | 'white'): BlockListEntry =>
  ({ id: domain + type, domain, type, createdAt: 0 })

beforeEach(() => {
  store.settings = { ...DEFAULT_SETTINGS }
  store.timer = { ...DEFAULT_TIMER_STATE }
  store.snoozeUntil = 0
  store.blocklist = [entry('youtube.com', 'locked'), entry('music.youtube.com', 'white')]
})

describe('checkBlockWithTimer', () => {
  it('blocks subdomains of a locked domain', async () => {
    expect(await checkBlockWithTimer('https://m.youtube.com/')).toBe('locked')
  })

  it('whitelist wins over lock list', async () => {
    expect(await checkBlockWithTimer('https://music.youtube.com/')).toBe('white')
  })

  it('allows everything while snoozed', async () => {
    store.snoozeUntil = Date.now() + 60_000
    expect(await checkBlockWithTimer('https://youtube.com/')).toBe('none')
  })

  it('ignores an expired snooze', async () => {
    store.snoozeUntil = Date.now() - 1
    expect(await checkBlockWithTimer('https://youtube.com/')).toBe('locked')
  })

  it('free time mode allows all sites while the timer runs', async () => {
    store.settings.timerPausesBlocking = true
    store.timer = { ...store.timer, isActive: true }
    expect(await checkBlockWithTimer('https://youtube.com/')).toBe('none')
  })

  it('ultimate focus mode blocks every non-whitelisted site while the timer runs', async () => {
    store.settings.focusWhitelistOnly = true
    store.timer = { ...store.timer, isActive: true }
    expect(await checkBlockWithTimer('https://example.com/')).toBe('locked')
    expect(await checkBlockWithTimer('https://music.youtube.com/')).toBe('white')
  })

  it('ultimate focus mode takes priority over free time mode', async () => {
    store.settings.focusWhitelistOnly = true
    store.settings.timerPausesBlocking = true
    store.timer = { ...store.timer, isActive: true }
    expect(await checkBlockWithTimer('https://example.com/')).toBe('locked')
  })

  it('does nothing when blocking is disabled', async () => {
    store.settings.isEnabled = false
    expect(await checkBlockWithTimer('https://youtube.com/')).toBe('none')
  })
})
