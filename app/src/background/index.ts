// src/background/index.ts
// Limina 2.0 — Background Service Worker 主入口（MV3）

import { checkBlockWithTimer } from './services/BlockEngine'
import { TimerService } from './services/TimerService'
import { TimeTracker } from './services/TimeTracker'
import { StorageService } from './services/StorageService'
import type { MessageType, MessageResponse } from '@/types'

// ── 1. 啟動初始化 ───────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  // 設定預設值
  const settings = await StorageService.getSettings()
  if (!settings.installDate) {
    await StorageService.updateSettings({
      installDate: new Date().toISOString().slice(0, 10),
    })
  }

  // 確保安裝時立即設定 tick
  chrome.alarms.create('nerd-time-tracker', { periodInMinutes: 1 })

  console.log('[Limina] Service Worker installed')
})

// 當 SW 喚醒時（例如瀏覽器重開），確保 alarm 存在
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get('nerd-time-tracker', (alarm) => {
    if (!alarm) {
      chrome.alarms.create('nerd-time-tracker', { periodInMinutes: 1 })
    }
  })
})

// ── 2. Tab 監聽：封鎖判斷 + 時間記錄 ──────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return
  const url = tab.url
  if (!url.startsWith('http')) return

  // 時間記錄：切換到新頁面
  TimeTracker.start(tabId, url)

  // 封鎖判斷
  const status = await checkBlockWithTimer(url)
  chrome.tabs.sendMessage(tabId, { type: 'BLOCK_STATUS', status }).catch(() => {
    // Content script 尚未就緒，忽略錯誤
  })
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null)
  if (!tab?.url || !tab.url.startsWith('http')) return

  await TimeTracker.switch(tabId, tab.url)

  const status = await checkBlockWithTimer(tab.url)
  chrome.tabs.sendMessage(tabId, { type: 'BLOCK_STATUS', status }).catch(() => {})
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await TimeTracker.stop(tabId)
})

// ── 3. Alarms：計時器 Tick + 換日 ─────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'limina-done') {
    // 安全保護：若 tick 沒有偵測到歸零（精度問題），由此觸發
    const state = await StorageService.getTimerState()
    if (state.isActive) {
      // 仍處於 active 表示 tick 沒觸發 done，手動處理
      await TimerService.done()
    }
    // 若 isActive 已是 false，代表 tick 已處理完畢，略過
  } else if (alarm.name === 'nerd-snooze') {
    // Snooze 到期：清除全域 snooze，Content script 會自動透過 storage onChanged 感知並恢復（或解除）覆蓋層
    await StorageService.clearSnooze()
    chrome.action.setBadgeText({ text: '' })
  } else if (alarm.name === 'nerd-day-change') {
    await TimeTracker.handleDayChange()
  } else if (alarm.name === 'nerd-time-tracker') {
    // 定期將記憶體中的停留時間寫入 Storage，避免 SW 休眠或被殺死時丟失
    await TimeTracker.flush()
  }
})

// 設定換日 alarm
async function scheduleDayChange(): Promise<void> {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const minutesUntilMidnight = (midnight.getTime() - now.getTime()) / 60000
  await chrome.alarms.create('nerd-day-change', {
    delayInMinutes: minutesUntilMidnight,
    periodInMinutes: 24 * 60,
  })
}
scheduleDayChange()

// ── 4. Message Handler（Command Pattern）──────────────────
chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse) => {
    handleMessage(message)
      .then((res) => sendResponse(res))
      .catch((err) =>
        sendResponse({ success: false, error: String(err) } as MessageResponse),
      )
    return true // 非同步
  },
)

async function handleMessage(
  msg: MessageType,
): Promise<MessageResponse> {
  switch (msg.type) {
    case 'GET_STATUS': {
      const status = await checkBlockWithTimer(msg.url)
      const settings = await StorageService.getSettings()
      return { success: true, data: { status, settings } }
    }

    case 'GET_SETTINGS': {
      const settings = await StorageService.getSettings()
      return { success: true, data: settings }
    }

    case 'UPDATE_SETTINGS': {
      await StorageService.updateSettings(msg.settings)
      return { success: true }
    }

    case 'GET_BLOCKLIST': {
      const blocklist = await StorageService.getBlocklist()
      return { success: true, data: blocklist }
    }

    case 'ADD_BLOCK': {
      const entry = await StorageService.addBlockEntry(msg.entry)
      return { success: true, data: entry }
    }

    case 'REMOVE_BLOCK': {
      await StorageService.removeBlockEntry(msg.id)
      return { success: true }
    }

    case 'SET_TIMER': {
      await TimerService.start(msg.minutes)
      return { success: true }
    }

    case 'CANCEL_TIMER': {
      await TimerService.cancel()
      return { success: true }
    }

    case 'GET_TIMER_STATE': {
      const timerState = await StorageService.getTimerState()
      return { success: true, data: timerState }
    }

    case 'SNOOZE': {
      // 1. 寫入全域 snooze 狀態（讓所有 tab 的 checkBlockWithTimer 感知）
      const snoozeUntil = Date.now() + msg.minutes * 60 * 1000
      await StorageService.setSnoozeUntil(snoozeUntil)
      // 2. 建立到期 alarm（精確觸發清除）
      await chrome.alarms.create('nerd-snooze', { delayInMinutes: msg.minutes })
      // 3. Badge 顯示剩餘 Snooze 時間（琥珀色，與計時器綠色區分）
      chrome.action.setBadgeText({ text: `${msg.minutes}m` })
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' })
      // 4. Content script 會透過監聽 onChanged 自動移除覆蓋層，不須廣播
      return { success: true }
    }

    case 'GET_TIME_STATS': {
      // 確保取得統計資料前先 flush 目前的記憶體暫存
      await TimeTracker.flush()
      const timeRecords = await StorageService.getTimeRecords()
      return { success: true, data: timeRecords }
    }

    case 'EXPORT_DATA': {
      // 確保匯出前先 flush
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
      return { success: true }
    }

    case 'STOP_FOR_THIS_TIME': {
      // 由 Content Script 自行管理，Background 不處理
      return { success: true }
    }

    default:
      return { success: false, error: 'Unknown message type' }
  }
}

