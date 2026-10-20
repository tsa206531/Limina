// src/utils/date.ts
// 以「本地時區」產生日期 key，避免 toISOString() 造成的 UTC 換日偏移

/** 回傳本地時區的 "YYYY-MM-DD" */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 最近 days 天（含今天）的本地日期 key，由舊到新 */
export function recentDateKeys(days: number, now: Date = new Date()): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    keys.push(localDateKey(d))
  }
  return keys
}

/** 將 "YYYY-MM-DD" 解析為本地時區的 Date（new Date('YYYY-MM-DD') 會被當成 UTC） */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}
