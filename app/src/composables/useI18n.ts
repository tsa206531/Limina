// src/composables/useI18n.ts
// Ultra-lightweight, CSP-safe i18n composable for the popup
// 實際字典與查詢邏輯在 src/locales/translate.ts，與 background / content script 共用

import { ref, computed, readonly } from 'vue'
import { resolveLang, translate, type LangSetting } from '@/locales/translate'

// Global reactive state
const _locale = ref<LangSetting>('auto')
const _lang = computed(() => resolveLang(_locale.value))

export function useI18n() {
  function t(key: string, params?: Record<string, string | number>): string {
    return translate(_lang.value, key, params)
  }

  return { t, locale: readonly(_locale), lang: _lang }
}

export function setLocale(locale: LangSetting) {
  _locale.value = locale
}

export function getLocale(): LangSetting {
  return _locale.value
}
