// src/background/index.ts
// Limina 2.0 — Background Service Worker 主入口（MV3）

import { TimerService } from './services/TimerService'
import { TimeTracker } from './services/TimeTracker'
import { StorageService, TIME_RETENTION_DAYS } from './services/StorageService'
import { updateBadge } from './services/BadgeService'
import { localDateKey, recentDateKeys } from '@/utils/date'
import { SNOOZE_MIN, TIMER_MAX, TIMER_MIN, clampInt } from '@/types'
import type { AppSettings, MessageType, MessageResponse } from '@/types'

const ALARM_TRACKER = 'nerd-time-tracker'
const ALARM_DAY_CHANGE = 'nerd-day-change'
const ALARM_SNOOZE = 'nerd-snooze'

// ── 1. 啟動初始化 ───────────────────────────────────────────

/** 確保常駐 alarm 存在；SW 每次啟動都會執行（alarm 可能被清除或尚未建立） */
async function ensureAlarms(): Promise<void> {
  if (!(await chrome.alarms.get(ALARM_TRACKER))) {
    await chrome.alarms.create(ALARM_TRACKER, { periodInMinutes: 1 })
  }
  if (!(await chrome.alarms.get(ALARM_DAY_CHANGE))) {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    await chrome.alarms.create(ALARM_DAY_CHANGE, {
      when: midnight.getTime(),
      periodInMinutes: 24 * 60,
    })
  }
}
void ensureAlarms()
chrome.idle.setDetectionInterval(60)

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const stored = (await chrome.storage.local.get('settings')).settings as
    | Partial<AppSettings>
    | undefined
  const patch: Partial<AppSettings> = {}

  if (!stored?.installDate) patch.installDate = localDateKey()

  // 舊版的「嚴格模式」同時代表「計時中僅允許白名單」，升級時保留原本行為
  if (reason === 'update' && stored?.isSnoozeHidden && stored.focusWhitelistOnly === undefined) {
    patch.focusWhitelistOnly = true
  }

  // 舊版把英文預設訊息存進設定；改為空字串，封鎖頁才會依語系顯示預設訊息
  if (stored?.blockerMessage === 'You shall not pass! 🧙‍♂️') patch.blockerMessage = ''

  if (Object.keys(patch).length > 0) await StorageService.updateSettings(patch)
  if (reason === 'install') await StorageService.seedDefaultBlocklist()
  await StorageService.migrateLegacyTimeRecords()
  await StorageService.pruneTimeRecords()
  await ensureAlarms()
  await TimeTracker.refresh()
  console.log('[Limina] Service Worker installed')
})

chrome.runtime.onStartup.addListener(async () => {
  await StorageService.pruneTimeRecords()
  await ensureAlarms()
  await updateBadge()
  await TimeTracker.refresh()
})

// ── 2. Tab / 視窗 / 閒置監聽：時間記錄 + SPA 換頁封鎖判斷 ──────
chrome.tabs.onActivated.addListener(() => {
  void TimeTracker.refresh()
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    void TimeTracker.refresh()
  }

  // SPA（history.pushState）換頁不會重新注入 content script，通知它以新網址重新判斷
  if (changeInfo.url && changeInfo.url.startsWith('http')) {
    chrome.tabs.sendMessage(tabId, { type: 'URL_CHANGED' }).catch(() => {
      // Content script 尚未就緒，載入後會自行判斷
    })
  }
})

chrome.tabs.onRemoved.addListener(() => {
  void TimeTracker.refresh()
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) void TimeTracker.stop()
  else void TimeTracker.refresh()
})

chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'active') void TimeTracker.refresh()
  else void TimeTracker.stop()
})

// ── 3. Alarms：計時器 + Snooze + 換日 + 定期 flush ─────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'limina-done': {
      const state = await StorageService.getTimerState()
      if (state.isActive) await TimerService.done()
      break
    }
    case ALARM_SNOOZE: {
      // Content script 會透過 storage.onChanged 感知並恢復覆蓋層
      await StorageService.clearSnooze()
      await updateBadge()
      break
    }
    case ALARM_DAY_CHANGE: {
      // 跨午夜的時間已由 TimeTracker 切分，這裡確保資料寫入並清理過期資料
      await TimeTracker.flush()
      await StorageService.pruneTimeRecords()
      break
    }
    case ALARM_TRACKER: {
      // 定期將停留時間寫入 Storage，並更新 badge 剩餘分鐘
      await TimeTracker.flush()
      await updateBadge()
      break
    }
  }
})

