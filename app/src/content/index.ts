// src/content/index.ts
// Limina 2.0 — Content Script
// 使用 Shadow DOM 隔離覆蓋層，避免與頁面樣式衝突

import { resolveLang, translate } from '@/locales/translate'
import type { AppSettings, BlockStatus } from '@/types'

(function () {
  'use strict'

  // 避免重複注入
  if (document.getElementById('__limina-host__')) return

  let overlayVisible = false
  let savedOverflow: string | null = null // 顯示覆蓋層前頁面原本的 overflow

  /** 擴充被重新載入或移除後，舊頁面的 chrome.runtime 會失效 */
  function contextAlive(): boolean {
    try {
      return Boolean(chrome.runtime?.id)
    } catch {
      return false
    }
  }

  function send<T = unknown>(message: object): Promise<{ success: boolean; data?: T } | undefined> {
    if (!contextAlive()) return Promise.resolve(undefined)
    return chrome.runtime.sendMessage(message).catch(() => undefined)
  }

  // ── Shadow DOM 容器 ─────────────────────────────────────
  const host = document.createElement('div')
  host.id = '__limina-host__'
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    pointer-events: none;
    display: block;
  `
  document.documentElement.appendChild(host)

  const shadow = host.attachShadow({ mode: 'closed' })

  // ── 覆蓋層 HTML + CSS ──────────────────────────────────
  const overlay = document.createElement('div')
  overlay.id = 'nerd-overlay'

  const style = document.createElement('style')
  // 只使用系統字體：不向第三方載入資源，也不受網站 CSP 影響
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, 'Segoe UI', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    }

    #nerd-overlay {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg,
        rgb(6 30 34 / 0%) 0%,
        rgb(8 60 72 / 0%) 50%,
        rgb(6 30 40 / 0%) 100%);
      backdrop-filter: blur(2px) saturate(80%);
      -webkit-backdrop-filter: blur(2px) saturate(80%);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    #nerd-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }

    /* 環境光效果 */
    #nerd-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 40%, rgba(8, 131, 150, 0.25) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 70%, rgba(6, 104, 120, 0.2) 0%, transparent 50%);
      pointer-events: none;
      animation: ominousBreathe 9s ease-in-out infinite alternate;
    }

    @keyframes ominousBreathe {
      0% { opacity: 0.6; transform: scale(1); }
      100% { opacity: 1; transform: scale(1.06); }
    }

    /* 主卡片：半透明毛玻璃 */
    .nerd-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(8, 131, 150, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 40px 36px 36px;
      height: 60vh;
      max-width: 700px;
      width: 92%;
      text-align: center;
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .nerd-icon {
      font-size: 56px;
      margin-bottom: 16px;
      display: block;
      filter: drop-shadow(0 4px 12px rgba(8, 131, 150, 0.5));
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-7px); }
    }

    .nerd-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: rgba(8, 131, 150, 0.9);
      margin-bottom: 10px;
    }

    .nerd-message {
      font-size: 20px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.4;
      margin-bottom: 10px;
    }

    .nerd-domain {
      font-size: 12px;
      color: rgba(8, 131, 150, 0.8);
      margin-bottom: 28px;
      font-family: ui-monospace, 'SF Mono', Consolas, monospace;
      background: rgba(8, 131, 150, 0.12);
      border: 1px solid rgba(8, 131, 150, 0.25);
      padding: 4px 14px;
      border-radius: 99px;
      display: inline-block;
    }

    /* 按鈕：左右排列，推至底部 */
    .nerd-btn-group {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-top: auto;
      width: 100%;
    }

    .nerd-btn {
      flex: 1;
      padding: 13px 18px;
      border-radius: 14px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      letter-spacing: 0.01em;
    }

    .nerd-btn:hover  { transform: translateY(-2px) scale(1.02); }
    .nerd-btn:active { transform: translateY(0) scale(0.98); }
    .nerd-btn:disabled { opacity: 0.5; cursor: wait; }

    /* Snooze：ghost 透明 */
    .nerd-btn-snooze {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .nerd-btn-snooze:hover {
      background: rgba(255, 255, 255, 0.11);
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.22);
    }

    /* 開始專注（關閉分頁）：主色 teal 漸層 */
    .nerd-btn-focus {
      background: linear-gradient(135deg, #088396, #066878);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(8, 131, 150, 0.45);
      border: none;
    }
    .nerd-btn-focus:hover {
      box-shadow: 0 6px 24px rgba(8, 131, 150, 0.65);
    }

    .nerd-footer {
      margin-top: 20px;
      font-size: 11px;
      color: rgba(8, 131, 150, 0.4);
      letter-spacing: 0.05em;
    }
  `

  overlay.innerHTML = `
    <div class="nerd-card">
      <span class="nerd-icon">🧙‍♂️</span>
      <div class="nerd-title" id="nerd-title"></div>
      <div class="nerd-message" id="nerd-msg"></div>
      <div class="nerd-domain" id="nerd-domain"></div>
      <div class="nerd-btn-group">
        <button class="nerd-btn nerd-btn-snooze" id="nerd-btn-snooze"></button>
        <button class="nerd-btn nerd-btn-focus" id="nerd-btn-focus"></button>
      </div>
      <div class="nerd-footer" id="nerd-footer"></div>
    </div>
  `

  shadow.appendChild(style)
  shadow.appendChild(overlay)

  const $ = (id: string) => shadow.getElementById(id) as HTMLElement
  const snoozeBtn = $('nerd-btn-snooze') as HTMLButtonElement
  const focusBtn = $('nerd-btn-focus') as HTMLButtonElement

  let snoozeMinutes = 5

  // ── 依設定填入文字與按鈕狀態 ─────────────────────────────
  function renderTexts(settings: AppSettings): void {
    const lang = resolveLang(settings.language)
    const t = (key: string, params?: Record<string, string | number>) => translate(lang, key, params)
    snoozeMinutes = settings.snoozeDuration || 5

    $('nerd-title').textContent = t('overlay.title')
    $('nerd-msg').textContent = settings.blockerMessage || t('overlay.defaultMessage')
    $('nerd-domain').textContent = location.hostname
    $('nerd-footer').textContent = t('overlay.footer')
    snoozeBtn.textContent = t('overlay.snooze', { min: snoozeMinutes })
    focusBtn.textContent = t('overlay.focus')
    // 隱藏 snooze：封鎖頁不提供放行選項
    snoozeBtn.style.display = settings.isSnoozeHidden ? 'none' : ''
    snoozeBtn.disabled = false
  }

  function showOverlay(settings: AppSettings): void {
    renderTexts(settings)
    if (overlayVisible) return
    overlayVisible = true
    host.style.pointerEvents = 'all'
    overlay.classList.add('visible')
    // 防止頁面捲動，並記住原值以便還原
    savedOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }

  function hideOverlay(): void {
    if (!overlayVisible) return
    overlayVisible = false
    host.style.pointerEvents = 'none'
    overlay.classList.remove('visible')
    document.documentElement.style.overflow = savedOverflow ?? ''
    savedOverflow = null
  }

  // ── 按鈕事件 ───────────────────────────────────────────
  // 「讓我休息 N 分鐘」→ 全域 snooze，所有分頁放行 N 分鐘後自動恢復封鎖
  snoozeBtn.addEventListener('click', () => {
    snoozeBtn.disabled = true
    void send({ type: 'SNOOZE', minutes: snoozeMinutes })
    // 覆蓋層由 storage.onChanged（snoozeUntil）觸發重新判斷後隱藏
  })

  // 「開始專注」→ 關閉這個分頁
  focusBtn.addEventListener('click', () => {
    void send({ type: 'CLOSE_TAB' })
  })

  // ── 封鎖判斷 ──────────────────────────────────────────
  async function checkAndShow(): Promise<void> {
    const res = await send<{ status: BlockStatus; settings: AppSettings }>({
      type: 'GET_STATUS',
      url: location.href,
    })
    if (!res?.success || !res.data) return
    if (res.data.status === 'locked') showOverlay(res.data.settings)
    else hideOverlay()
  }

  // 相關狀態改變時重新判斷（snooze 到期、計時器開始／結束、名單或設定變更）
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !contextAlive()) return
    if (changes.timerState || changes.settings || changes.snoozeUntil || changes.blocklist) {
      void checkAndShow()
    }
  })

  // SPA 換頁：background 偵測到 URL 變更時通知
  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message?.type === 'BLOCK_STATUS') void checkAndShow()
  })

  void checkAndShow()
})()
