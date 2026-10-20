// src/utils/domain.ts
// 網域正規化、比對層次與顯示用分類（background / popup 共用）

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/
const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/

// 常見的二級公共後綴（例如 bbc.co.uk 的 co.uk），不可作為封鎖單位
const SECOND_LEVEL_SUFFIXES = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go'])

function isPublicSuffix(domain: string): boolean {
  const parts = domain.split('.')
  if (parts.length === 1) return true
  return parts.length === 2 && parts[1].length === 2 && SECOND_LEVEL_SUFFIXES.has(parts[0])
}

/** IP、IPv6 或單段主機名（localhost）只能整串比對 */
function isOpaqueHost(host: string): boolean {
  return IPV4.test(host) || host.includes(':') || host.startsWith('[') || !host.includes('.')
}

function hostnameOf(urlOrHost: string): string {
  try {
    return new URL(urlOrHost).hostname.toLowerCase()
  } catch {
    return urlOrHost.toLowerCase()
  }
}

/**
 * 使用者輸入 → 標準網域（去掉 scheme、路徑、port、www.、結尾的點）
 * 無效時回傳空字串
 */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase()
  if (!s) return ''
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // scheme
  s = s.split(/[/?#]/)[0] // path / query / hash
  s = s.replace(/^[^@]*@/, '') // user info
  if (!s.startsWith('[')) s = s.replace(/:\d+$/, '') // port
  s = s.replace(/\.$/, '').replace(/^www\./, '')
  if (IPV4.test(s) || s === 'localhost') return s
  return DOMAIN.test(s) ? s : ''
}

/**
 * 從完整 URL 提取所有可比對層次的網域字串
 * e.g. https://mail.youtube.com/inbox → ['mail.youtube.com', 'youtube.com']
 */
export function extractDomainLevels(url: string): string[] {
  const host = hostnameOf(url)
  if (!host) return []
  if (isOpaqueHost(host)) return [host]
  const parts = host.split('.')
  const levels: string[] = []
  for (let i = 0; i < parts.length - 1; i++) {
    const level = parts.slice(i).join('.')
    if (!isPublicSuffix(level)) levels.push(level)
  }
  return levels
}

/**
 * 快速加入時可選的網域層次（不含 www.），由最廣到最精確
 * e.g. https://www.mail.youtube.com → ['youtube.com', 'mail.youtube.com']
 */
export function domainOptions(url: string): string[] {
  return extractDomainLevels(url)
    .filter((d) => !d.startsWith('www.'))
    .reverse()
}

type Category = 'media' | 'social' | 'developer' | 'mail' | 'general'

const CATEGORY_RULES: [Category, string[]][] = [
  ['media', ['youtube', 'netflix', 'twitch', 'bilibili', 'spotify']],
  ['social', ['facebook', 'twitter', 'x.com', 'instagram', 'reddit', 'threads', 'tiktok', 'dcard', 'ptt']],
  ['developer', ['github', 'gitlab', 'stackoverflow', 'npmjs']],
  ['mail', ['mail.', 'gmail', 'outlook']],
]

const CATEGORY_ICON: Record<Category, string> = {
  media: 'play_circle',
  social: 'forum',
  developer: 'code',
  mail: 'mail',
  general: 'public',
}

export function domainCategory(domain: string): Category {
  for (const [cat, keywords] of CATEGORY_RULES) {
    if (keywords.some((k) => domain.includes(k))) return cat
  }
  return 'general'
}

export function iconForDomain(domain: string): string {
  return CATEGORY_ICON[domainCategory(domain)]
}
