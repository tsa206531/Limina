// src/content/index.ts
// Limina 2.0 — Content Script
// - 直接讀 chrome.storage.local 自行判斷是否封鎖，不叫醒 Service Worker
// - 覆蓋層（Shadow DOM）只在第一次需要封鎖時才建立，一般網頁幾乎零成本

import { resolveLang, translate } from '@/locales/translate'
import { BLOCK_STATE_KEYS, evaluateBlock, toBlockState, type BlockState } from '@/utils/block'

declare global {
  interface Window {
    __liminaLoaded?: boolean
  }
}

(function () {
  'use strict'

  // 避免重複注入
  if (window.__liminaLoaded) return
  window.__liminaLoaded = true

  /** 擴充被重新載入或移除後，舊頁面的 chrome.runtime 會失效 */
  function contextAlive(): boolean {
    try {
      return Boolean(chrome.runtime?.id)
    } catch {
      return false
    }
  }

  function send(message: object): void {
    if (!contextAlive()) return
    chrome.runtime.sendMessage(message).catch(() => {})
  }

  // ── 封鎖判斷所需的 storage 值（本地快取，由 onChanged 增量更新）──
  const raw: Record<string, unknown> = {}
  let state: BlockState | null = null
  let snoozeTimer: ReturnType<typeof setTimeout> | undefined

  function evaluate(): void {
    if (!state) return
    if (evaluateBlock(state, location.href) === 'locked') showOverlay(state)
    else hideOverlay()

    // Snooze 到期時自行重新判斷（背景 alarm 也會清除 snoozeUntil，兩者取先到者）
    clearTimeout(snoozeTimer)
    const remaining = state.snoozeUntil - Date.now()
    if (remaining > 0) snoozeTimer = setTimeout(evaluate, remaining + 50)
  }

  chrome.storage.local.get([...BLOCK_STATE_KEYS]).then((values) => {
    Object.assign(raw, values)
    state = toBlockState(raw)
    evaluate()
  }).catch(() => {})

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !contextAlive()) return
    let relevant = false
    for (const key of BLOCK_STATE_KEYS) {
      if (!(key in changes)) continue
      relevant = true
      if (changes[key].newValue === undefined) delete raw[key]
      else raw[key] = changes[key].newValue
    }
    if (!relevant) return // 例如每分鐘寫入的 time:* 統計資料
    state = toBlockState(raw)
    evaluate()
  })

  // SPA 換頁：background 偵測到 URL 變更時通知
  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message?.type === 'URL_CHANGED') evaluate()
  })

  // ── 覆蓋層（延遲建立）────────────────────────────────────
  interface Overlay {
    host: HTMLElement
    overlay: HTMLElement
    title: HTMLElement
    message: HTMLElement
    domain: HTMLElement
    footer: HTMLElement
    snoozeBtn: HTMLButtonElement
    focusBtn: HTMLButtonElement
  }

  let ui: Overlay | null = null
  let overlayVisible = false
  let savedOverflow: string | null = null // 顯示覆蓋層前頁面原本的 overflow
  let snoozeMinutes = 5

  const STYLE = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, 'Segoe UI', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    }

    /* 只有 2px 模糊；背後的影音已暫停，頁面靜止時合成成本很低 */
    #nerd-overlay {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
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

    /* 環境光：靜態，不做全螢幕無限動畫 */
    #nerd-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 40%, rgba(8, 131, 150, 0.25) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 70%, rgba(6, 104, 120, 0.2) 0%, transparent 50%);
      pointer-events: none;
    }

    /* 主卡片：背景已近乎不透明，不需要再做 backdrop 模糊 */
    .nerd-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(0, 0, 0, 0.85);
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
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-7px); }
    }

    @media (prefers-reduced-motion: reduce) {
      #nerd-overlay, .nerd-card, .nerd-icon, .nerd-btn { animation: none; transition: none; }
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
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
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

  function createOverlay(): Overlay {
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
    const shadow = host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = STYLE

    const overlay = document.createElement('div')
    overlay.id = 'nerd-overlay'
    overlay.innerHTML = `
      <div class="nerd-card">
        <span class="nerd-icon">🧙‍♂️</span>
        <div class="nerd-title"></div>
        <div class="nerd-message"></div>
        <div class="nerd-domain"></div>
        <div class="nerd-btn-group">
          <button class="nerd-btn nerd-btn-snooze"></button>
          <button class="nerd-btn nerd-btn-focus"></button>
        </div>
        <div class="nerd-footer"></div>
      </div>
    `
    shadow.append(style, overlay)
    document.documentElement.appendChild(host)

    const $ = <T extends HTMLElement>(sel: string) => overlay.querySelector(sel) as T
    const created: Overlay = {
      host,
      overlay,
      title: $('.nerd-title'),
      message: $('.nerd-message'),
      domain: $('.nerd-domain'),
      footer: $('.nerd-footer'),
      snoozeBtn: $<HTMLButtonElement>('.nerd-btn-snooze'),
      focusBtn: $<HTMLButtonElement>('.nerd-btn-focus'),
    }

    // 「讓我休息 N 分鐘」→ 全域 snooze；覆蓋層由 storage.onChanged（snoozeUntil）觸發隱藏
    created.snoozeBtn.addEventListener('click', () => {
      created.snoozeBtn.disabled = true
      send({ type: 'SNOOZE', minutes: snoozeMinutes })
    })

    // 「開始專注」→ 關閉這個分頁
    created.focusBtn.addEventListener('click', () => send({ type: 'CLOSE_TAB' }))

    return created
  }

  function renderTexts(o: Overlay, s: BlockState): void {
    const { settings } = s
    const lang = resolveLang(settings.language)
    const t = (key: string, params?: Record<string, string | number>) => translate(lang, key, params)
    snoozeMinutes = settings.snoozeDuration || 5

    o.title.textContent = t('overlay.title')
    o.message.textContent = settings.blockerMessage || t('overlay.defaultMessage')
    o.domain.textContent = location.hostname
    o.footer.textContent = t('overlay.footer')
    o.snoozeBtn.textContent = t('overlay.snooze', { min: snoozeMinutes })
    o.focusBtn.textContent = t('overlay.focus')
    // 隱藏 snooze：封鎖頁不提供放行選項
    o.snoozeBtn.style.display = settings.isSnoozeHidden ? 'none' : ''
    o.snoozeBtn.disabled = false
  }

  /** 暫停頁面上的影音：避免在封鎖頁後面繼續播放，也讓背景模糊不必每幀重算 */
  function pauseMedia(): void {
    document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((m) => {
      if (!m.paused) m.pause()
    })
  }

  function showOverlay(s: BlockState): void {
    ui ??= createOverlay()
    renderTexts(ui, s)
    pauseMedia()
    if (overlayVisible) return
    overlayVisible = true
    ui.host.style.pointerEvents = 'all'
    ui.overlay.classList.add('visible')
    // 防止頁面捲動，並記住原值以便還原
    savedOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }

  function hideOverlay(): void {
    if (!overlayVisible || !ui) return
    overlayVisible = false
    ui.host.style.pointerEvents = 'none'
    ui.overlay.classList.remove('visible')
    document.documentElement.style.overflow = savedOverflow ?? ''
    savedOverflow = null
  }
})()
