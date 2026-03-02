// src/composables/useI18n.ts
// Ultra-lightweight, CSP-safe i18n composable for Chrome Extension
// No compiler, no eval, no unsafe-eval - just simple string lookup + { } replacement

import { ref, computed, readonly } from 'vue'
import en from '../locales/en.json'
import zhTW from '../locales/zh-TW.json'
import ja from '../locales/ja.json'

type Messages = typeof en
type Locale = 'en' | 'zh-TW' | 'ja' | 'auto'

const locales: Record<string, Messages> = { en, 'zh-TW': zhTW, ja }

// Resolve the effective locale key
function resolveLocale(l: Locale): string {
  if (l === 'auto') {
    const lang = navigator.language
    if (lang.startsWith('zh')) return 'zh-TW'
    if (lang.startsWith('ja')) return 'ja'
    return 'en'
  }
  return l in locales ? l : 'en'
}

// Global reactive state
const _locale = ref<Locale>('auto')
const _messages = computed<Messages>(() => locales[resolveLocale(_locale.value)] ?? en)

// Deeply get a value by dot-notation key
function getMsg(obj: Record<string, unknown>, keys: string[]): string {
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return ''
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : ''
}

// Simple {variable} replacement
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`))
}

export function useI18n() {
  function t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.')
    const msg = getMsg(_messages.value as unknown as Record<string, unknown>, parts)
    return msg ? interpolate(msg, params) : key
  }

  return { t, locale: readonly(_locale) }
}

export function setLocale(locale: Locale) {
  _locale.value = locale
}

export function getLocale(): Locale {
  return _locale.value
}
