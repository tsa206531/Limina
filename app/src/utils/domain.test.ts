import { describe, expect, it } from 'vitest'
import { domainOptions, extractDomainLevels, normalizeDomain } from './domain'

describe('extractDomainLevels', () => {
  it('returns every level except the bare TLD', () => {
    expect(extractDomainLevels('https://mail.youtube.com/inbox')).toEqual(['mail.youtube.com', 'youtube.com'])
  })

  it('skips second-level public suffixes like co.uk', () => {
    expect(extractDomainLevels('https://www.bbc.co.uk/news')).toEqual(['www.bbc.co.uk', 'bbc.co.uk'])
  })

  it('matches IPs and single-label hosts as a whole', () => {
    expect(extractDomainLevels('http://192.168.0.1:8080/')).toEqual(['192.168.0.1'])
    expect(extractDomainLevels('http://localhost:5173/')).toEqual(['localhost'])
  })
})

describe('domainOptions', () => {
  it('lists broadest first and drops www', () => {
    expect(domainOptions('https://www.youtube.com/watch')).toEqual(['youtube.com'])
    expect(domainOptions('https://m.youtube.com/')).toEqual(['youtube.com', 'm.youtube.com'])
  })
})

describe('normalizeDomain', () => {
  it.each([
    ['https://www.YouTube.com/watch?v=1', 'youtube.com'],
    ['  facebook.com/  ', 'facebook.com'],
    ['example.com:8080', 'example.com'],
    ['localhost', 'localhost'],
    ['10.0.0.1', '10.0.0.1'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected)
  })

  it('rejects invalid input', () => {
    expect(normalizeDomain('not a domain')).toBe('')
    expect(normalizeDomain('')).toBe('')
  })
})
