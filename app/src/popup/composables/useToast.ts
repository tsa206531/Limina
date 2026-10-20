// src/popup/composables/useToast.ts
// 全域單一提示訊息；可附一個動作（例如刪除後的「復原」）

import { shallowRef } from 'vue'

export interface Toast {
  id: number
  text: string
  type: 'ok' | 'err'
  action?: { label: string; run: () => void }
}

const current = shallowRef<Toast | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let nextId = 0

export function showToast(text: string, type: Toast['type'] = 'ok', action?: Toast['action']) {
  clearTimeout(timer)
  current.value = { id: ++nextId, text, type, action }
  // 有動作時多留一點時間讓使用者反應
  timer = setTimeout(dismissToast, action ? 6000 : 2500)
}

export function dismissToast() {
  clearTimeout(timer)
  current.value = null
}

export function useToast() {
  return current
}
