// src/background/services/TimeTracker.ts
// 記錄「目前焦點分頁」的停留時間
// - 同一時間只追蹤一個分頁（使用中視窗的作用中分頁）
// - session 存在 chrome.storage.session，Service Worker 被終止後仍可接續
// - 視窗失焦、使用者閒置或螢幕鎖定時停止計時

import { StorageService } from './StorageService'
import { localDateKey } from '@/utils/date'

interface TrackSession {
  domain: string
  startMs: number
}

const SESSION_KEY = 'trackSession'

// 單段記錄上限：flush 每分鐘一次，超過此值代表電腦休眠等異常，只計入上限
const MAX_SEGMENT_MS = 5 * 60 * 1000

// 追蹤相關事件依序處理，避免 stop / start 交錯
let queue: Promise<unknown> = Promise.resolve()
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => {})
  return run
}

async function getSession(): Promise<TrackSession | null> {
  const result = await chrome.storage.session.get(SESSION_KEY)
  return (result[SESSION_KEY] as TrackSession | undefined) ?? null
}

async function setSession(session: TrackSession | null): Promise<void> {
  if (session) await chrome.storage.session.set({ [SESSION_KEY]: session })
  else await chrome.storage.session.remove(SESSION_KEY)
}

/** 將 [startMs, endMs) 寫入，跨越午夜時切分到各自的日期 */
async function record(domain: string, startMs: number, endMs: number): Promise<void> {
  let from = Math.max(startMs, endMs - MAX_SEGMENT_MS)
  while (from < endMs) {
    const nextMidnight = new Date(from)
    nextMidnight.setHours(24, 0, 0, 0)
    const to = Math.min(endMs, nextMidnight.getTime())
    if (to - from >= 1000) {
      await StorageService.recordTime(domain, to - from, localDateKey(new Date(from)))
    }
    from = to
  }
}

function getDomain(url: string | undefined): string {
  if (!url || !url.startsWith('http')) return ''
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

async function stopInternal(): Promise<void> {
  const session = await getSession()
  if (!session) return
  await setSession(null)
  await record(session.domain, session.startMs, Date.now())
}

export const TimeTracker = {
  /**
   * 依目前狀態重新決定要追蹤哪個網域：
   * 結束舊的 session，若焦點視窗的作用中分頁為 http(s) 且使用者非閒置，開始新的 session
   */
  refresh(): Promise<void> {
    return serialize(async () => {
      const [idleState, win] = await Promise.all([
        chrome.idle.queryState(60),
        chrome.windows.getLastFocused({ populate: true }).catch(() => null),
      ])
      const tab = win?.focused ? win.tabs?.find((t) => t.active) : undefined
      const domain = idleState === 'active' ? getDomain(tab?.url) : ''

      const session = await getSession()
      if (session && session.domain === domain) return // 同一網域，持續計時

      await stopInternal()
      if (domain) await setSession({ domain, startMs: Date.now() })
    })
  },

  /** 停止計時並寫入（視窗失焦、閒置時） */
  stop(): Promise<void> {
    return serialize(stopInternal)
  },

  /** 定期刷新：寫入目前累積時間並重置起點，避免資料只停留在 session 中 */
  flush(): Promise<void> {
    return serialize(async () => {
      const session = await getSession()
      if (!session) return
      const now = Date.now()
      if (now - session.startMs < 1000) return
      await setSession({ ...session, startMs: now })
      await record(session.domain, session.startMs, now)
    })
  },
}