// ── 4. Message Handler（Command Pattern）──────────────────
chrome.runtime.onMessage.addListener(
  (message: MessageType, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((res) => sendResponse(res))
      .catch((err) =>
        sendResponse({ success: false, error: String(err) } as MessageResponse),
      )
    return true // 非同步
  },
)

async function handleMessage(
  msg: MessageType,
  sender: chrome.runtime.MessageSender,
): Promise<MessageResponse> {
  // 只處理「寫入」與需要背景權限的指令；popup / content script 的讀取直接走 chrome.storage
  switch (msg.type) {
    case 'UPDATE_SETTINGS': {
      await StorageService.updateSettings(msg.settings)
      return { success: true }
    }

    case 'ADD_BLOCK': {
      const result = await StorageService.addBlockEntry(msg.entry)
      return { success: true, data: result }
    }

    case 'REMOVE_BLOCK': {
      await StorageService.removeBlockEntry(msg.id)
      return { success: true }
    }

    case 'SET_TIMER': {
      await TimerService.start(clampInt(msg.minutes, TIMER_MIN, TIMER_MAX, 25))
      return { success: true }
    }

    case 'PAUSE_TIMER': {
      await TimerService.pause()
      return { success: true }
    }

    case 'RESUME_TIMER': {
      await TimerService.resume()
      return { success: true }
    }

    case 'EXTEND_TIMER': {
      await TimerService.extend(clampInt(msg.minutes, 1, 60, 5))
      return { success: true }
    }

    case 'CANCEL_TIMER': {
      await TimerService.cancel()
      return { success: true }
    }

    case 'SNOOZE': {
      // 暫停封鎖：封鎖頁的「休息 N 分鐘」或 popup 的「暫停 15 分鐘／1 小時／到明天」
      // 寫入全域狀態（所有分頁透過 storage.onChanged 感知），並以 alarm 精確恢復
      const now = Date.now()
      const until = msg.until !== undefined
        ? Math.min(Math.max(msg.until, now + 60_000), now + 24 * 60 * 60_000)
        : now + clampInt(msg.minutes, SNOOZE_MIN, 24 * 60, 5) * 60_000
      await StorageService.setSnoozeUntil(until)
      await chrome.alarms.create(ALARM_SNOOZE, { when: until })
      await updateBadge()
      return { success: true }
    }

    case 'RESUME_BLOCKING': {
      await chrome.alarms.clear(ALARM_SNOOZE)
      await StorageService.clearSnooze()
      await updateBadge()
      return { success: true }
    }

    case 'BLOCK_HIT': {
      await StorageService.incrementDayStats({ blocks: 1 })
      return { success: true }
    }

    case 'DISMISS_SESSION': {
      await TimerService.dismissSession()
      return { success: true }
    }

    case 'CLOSE_TAB': {
      if (sender.tab?.id !== undefined) await chrome.tabs.remove(sender.tab.id)
      return { success: true }
    }

    case 'GET_TIME_STATS': {
      // 確保取得統計資料前先 flush 目前累積的時間
      await TimeTracker.flush()
      const days = recentDateKeys(clampInt(msg.days, 1, TIME_RETENTION_DAYS, 30))
      const [timeByDay, statsByDay] = await Promise.all([
        StorageService.getTimeByDay(days),
        StorageService.getStatsByDay(days),
      ])
      return { success: true, data: { timeByDay, statsByDay } }
    }

    case 'EXPORT_DATA': {
      await TimeTracker.flush()
      const data = await StorageService.exportAll()
      return { success: true, data }
    }

    case 'IMPORT_DATA': {
      await StorageService.importAll(msg.data)
      return { success: true }
    }

    case 'CLEAR_ALL_DATA': {
      await StorageService.clearAll()
      await chrome.alarms.clear('limina-done')
      await chrome.alarms.clear(ALARM_SNOOZE)
      await ensureAlarms()
      await updateBadge()
      return { success: true }
    }

    default:
      return { success: false, error: 'Unknown message type' }
  }
}
