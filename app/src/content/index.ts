// src/content/index.ts
// Limina 2.0 — Content Script
// 使用 Shadow DOM 隔離覆蓋層，避免與頁面樣式衝突

(function () {
  'use strict'

  // 避免重複注入
  if (document.getElementById('__limina-host__')) return

  let overlayVisible = false
  let stopForThisTime = false // 本次忽略狀態

  const i18nDict = {
    en: {
      blockedTitle: 'Limina blocked this site',
      snoozeText: (m: number) => `⏱ Snooze for ${m} min`,
      ignoreText: 'Start Focusing!!!!',
      footer: 'Limina 2.0 — Nerd Timer',
    },
    'zh-TW': {
      blockedTitle: 'Limina 阻擋了此網站',
      snoozeText: (m: number) => `⏱ 讓我休息 ${m} 分鐘`,
      ignoreText: '開始專注!!!!',
      footer: 'Limina 2.0 — 廢宅計時器',
    },
    ja: {
      blockedTitle: 'Limina がこのサイトをブロックしました',
      snoozeText: (m: number) => `⏱ ${m} 分間スヌーズ`,
      ignoreText: '集中しろ!!!!',
      footer: 'Limina 2.0 — オタクタイマー',
    }
  }

  function getLang(settingsLang: string = 'auto') {
    if (settingsLang === 'auto') {
      const l = navigator.language
      return l.startsWith('zh') ? 'zh-TW' : l.startsWith('ja') ? 'ja' : 'en'
    }
    return (settingsLang as keyof typeof i18nDict) || 'en'
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
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', 'Noto Sans TC', sans-serif;
    }

    #nerd-overlay {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      /* 與 App 一致的深色漸層背景，加上強烈毛玻璃 */
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
      font-family: 'SF Mono', 'Fira Code', monospace;
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

    /* Ignore（開始專注）：主色 teal 漸層 */
    .nerd-btn-ignore {
      background: linear-gradient(135deg, #088396, #066878);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(8, 131, 150, 0.45);
      border: none;
    }
    .nerd-btn-ignore:hover {
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
      <div class="nerd-title" id="nerd-title">Limina blocked this site</div>
      <div class="nerd-message" id="nerd-msg">You shall not pass!</div>
      <div class="nerd-domain" id="nerd-domain"></div>
      <div class="nerd-btn-group" id="nerd-btn-group">
        <button class="nerd-btn nerd-btn-snooze" id="nerd-btn-snooze">
          ⏱ Snooze for 5 min
        </button>
        <button class="nerd-btn nerd-btn-ignore" id="nerd-btn-ignore">
          I know, close this
        </button>
      </div>
      <div class="nerd-footer" id="nerd-footer">Limina 2.0</div>
    </div>
  `

  shadow.appendChild(style)
  shadow.appendChild(overlay)

  // ── 初始化按鈕狀態 ─────────────────────────────────────
  async function initOverlay(): Promise<void> {
    // 取得設定
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      if (!res?.success) return
      const settings = res.data
      const langKey = getLang(settings.language)
      const texts = i18nDict[langKey]

      const titleEl = shadow.getElementById('nerd-title')
      const msgEl = shadow.getElementById('nerd-msg')
      const domainEl = shadow.getElementById('nerd-domain')
      const snoozeBtn = shadow.getElementById('nerd-btn-snooze') as HTMLButtonElement
      const ignoreBtn = shadow.getElementById('nerd-btn-ignore') as HTMLButtonElement
      const footerEl = shadow.getElementById('nerd-footer')

      if (titleEl) titleEl.textContent = texts.blockedTitle
      if (footerEl) footerEl.textContent = texts.footer
      if (ignoreBtn) ignoreBtn.textContent = texts.ignoreText
      if (msgEl) msgEl.textContent = settings.blockerMessage || 'You shall not pass! 🧙‍♂️'
      if (domainEl) domainEl.textContent = location.hostname

      // 更新 snooze 按鈕文字
      if (snoozeBtn) {
        snoozeBtn.textContent = texts.snoozeText(settings.snoozeDuration || 5)
      }

      // 嚴格模式：隱藏按鈕
      const btnGroup = shadow.getElementById('nerd-btn-group')
      if (btnGroup) {
        btnGroup.style.display = settings.isSnoozeHidden ? 'none' : 'flex'
      }
    })
  }

  function showOverlay(): void {
    if (overlayVisible) return
    overlayVisible = true
    host.style.pointerEvents = 'all'
    overlay.classList.add('visible')
    // 防止頁面捲動
    document.body.style.overflow = 'hidden'
    void initOverlay()
  }

  function hideOverlay(): void {
    if (!overlayVisible) return
    overlayVisible = false
    host.style.pointerEvents = 'none'
    overlay.classList.remove('visible')
    document.body.style.overflow = ''
  }

  // ── 按鈕事件 ───────────────────────────────────────────
  const snoozeBtn = shadow.getElementById('nerd-btn-snooze')

  // 「開始專注!!!!」→ 什麼都不做，繼續封鎖（鼓勵按鈕，覆蓋層保持顯示）
  shadow.getElementById('nerd-btn-ignore')?.addEventListener('click', () => {
    // intentionally no-op: keep blocking overlay visible
  })

  // 「⏱ 讓我休息 N 分鐘」→ 關閉覆蓋層並啟動倒計時
  snoozeBtn?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      const minutes = res?.data?.snoozeDuration ?? 5
      chrome.runtime.sendMessage({ type: 'SET_TIMER', minutes }, () => {
        stopForThisTime = true
        hideOverlay()
      })
    })
  })

  // ── 監聽 Storage 變化 (Pull 模式) ────────────────────────
  chrome.storage.onChanged.addListener((changes) => {
    // 當相關設定或狀態改變時，主動重新檢查當前網址是否該被封鎖
    if (changes.timerState || changes.settings || changes.snoozeUntil || changes.blocklist) {
      if (!stopForThisTime) {
        checkAndShow()
      }
    }
  })

  // ── 初始化：頁面載入時立即查詢封鎖狀態 ─────────────────
  function checkAndShow(): void {
    if (stopForThisTime) return
    chrome.runtime.sendMessage(
      { type: 'GET_STATUS', url: location.href },
      (res) => {
        if (res?.data?.status === 'locked') {
          showOverlay()
        } else {
          hideOverlay()
        }
      },
    )
  }

  // 延遲確保 DOM 就緒
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShow)
  } else {
    checkAndShow()
  }
})()
