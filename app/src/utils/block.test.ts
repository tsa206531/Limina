import { beforeEach, describe, expect, it } from 'vitest'
import type { BlockListEntry } from '@/types'
import { evaluateBlock, toBlockState, type BlockState } from './block'

const entry = (domain: string, type: 'locked' | 'white'): BlockListEntry =>
  ({ id: domain + type, domain, type, createdAt: 0 })

let state: BlockState

beforeEach(() => {
  state = toBlockState({
    blocklist: [entry('youtube.com', 'locked'), entry('music.youtube.com', 'white')],
  })
})

describe('evaluateBlock', () => {
  it('blocks subdomains of a locked domain', () => {
    expect(evaluateBlock(state, 'https://m.youtube.com/')).toBe('locked')
  })

  it('whitelist wins over lock list', () => {
    expect(evaluateBlock(state, 'https://music.youtube.com/')).toBe('white')
  })

  it('allows everything while snoozed', () => {
    state.snoozeUntil = Date.now() + 60_000
    expect(evaluateBlock(state, 'https://youtube.com/')).toBe('none')
  })

  it('ignores an expired snooze', () => {
    state.snoozeUntil = Date.now() - 1
    expect(evaluateBlock(state, 'https://youtube.com/')).toBe('locked')
  })

  it('free time mode allows all sites while the timer runs', () => {
    state.settings.timerPausesBlocking = true
    state.timer.isActive = true
    expect(evaluateBlock(state, 'https://youtube.com/')).toBe('none')
  })

  it('ultimate focus mode blocks every non-whitelisted site while the timer runs', () => {
    state.settings.focusWhitelistOnly = true
    state.timer.isActive = true
    expect(evaluateBlock(state, 'https://example.com/')).toBe('locked')
    expect(evaluateBlock(state, 'https://music.youtube.com/')).toBe('white')
  })

  it('ultimate focus mode takes priority over free time mode', () => {
    state.settings.focusWhitelistOnly = true
    state.settings.timerPausesBlocking = true
    state.timer.isActive = true
    expect(evaluateBlock(state, 'https://example.com/')).toBe('locked')
  })

  it('does nothing when blocking is disabled', () => {
    state.settings.isEnabled = false
    expect(evaluateBlock(state, 'https://youtube.com/')).toBe('none')
  })

  it('fills defaults for missing storage values', () => {
    const empty = toBlockState({})
    expect(empty.settings.isEnabled).toBe(true)
    expect(evaluateBlock(empty, 'https://youtube.com/')).toBe('none')
  })
})
