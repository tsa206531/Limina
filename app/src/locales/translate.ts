// src/locales/translate.ts
// 共用翻譯函式：popup、background、content script 都從這裡取字串
// No compiler, no eval — just string lookup + {var} replacement (CSP-safe)

import en from './en.json'
import zhTW from './zh-TW.json'
import ja from './ja.json'

export type Lang = 'en' | 'zh-TW' | 'ja'
export type LangSetting = Lang | 'auto'

const dictionaries: Record<Lang, unknown> = { en, 'zh-TW': zhTW, ja }

/** 將使用者設定（含 auto）解析為實際語系 */
export function resolveLang(setting: string = 'auto'): Lang {
  if (setting in dictionaries) return setting as Lang
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  if (nav.startsWith('zh')) return 'zh-TW'
  if (nav.startsWith('ja')) return 'ja'
  return 'en'
}

function lookup(dict: unknown, keys: string[]): string {
  let cur = dict
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return ''
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : ''
}

/**
 * 時間長度 → 在地化字串（1 小時 20 分、45 分、30 秒）
 * @param round 'floor' 用於統計累計值；'ceil' 用於倒數剩餘時間（不會顯示 0 分）
 */
export function formatDuration(lang: Lang, ms: number, round: 'floor' | 'ceil' = 'floor'): string {
  const safe = Math.max(0, ms)
  if (round === 'floor' && safe < 60_000) {
    return translate(lang, 'time.s', { s: Math.floor(safe / 1000) })
  }
  const totalMin = round === 'ceil' ? Math.max(1, Math.ceil(safe / 60_000)) : Math.floor(safe / 60_000)
  if (totalMin < 60) return translate(lang, 'time.m', { m: totalMin })
  return translate(lang, 'time.hm', { h: Math.floor(totalMin / 60), m: totalMin % 60 })
}

/** 依 dot-notation key 取字串，缺字時退回英文，再退回 key 本身 */
export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  const keys = key.split('.')
  const msg = lookup(dictionaries[lang], keys) || lookup(en, keys)
  if (!msg) return key
  if (!params) return msg
  return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}
