// src/content/index.ts
// Limina 2.0 — Content Script
// - 直接讀 chrome.storage.local 自行判斷是否封鎖，不叫醒 Service Worker
// - 覆蓋層（Shadow DOM）只在第一次需要封鎖時才建立，一般網頁幾乎零成本

import { formatDuration, resolveLang, translate, type Lang } from '@/locales/translate'
import { BLOCK_STATE_KEYS, blockReason, evaluateBlock, toBlockState, type BlockState } from '@/utils/block'
import { localDateKey } from '@/utils/date'

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
  let blocksToday = 0
  const todayStatsKey = () => `stats:${localDateKey()}`

  function evaluate(): void {
    if (!state) return
    if (evaluateBlock(state, location.href) === 'locked') showOverlay(state)
    else hideOverlay()

    // 暫停封鎖到期時自行重新判斷（背景 alarm 也會清除 snoozeUntil，兩者取先到者）
    clearTimeout(snoozeTimer)
    const remaining = state.snoozeUntil - Date.now()
    if (remaining > 0) snoozeTimer = setTimeout(evaluate, remaining + 50)
  }

  chrome.storage.local.get([...BLOCK_STATE_KEYS, todayStatsKey()]).then((values) => {
    blocksToday = (values[todayStatsKey()] as { blocks?: number } | undefined)?.blocks ?? 0
    Object.assign(raw, values)
    state = toBlockState(raw)
    evaluate()
  }).catch(() => {})

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !contextAlive()) return

    const statsChange = changes[todayStatsKey()]
    if (statsChange) {
      blocksToday = (statsChange.newValue as { blocks?: number } | undefined)?.blocks ?? 0
      if (ui && overlayVisible && state) renderTexts(ui, state)
    }

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
    reason: HTMLElement
    message: HTMLElement
    focusMeta: HTMLElement
    blocksMeta: HTMLElement
    snoozeBtn: HTMLButtonElement
    focusBtn: HTMLButtonElement
  }

  let ui: Overlay | null = null
  let overlayVisible = false
  let savedOverflow: string | null = null // 顯示覆蓋層前頁面原本的 overflow
  let snoozeMinutes = 5
  let refreshTimer: ReturnType<typeof setInterval> | undefined

  // 設計 token 與 popup 相同（doc/style/style.md）；深色模式跟隨系統
  const STYLE = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .root {
      --brand: #009fb7;
      --ink-900: #05060f; --ink-700: #353535; --ink-600: #5e5e5e; --ink-500: #6b7280;
      --surface-card: #ffffff; --surface-subtle: #f8f8f9; --line-200: #e6e6ea; --line-300: #d9d9d9;
      --scrim: rgba(244, 244, 248, 0.82);
      font-family: 'Inter', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Hiragino Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    @media (prefers-color-scheme: dark) {
      .root {
        --ink-900: #f0f6fc; --ink-700: #c9d1d9; --ink-600: #8b949e; --ink-500: #8b949e;
        --surface-card: #161b22; --surface-subtle: #21262d; --line-200: #30363d; --line-300: #30363d;
        --scrim: rgba(13, 17, 23, 0.86);
      }
    }

    /* 遮罩：半透明底 + 2px 模糊；背後的影音已暫停，頁面靜止時合成成本很低 */
    #overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(ellipse 1100px 760px at 30% 0%, rgba(0, 159, 183, 0.22) 0%, rgba(0, 159, 183, 0.06) 50%, transparent 75%),
        var(--scrim);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    #overlay.visible { opacity: 1; pointer-events: all; }

    .card {
      width: 100%;
      max-width: 520px;
      padding: 40px 36px 32px;
      border-radius: 32px;
      border: 1px solid var(--line-200);
      background: var(--surface-card);
      box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1);
      text-align: center;
      color: var(--ink-700);
    }

    .logo { width: 56px; height: 56px; margin: 0 auto 20px; display: block; }

    .title {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: 0.02em;
      color: var(--ink-900);
    }
    .reason {
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--ink-600);
      word-break: break-word;
    }
    .message {
      margin-top: 20px;
      padding: 14px 18px;
      border-radius: 16px;
      background: rgba(0, 159, 183, 0.08);
      border: 1px solid rgba(0, 159, 183, 0.35);
      font-size: 16px;
      line-height: 1.6;
      color: var(--ink-900);
      word-break: break-word;
    }

    .meta {
      margin-top: 16px;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      background: var(--surface-subtle);
      border: 1px solid var(--line-300);
      color: var(--ink-600);
      font-variant-numeric: tabular-nums;
    }
    .pill.brand { background: rgba(0,159,183,.1); border-color: rgba(0,159,183,.2); color: var(--brand); }
    .pill[hidden] { display: none; }

    .actions { margin-top: 28px; display: flex; flex-direction: column; gap: 10px; }
    .btn {
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      padding: 14px 24px;
      border-radius: 16px;
      cursor: pointer;
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn:active { transform: translateY(1px); }
    .btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
    .btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
    .btn-primary {
      background: var(--brand);
      color: #fff;
      border: 1px solid rgba(0,159,183,.2);
      box-shadow: 0 5px 8px -5px rgba(0,159,183,.2), 0 13px 20px -4px rgba(0,159,183,.2);
    }
    .btn-primary:hover { background: rgba(0,159,183,.8); }
    .btn-ghost {
      background: transparent;
      color: var(--ink-600);
      border: 1px solid var(--line-300);
    }
    .btn-ghost:hover { background: var(--surface-subtle); }

    @media (prefers-reduced-motion: reduce) {
      #overlay, .btn { transition: none; }
    }
  `

  const LOGO = `
    <svg class="logo" viewBox="0 0 128 128" aria-hidden="true">
      <rect width="128" height="128" rx="30" fill="#009fb7"/>
      <path d="M42 94V62a22 22 0 0 1 44 0v32" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M28 98h72" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
      <circle cx="64" cy="72" r="8" fill="#fff"/>
    </svg>`

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

    const root = document.createElement('div')
    root.className = 'root'
    root.innerHTML = `
      <div id="overlay" role="dialog" aria-modal="true" aria-labelledby="limina-title">
        <div class="card">
          ${LOGO}
          <h1 class="title" id="limina-title"></h1>
          <p class="reason"></p>
          <p class="message"></p>
          <div class="meta">
            <span class="pill brand focus-meta"></span>
            <span class="pill blocks-meta"></span>
          </div>
          <div class="actions">
            <button class="btn btn-primary focus-btn"></button>
            <button class="btn btn-ghost snooze-btn"></button>
          </div>
        </div>
      </div>
    `
    shadow.append(style, root)
    document.documentElement.appendChild(host)

    const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T
    const created: Overlay = {
      host,
      overlay: $('#overlay'),
      title: $('.title'),
      reason: $('.reason'),
      message: $('.message'),
      focusMeta: $('.focus-meta'),
      blocksMeta: $('.blocks-meta'),
      snoozeBtn: $<HTMLButtonElement>('.snooze-btn'),
      focusBtn: $<HTMLButtonElement>('.focus-btn'),
    }

    // 「休息 N 分鐘」→ 暫停封鎖；覆蓋層由 storage.onChanged（snoozeUntil）觸發隱藏
    created.snoozeBtn.addEventListener('click', () => {
      created.snoozeBtn.disabled = true
      send({ type: 'SNOOZE', minutes: snoozeMinutes })
    })

    // 「回去專注」→ 關閉這個分頁
    created.focusBtn.addEventListener('click', () => send({ type: 'CLOSE_TAB' }))

    return created
  }

  function renderTexts(o: Overlay, s: BlockState): void {
    const { settings, timer } = s
    const lang: Lang = resolveLang(settings.language)
    const t = (key: string, params?: Record<string, string | number>) => translate(lang, key, params)
    snoozeMinutes = settings.snoozeDuration || 5

    o.title.textContent = t('overlay.title')
    o.reason.textContent = blockReason(s, location.href) === 'focus-whitelist'
      ? t('overlay.reasonFocusWhitelist')
      : t('overlay.reasonBlocklist', { domain: location.hostname })
    o.message.textContent = settings.blockerMessage || t('overlay.defaultMessage')

    const focusLeft = timer.isActive && timer.endTime ? timer.endTime - Date.now() : 0
    o.focusMeta.hidden = focusLeft <= 0
    o.focusMeta.textContent = focusLeft > 0
      ? t('overlay.focusRemaining', { time: formatDuration(lang, focusLeft, 'ceil') })
      : ''
    o.blocksMeta.hidden = blocksToday <= 0
    o.blocksMeta.textContent = t('overlay.blockedToday', { n: blocksToday })

    o.focusBtn.textContent = t('overlay.focus')
    o.snoozeBtn.textContent = t('overlay.snooze', { min: snoozeMinutes })
    // 隱藏休息按鈕：封鎖頁不提供放行選項
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
    pauseMedia()
    if (!overlayVisible) {
      overlayVisible = true
      blocksToday += 1 // 先樂觀顯示，背景寫入後 onChanged 會校正
      send({ type: 'BLOCK_HIT' })
      ui.host.style.pointerEvents = 'all'
      ui.overlay.classList.add('visible')
      // 防止頁面捲動，並記住原值以便還原
      savedOverflow = document.documentElement.style.overflow
      document.documentElement.style.overflow = 'hidden'
      ui.focusBtn.focus({ preventScroll: true })
      // 專注剩餘時間每 30 秒更新
      refreshTimer = setInterval(() => { if (ui && state) renderTexts(ui, state) }, 30_000)
    }
    renderTexts(ui, s)
  }

  function hideOverlay(): void {
    if (!overlayVisible || !ui) return
    overlayVisible = false
    clearInterval(refreshTimer)
    ui.host.style.pointerEvents = 'none'
    ui.overlay.classList.remove('visible')
    document.documentElement.style.overflow = savedOverflow ?? ''
    savedOverflow = null
  }
})()
