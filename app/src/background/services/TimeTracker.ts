// src/background/services/TimeTracker.ts
// 記錄各分頁的停留時間

import { StorageService } from './StorageService'

interface TabSession {
  domain: string
  startMs: number
}

// 記憶體中暫存各 tabId 的 session
const activeSessions = new Map<number, TabSession>()

export const TimeTracker = {
  /**
   * 開始記錄某個 tab 的時間
   */
  start(tabId: number, url: string): void {
    const domain = this.getDomain(url)
    if (!domain) return
    activeSessions.set(tabId, { domain, startMs: Date.now() })
  },

  /**
   * 結束記錄並寫入 storage
   */
  async stop(tabId: number): Promise<void> {
    const session = activeSessions.get(tabId)
    if (!session) return

    activeSessions.delete(tabId)
    const elapsed = Date.now() - session.startMs

    // 忽略小於 1 秒的記錄（防誤差）
    if (elapsed < 1000) return

    await StorageService.recordTime(session.domain, elapsed)
  },

  /**
   * 切換 tab 時：結束舊的、開始新的
   */
  async switch(tabId: number, newUrl: string): Promise<void> {
    await this.stop(tabId)
    this.start(tabId, newUrl)
  },

  /**
   * 定期刷新（每分鐘）：將正在記錄的時間先寫入，防止 Service Worker 休眠丟失
   */
  async flush(): Promise<void> {
    const now = Date.now()
    for (const [tabId, session] of activeSessions.entries()) {
      const elapsed = now - session.startMs
      if (elapsed < 1000) continue
      await StorageService.recordTime(session.domain, elapsed)
      // 重置 session 起始時間
      activeSessions.set(tabId, { ...session, startMs: now })
    }
  },

  getDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  },

  /**
   * 換日處理：目前透過 daily key（YYYY-MM-DD）天然隔離，無需額外處理
   * 但每天 00:00 觸發 flush 以確保資料完整性
   */
  async handleDayChange(): Promise<void> {
    await this.flush()
  },
}
