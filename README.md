<div align="center">
  <img src="app/public/icons/icon128.png" alt="Limina Logo" width="128" />
  <h1>Limina ⏳</h1>
  <p><strong>一款設計精美、嚴格且能有效提升生產力的 Google Chrome 擴充功能。</strong></p>
  <p><i>前身為 NerdTimer。</i></p>

  <p>
    <a href="#features">功能特色</a> •
    <a href="#installation">如何安裝</a> •
    <a href="#development">開發指南</a> •
    <a href="#tech-stack">技術棧</a>
  </p>
</div>

---

## 📖 關於 Limina

Limina 是一款專為幫助您重拾專注力、停止在干擾網站上浪費時間而設計的 Chrome 擴充功能。它作為一個嚴格的生產力計時器，採用了「白名單優先」的封鎖引擎。當計時器啟動時，您可以選擇封鎖特定的干擾網站，或是僅允許工作所需的特定工具網站。

擁有現代化的玻璃擬物化 (Glassmorphism) 介面、可自訂的設定以及本地數據統計，Limina 是學生、開發者以及任何正與數位拖延症抗爭的人的完美工具。

## ✨ 功能特色

- 🛡️ **白名單優先的封鎖引擎 (Whitelist-First)**：預設情況下，所有網站都能正常瀏覽。但您可以將特定網站設定為「封鎖 (Locked)」。
- 🎯 **專注計時器 (Focus Timer)**：為您的深度工作時段設定專屬計時器。
- 🔥 **嚴格模式 (Strict Mode)**：啟用後，計時器會移除封鎖頁面上的「暫停 (Snooze)」按鈕，且*僅*允許您明確加入「白名單 (Whitelist)」的網站。其餘所有網站都會被封鎖。
- 🌴 **自由時間模式 (Free Time Mode)**：在計時器未執行時放鬆一下。您可以設定讓封鎖器完全暫停，直到您開始下一個專注時段。
- 📊 **螢幕時間統計 (Screen Time Statistics)**：自動追蹤您在不同網域上花費的時間，並將您每日的專注趨勢與最常造訪網站視覺化（資料均存於本地）。
- 💤 **貪睡功能 (Snooze)**：需要在 Reddit 上短暫休息 5 分鐘嗎？可以暫時讓封鎖器貪睡一下。
- 🎨 **絕美的玻璃擬物介面 (Glassmorphism UI)**：令人驚豔、現代且具備豐富動畫的介面，支援流暢的轉場與深色模式。
- 🌍 **多語系支援 (Localization)**：支援英文、繁體中文與日文。
- 🔒 **隱私優先 (Privacy First)**：您所有的數據、封鎖名單與統計資料都只會使用 `chrome.storage.local` 儲存於您的設備本地端。不包含任何外部追蹤器或伺服器。

## 🚀 如何安裝

### 從原始碼安裝 (開發者模式)

1. 複製此儲存庫：
   ```bash
   git clone https://github.com/yourusername/limina.git
   ```
2. 進入 `app` 目錄並安裝依賴套件：
   ```bash
   cd limina/app
   npm install
   ```
3. 編譯擴充功能：
   ```bash
   npm run build
   ```
4. 打開 Google Chrome 並前往 `chrome://extensions/`。
5. 在右上角啟用 **開發人員模式 (Developer mode)**。
6. 點擊 **載入未封裝項目 (Load unpacked)** 並選擇位於 `limina/app` 目錄下的 `dist` 資料夾 (`limina/app/dist`)。

## 🛠️ 開發指南

Limina 使用現代網頁技術建置，前端採用 Vue 3 Composition API，背景作業則使用 Service Workers (符合 Manifest V3 規範)。

# 技術棧

- **框架**: [Vue 3](https://vuejs.org/) (Composition API)
- **打包工具**: 搭配 [`@crxjs/vite-plugin`](https://crxjs.dev/vite-plugin) 的 [Vite](https://vitejs.dev/)
- **樣式**: [Tailwind CSS](https://tailwindcss.com/)
- **狀態管理**: [Pinia](https://pinia.vuejs.org/)
- **圖表**: [Chart.js](https://www.chartjs.org/) + `vue-chartjs`
- **語言**: TypeScript

## 可用腳本

在 `app` 目錄中：

- `npm run dev` - 啟動包含 HMR (熱重載) 的 Vite 開發伺服器以進行擴充功能開發。
- `npm run build` - 用於生產環境的編譯打包，會輸出至 `dist` 資料夾。
- `npm run check` - 執行 TypeScript 型別檢查。

## 📂 專案結構

```
limina/
├── app/
│   ├── public/             # 靜態資源 (圖示等)
│   ├── src/
│   │   ├── background/     # Service Worker (時間追蹤、快取機制、鬧鐘)
│   │   ├── content/        # Content Scripts (注入頁面的封鎖浮層)
│   │   ├── popup/          # Main Vue App (擴充功能的彈出視窗 UI)
│   │   ├── locales/        # i18n 多語系檔案 (en, zh-TW, ja)
│   │   ├── types/          # 全域 TypeScript 型別介面
│   │   └── composables/    # 共用的 Vue composables (例如: useI18n)
│   ├── manifest.json       # Chrome 擴充功能 Manifest V3
│   └── package.json
└── doc/                    # 專案文件 (PRD, 程式碼審查報告)
```

## 📝 授權條款

MIT License
