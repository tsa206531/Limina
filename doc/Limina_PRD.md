# Limina 2.0 — 產品需求文件（PRD）

> **版本**：v1.0  
> **建立日期**：2026-02-25  
> **狀態**：草稿（Draft）  
> **文件類型**：逆向工程 PRD（由現有程式碼反推）+ 新版規格  
> **負責人**：產品顧問

---

## 一、專案整體定位推測

### 🎯 專案目標

Limina（廢宅計時器）是一款 **Chrome 瀏覽器擴充功能**，旨在幫助使用者建立健康的上網習慣。透過主動封鎖讓人分心的網站、計時器倒數激勵機制，以及視覺化時間統計，協助使用者在工作或學習時維持專注。

### 👥 目標使用者

| 使用者類型             | 描述                         | 核心痛點                         |
| ---------------------- | ---------------------------- | -------------------------------- |
| **主要：自律型工作者** | 自由工作者、遠端工作者、學生 | 容易受到社群媒體、娛樂網站干擾   |
| **次要：效率優化者**   | 希望量化自己上網行為的人     | 不清楚自己在哪些網站花了多少時間 |
| **潛在：家長或教師**   | 希望幫孩子或學生管控上網時間 | 缺少輕量的瀏覽器端工具           |

### 🔑 解決的核心問題

1. **分心問題**：使用者在工作時不自覺打開社群媒體或遊戲網站
2. **時間黑洞**：無法直觀感知自己在特定網站花費多少時間
3. **意志力疲勞**：依賴自制力，沒有外部機制輔助

### 💼 推測商業模式

當前版本為**免費個人工具**，未見任何商業化設計。重寫後潛在商業模式：

| 模式                 | 說明                           | 可行性   |
| -------------------- | ------------------------------ | -------- |
| 免費增值（Freemium） | 基礎封鎖免費，進階分析報表付費 | ⭐⭐⭐⭐ |
| 訂閱制（SaaS）       | 跨裝置同步數據月費方案         | ⭐⭐⭐   |
| 一次性購買           | Chrome Web Store 付費下載      | ⭐⭐     |

---

## 二、功能模組拆解

| 模組名稱                     | 功能說明                                   | 使用對象           | 是否核心 | 備註                             |
| ---------------------------- | ------------------------------------------ | ------------------ | -------- | -------------------------------- |
| **網站封鎖引擎**             | 依照鎖定名單偵測並封鎖當前分頁             | 使用者（背景執行） | ✅ 核心  | 全專案最核心邏輯                 |
| **白名單管理**               | 加入永遠允許的網站，跳過封鎖               | 使用者             | ✅ 核心  | 防誤封鎖機制                     |
| **鎖定名單管理**             | 管理需要封鎖的網站名單（網域層級）         | 使用者             | ✅ 核心  | 支援子網域匹配                   |
| **封鎖覆蓋層（Blocker UI）** | 瀏覽被封鎖網站時顯示提醒覆蓋畫面           | 使用者（被觸發）   | ✅ 核心  | 可自訂訊息與 HTML                |
| **暫時忽略（Snooze）**       | 封鎖覆蓋層上提供「N 分鐘後再提醒」按鈕     | 使用者             | ✅ 核心  | 唯一逃脫機制，防止使用者過度挫折 |
| **倒數計時器**               | 使用者自設分鐘數、倒數至 0 後解除封鎖      | 使用者             | ✅ 核心  | 工作計時功能                     |
| **時間記錄引擎**             | 後台自動記錄各網域停留時間（毫秒級）       | 系統自動           | ✅ 核心  | 分析功能的資料來源               |
| **統計圖表**                 | 顯示過去 N 天的上網時間分佈圓餅圖 / 柱狀圖 | 使用者             | 🔶 重要  | 使用 popupChart.js，功能較基本   |
| **自訂封鎖畫面**             | 使用者可輸入 HTML/CSS/JS 自訂覆蓋層外觀    | 進階使用者         | 🔵 可選  | 功能有趣但複雜度高，使用率低     |
| **開關功能（Kill Switch）**  | 一鍵關閉所有封鎖，背景變紅提示狀態         | 使用者             | ✅ 核心  | 緊急解封機制                     |
| **隱藏 Snooze 按鈕**         | 設定可完全隱藏「暫時忽略」按鈕，強化封鎖   | 使用者             | 🔵 可選  | 為自律要求高的使用者設計         |
| **自訂提醒文字**             | 使用者可設定覆蓋層上的自訂激勵文字         | 使用者             | 🔶 重要  | 個人化程度佳                     |
| **資料匯出 / 匯入**          | 將全部設定與時間記錄匯出 JSON 備份         | 使用者             | 🔶 重要  | 換裝置時使用                     |
| **清除所有資料**             | 一鍵清除所有設定與時間記錄                 | 使用者             | 🔵 可選  | 需二次確認防誤操作               |
| **圖示徽章（Badge）**        | 計時器倒數時在擴充圖示上顯示剩餘時間       | 使用者（提示）     | 🔶 重要  | 不佔視覺空間的狀態提示           |
| **換日自動歸零**             | 每日 0:00 自動重置當日統計並歸檔           | 系統自動           | ✅ 核心  | 資料日期邊界處理                 |

---

## 三、核心業務流程（Flow）

### 🔁 流程 A：封鎖網站（主核心流程）

```
[使用者開啟瀏覽器]
  → [Background Service Worker 啟動，載入封鎖名單]
  → [使用者切換/開啟 Tab]
  → [Tab URL 被觸發至 Background]
  → [checkBlock(purifiedUrl)]
      → 白名單命中 → 通知 Content Script 隱藏覆蓋層
      → 鎖定名單命中 → 通知 Content Script 顯示封鎖覆蓋層
      → 無命中 → 通知 Content Script 隱藏覆蓋層
  → [Content Script 接收訊息，顯示/隱藏 #nerdDiv 覆蓋層]
  → [使用者選擇]
      → 點擊「提醒我等 N 分鐘」→ Snooze Timer 啟動 → N 分鐘後重新封鎖
      → 點擊「我知道了，關閉」→ stopForThisTime=true，本分頁暫停封鎖
```

### ⏱ 流程 B：使用計時器（專注工作）

```
[使用者開啟 Popup]
  → [輸入工作分鐘數（e.g., 25 分鐘）]
  → [點擊「開始」]
  → [Background 開始倒數，圖示 Badge 顯示剩餘時間]
  → [Popup 顯示倒數計時 00:25:00]
  → [計時期間：允許所有網站（isWaitingTimer=true 時封鎖暫停）]
  → [計時結束]
      → Badge 消失
      → 封鎖機制恢復
  → [使用者可提早取消計時器]
```

> ⚠️ **現有設計疑問**：計時器啟動時，封鎖是「開放」還是「繼續封鎖」？
> 從程式碼推測：`isWaitingTimer=true` 時，封鎖**暫停**（不阻擋任何網站），意味著計時器是作為「工作獎勵時間」，但設計語意不明確。**重寫時需明確定義。**

### 📊 流程 C：查看統計數據

```
[使用者開啟 Popup]
  → [點擊「統計」按鈕]
  → [Background 持續記錄當前分頁停留時間（doTimeRecord）]
  → [統計頁面載入：讀取 chrome.storage 中的時間記錄]
  → [圖表渲染：選擇日期範圍（今天/過去 7 天/過去 N 天）]
  → [可選：切換查看特定網站的時間趨勢]
```

### ➕ 流程 D：新增網站至名單

```
[使用者開啟 Popup]
  → [當前分頁網域顯示在頂部]
  → [選擇操作]
      → 「快速加入鎖定」→ 自動加入基礎網域（e.g., youtube.com）
      → 「加入鎖定（更多）」→ 顯示所有可選子網域讓使用者選擇
      → 「快速加入白名單」→ 加入當前完整頁面 URL
      → 「加入白名單（更多）」→ 顯示所有可選層次讓使用者選擇
  → [名單儲存至 chrome.storage]
  → [通知 Background 重新載入名單]
  → [Background 重新評估當前分頁狀態]
```

---

## 四、核心資料模型推測

### 🗂 核心實體（Entities）

#### Entity 1：`BlockList`（封鎖名單）

| 欄位        | 類型                | 說明                                 |
| ----------- | ------------------- | ------------------------------------ |
| `type`      | `'soft' \| 'white'` | 鎖定類型                             |
| `domain`    | `string`            | 網域字串（e.g., `youtube.com`）      |
| `createdAt` | `Date`              | 加入時間（現有版本未記錄，重寫需補） |

> 現有版本儲存格式：`youtube.com::facebook.com::twitter.com`（脆弱的字串，重寫改 JSON）

#### Entity 2：`TimeRecord`（時間記錄）

| 欄位       | 類型                               | 說明                        |
| ---------- | ---------------------------------- | --------------------------- |
| `domain`   | `string`                           | 網域                        |
| `totalMs`  | `number`                           | 總計停留毫秒（所有時間）    |
| `dailyMs`  | `Record<string, number>`           | 以日期為 key 的每日停留毫秒 |
| `category` | `'white' \| 'locked' \| 'neutral'` | 動態計算分類                |

> 現有版本使用 `timeRecord-YYYY/M/D` 作為 key 分散儲存，重寫整合為結構化物件。

#### Entity 3：`Settings`（應用程式設定）

| 欄位                | 類型             | 預設值                  | 說明                  |
| ------------------- | ---------------- | ----------------------- | --------------------- |
| `isEnabled`         | `boolean`        | `true`                  | 全域封鎖開關          |
| `snoozeDuration`    | `number`         | `5`                     | Snooze 按鈕顯示分鐘數 |
| `isSnoozeHidden`    | `boolean`        | `false`                 | 是否隱藏 Snooze 按鈕  |
| `blockerMessage`    | `string`         | `"You shall not pass!"` | 封鎖覆蓋層訊息        |
| `customBlockerHtml` | `string \| null` | `null`                  | 自訂封鎖畫面 HTML     |
| `installDate`       | `string`         | ISO Date                | 用於計算統計日期範圍  |

#### Entity 4：`TimerState`（計時器狀態）

| 欄位           | 類型      | 說明                             |
| -------------- | --------- | -------------------------------- |
| `remainingSec` | `number`  | 剩餘秒數（0 表示無計時器）       |
| `isActive`     | `boolean` | 是否進行中                       |
| `lastInputMin` | `number`  | 上次輸入的分鐘數（方便快速重啟） |

### 🔗 實體關係

```
Settings 1 ── owns ── N BlockList（白名單 & 鎖定名單）
BlockList.domain ─── links to ─── TimeRecord.domain
TimerState ─── affects ─── BlockList（計時中時封鎖暫停）
Settings 1 ── owns ── 1 TimerState
Settings 1 ── owns ── N TimeRecord（按網域索引）
```

---

## 五、重寫建議

### ✅ 必須保留的核心能力

| 能力                          | 原因                               |
| ----------------------------- | ---------------------------------- |
| 即時 URL 封鎖判斷             | 這是整個產品的核心價值主張         |
| 白名單 / 鎖定名單（網域層級） | 基礎功能，使用者最常用             |
| Snooze 暫時忽略機制           | 沒有此機制，使用者體驗會過於挫折   |
| 全域開關（Kill Switch）       | 緊急需求，必須保留                 |
| 倒數計時器 + Badge 顯示       | 次核心功能，使用者反饋良好         |
| 時間記錄與統計圖表            | 提供動機與自我反省，長期留存率關鍵 |
| 資料匯出 / 匯入               | 使用者資料主權，信任度關鍵         |
| 換日自動歸零與歸檔            | 資料完整性必須                     |

### 🔶 可優化部分

| 項目         | 現況問題                              | 優化方向                                 |
| ------------ | ------------------------------------- | ---------------------------------------- |
| 資料序列化   | 使用 `key\|\|value::` 脆弱字串        | 改為 JSON + IndexedDB                    |
| 統計圖表     | 功能陽春，無篩選器、無趨勢線          | 升級為 Chart.js 或 ECharts，加入更多維度 |
| URL 比對邏輯 | 只做字串完全匹配                      | 支援萬用字元（`*.youtube.com`）與 Regex  |
| Popup 導覽   | 使用 CSS 動畫模擬頁籤切換，效果不穩定 | 改為 Vue Router 管理頁面狀態             |
| 圖示更新     | 僅有「鎖定/未鎖定」兩種圖示           | 增加「計時中」圖示狀態                   |

### 🗑 可刪除或合併功能

| 項目                      | 建議          | 原因                                                      |
| ------------------------- | ------------- | --------------------------------------------------------- |
| `hardLockList`（硬封鎖）  | ❌ 刪除       | 已被廢棄，從未完整實作，相關程式碼全為注解                |
| `singlePage` 層級鎖定     | ❌ 刪除或推遲 | 已廢棄，使用率低，增加複雜度                              |
| 舊版 Chrome 20-25 相容    | ❌ 刪除       | Chrome 20-25 不再受支援，已無意義                         |
| 自訂封鎖畫面（HTML 注入） | ⚠️ 推遲 v2.0  | 功能有趣但安全性風險高（XSS），建議 v3.0 再以沙盒方式實作 |

### 🏗 架構重設建議

```
新架構（Chrome Extension MV3 + Vue 3）

┌─────────────────────────────────────────────────────────┐
│                   Chrome Extension                       │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Popup     │  │  Service     │  │   Content     │  │
│  │  (Vue 3 SPA)│  │  Worker      │  │   Script      │  │
│  │             │  │  (Background)│  │ (Vanilla JS)  │  │
│  │ ┌─────────┐ │  │              │  │               │  │
│  │ │ Router  │ │  │ BlockEngine  │  │ BlockerOverlay│  │
│  │ │ - Home  │ │  │ TimerService │  │ MessageBridge │  │
│  │ │ - Stats │ │  │ TimeTracker  │  │               │  │
│  │ │ - Lists │ │  │ StorageService│ │               │  │
│  │ │ - Settings│ │ AlarmService  │  │               │  │
│  │ └─────────┘ │  │              │  │               │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│         │               │                 │             │
│         └───────────────┼─────────────────┘             │
│                         │ chrome.runtime.sendMessage     │
│              ┌──────────▼────────────┐                  │
│              │   StorageService      │                  │
│              │  (chrome.storage API) │                  │
│              │   JSON 格式化儲存      │                  │
│              └───────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

**分層原則**：

- `Service Worker`：純業務邏輯，無 DOM 依賴
- `Popup`：純 UI 展示，透過 Message API 與 SW 溝通
- `Content Script`：最小化，只負責覆蓋層渲染與使用者互動回報

---

## 六、PRD 草稿（正式版）

---

### 1. 產品背景

現代人在瀏覽器中花費大量時間，但其中不乏大量「無意識的」分心瀏覽行為。Limina 1.x 作為一款 Chrome 擴充功能，已具備網站封鎖與時間統計的雛形，但受限於技術債（Manifest V2 淘汰、單體架構、無測試），已無法持續演進。

**Limina 2.0** 是一次完整重寫，目標是在保留核心使用體驗的前提下，以現代技術棧重建可維護、可擴充、可測試的架構基礎，並改善使用者介面與資料可靠性。

---

### 2. 產品目標

#### 主要目標（OKR 導向）

| 目標                   | 關鍵結果                                           |
| ---------------------- | -------------------------------------------------- |
| 幫助使用者減少分心瀏覽 | 封鎖名單內網站平均停留時間下降 30%（使用 60 天後） |
| 提升產品可用性         | Chrome Web Store 評分 ≥ 4.5 顆星                   |
| 提升技術品質           | 單元測試覆蓋率 ≥ 80%，Lighthouse Performance ≥ 90  |

#### 限制條件

- Chrome Extension Manifest V3 合規
- 不使用任何外部伺服器（全本機資料，保護隱私）
- Popup 載入時間 < 300ms

---

### 3. 功能需求（FR）

#### FR-01：網站封鎖管理

| ID      | 功能                                                   | 優先級 | 驗收標準                                  |
| ------- | ------------------------------------------------------ | ------ | ----------------------------------------- |
| FR-01-1 | 使用者可將當前分頁網域加入「鎖定名單」                 | P0     | 加入後當前頁立即觸發封鎖覆蓋層            |
| FR-01-2 | 使用者可將當前分頁網域加入「白名單」                   | P0     | 加入後不再被封鎖，優先級高於鎖定名單      |
| FR-01-3 | 快速加入（自動使用基礎網域）與精細加入（手動選擇層次） | P1     | 精細加入需顯示當前 URL 的所有子路徑供選擇 |
| FR-01-4 | 使用者可從名單中移除條目，移除後即時更新封鎖狀態       | P0     | 移除後當前被封鎖頁面應立即解除            |
| FR-01-5 | 支援萬用字元匹配（e.g., `*.reddit.com`）               | P2     | v2.0 支援完整網域，萬用字元為 v2.1        |

#### FR-02：封鎖覆蓋層（Blocker Overlay）

| ID      | 功能                                       | 優先級 | 驗收標準                             |
| ------- | ------------------------------------------ | ------ | ------------------------------------ |
| FR-02-1 | 瀏覽鎖定網站時全畫面覆蓋提醒層             | P0     | z-index 最高層，無法通過鍵盤操作繞過 |
| FR-02-2 | 覆蓋層顯示使用者自訂激勵訊息               | P1     | 預設文字可在設定中修改               |
| FR-02-3 | Snooze 按鈕：「N 分鐘後再提醒」            | P0     | 點擊後覆蓋層消失，N 分鐘後恢復       |
| FR-02-4 | 本次忽略按鈕：「我知道了」                 | P0     | 點擊後本分頁停止封鎖，關閉分頁後重置 |
| FR-02-5 | 設定中可隱藏 Snooze 與忽略按鈕（嚴格模式） | P1     | 開啟嚴格模式後覆蓋層不可關閉         |

#### FR-03：倒數計時器

| ID      | 功能                                           | 優先級 | 驗收標準                                        |
| ------- | ---------------------------------------------- | ------ | ----------------------------------------------- |
| FR-03-1 | 使用者可設定 1-999 分鐘的倒數計時              | P0     | 輸入非數字時不允許提交                          |
| FR-03-2 | 計時期間圖示 Badge 顯示剩餘時間（秒/分/時）    | P1     | Badge 顏色：計時中綠色，最後 60 秒紅色          |
| FR-03-3 | Popup 顯示即時倒數（hh:mm:ss 格式）            | P0     | 重開 Popup 能正確顯示剩餘時間                   |
| FR-03-4 | 計時結束時系統通知（Chrome Notification）      | P1     | 使用者可在設定關閉通知                          |
| FR-03-5 | 計時中封鎖邏輯可設定「暫停封鎖」或「繼續封鎖」 | P1     | **🚨 重寫需明確定義語意，建議預設「繼續封鎖」** |

#### FR-04：時間統計與圖表

| ID      | 功能                                           | 優先級 | 驗收標準                         |
| ------- | ---------------------------------------------- | ------ | -------------------------------- |
| FR-04-1 | 記錄每個網域每日停留時間                       | P0     | 精確度誤差 < 5 秒                |
| FR-04-2 | 顯示今日上網時間圓餅圖（鎖定 / 白名單 / 中性） | P0     | 分類正確，hover 顯示具體時間     |
| FR-04-3 | 顯示過去 N 天每日總時間趨勢柱狀圖              | P1     | 可選 7/14/30 天                  |
| FR-04-4 | 可選擇特定網域查看其歷史趨勢                   | P1     | 下拉選單列出前 10 個最常造訪網站 |
| FR-04-5 | 換日（00:00）自動儲存當日資料並重置今日計數    | P0     | 跨日儲存不遺漏數據               |

#### FR-05：設定管理

| ID      | 功能                             | 優先級 | 驗收標準                            |
| ------- | -------------------------------- | ------ | ----------------------------------- |
| FR-05-1 | 全域開關：一鍵啟用/停用所有封鎖  | P0     | 關閉時 Popup 背景色改變（視覺提示） |
| FR-05-2 | 設定 Snooze 按鈕預設時間         | P1     | 1-60 分鐘，預設 5 分鐘              |
| FR-05-3 | 嚴格模式：隱藏 Snooze 與忽略按鈕 | P1     | 開啟後封鎖層不可手動關閉            |
| FR-05-4 | 自訂封鎖訊息文字                 | P1     | 最多 100 字元                       |
| FR-05-5 | 資料匯出（JSON）                 | P1     | 包含所有名單與時間記錄              |
| FR-05-6 | 資料匯入（JSON 驗證後覆蓋）      | P1     | 匯入前需顯示確認對話框              |
| FR-05-7 | 清除所有資料（二次確認）         | P1     | 清除後顯示成功訊息                  |

---

### 4. 非功能需求（NFR）

| 類別         | 需求                  | 驗收標準                                   |
| ------------ | --------------------- | ------------------------------------------ |
| **效能**     | Popup 首次渲染        | < 300ms                                    |
| **效能**     | 封鎖判斷延遲          | < 50ms（URL 變更到覆蓋層出現）             |
| **可靠性**   | 資料持久化            | chrome.storage 寫入失敗需 retry + 錯誤提示 |
| **安全性**   | MV3 CSP 合規          | 不使用 eval、不執行 inline script          |
| **安全性**   | 自訂 HTML（未來功能） | 必須在 Sandboxed iframe 中執行             |
| **隱私性**   | 資料本機化            | 絕不傳送任何資料至外部伺服器               |
| **可用性**   | 支援瀏覽器            | Chrome 100+（MV3 完整支援起始版本）        |
| **可維護性** | 測試覆蓋率            | 業務邏輯層（Service Layer）≥ 80%           |
| **可存取性** | 鍵盤導覽              | Popup 所有操作可純鍵盤完成                 |

---

### 5. 成功指標（KPI）

| 指標                  | 目標值             | 測量方式                  |
| --------------------- | ------------------ | ------------------------- |
| Chrome Web Store 評分 | ≥ 4.5 ★            | Web Store Console         |
| 7 天留存率            | ≥ 40%              | 安裝後第 7 天仍有封鎖記錄 |
| 封鎖觸發 / 忽略比例   | 忽略率 < 30%       | 本機事件記錄              |
| Popup 啟動速度        | p95 < 300ms        | Performance API           |
| Bug 回報率            | 每月 < 5 個 P0 Bug | GitHub Issues             |

---

### 6. 技術棧規格

#### 6.1 前端（Popup SPA）

| 層次     | 技術                                   | 版本 / 說明                               |
| -------- | -------------------------------------- | ----------------------------------------- |
| 框架     | **Vue 3**                              | Composition API + `<script setup>`        |
| 建構工具 | **Vite**                               | 搭配 `vite-plugin-web-extension` 或 CRXJS |
| 樣式     | **Tailwind CSS v3**                    | JIT 模式，自訂 glass-morphism utilities   |
| 型別系統 | **TypeScript 5**                       | strict 模式，所有核心接口均定義 Interface |
| 狀態管理 | **Pinia**                              | 輕量，適合 Extension 等非傳統 SPA         |
| 路由     | **Vue Router 4**                       | Hash Mode（管理 Popup 多頁面）            |
| 圖表     | **Chart.js 4** + vue-chartjs           | 輕量，支援 Doughnut & Bar                 |
| 動畫     | **Tailwind animate** + CSS Transitions | 細膩的 glass 動效                         |

#### 6.2 Background（Service Worker）

| 層次 | 技術                                       | 說明                                            |
| ---- | ------------------------------------------ | ----------------------------------------------- |
| 語言 | **TypeScript**                             | 編譯至 ES2020                                   |
| 計時 | **chrome.alarms API**                      | 取代 setInterval（MV3 Service Worker 沙盒限制） |
| 資料 | **chrome.storage.local**                   | JSON 格式化，不再使用自訂字串序列化             |
| 訊息 | **chrome.runtime.sendMessage / onMessage** | 統一 Command Pattern 處理                       |

#### 6.3 Content Script

| 層次 | 技術                                | 說明                       |
| ---- | ----------------------------------- | -------------------------- |
| 語言 | **TypeScript**（編譯至 Vanilla JS） | 最小化依賴，不引入任何框架 |
| 樣式 | Shadow DOM + CSS-in-JS              | 隔離與頁面樣式衝突         |

#### 6.4 型別定義（共用 Interface）

```typescript
// src/types/index.ts

export interface BlockListEntry {
  id: string;
  domain: string;
  type: "locked" | "white";
  createdAt: number; // Unix timestamp
}

export interface TimeRecord {
  domain: string;
  total: number; // ms
  daily: Record<string, number>; // "YYYY-MM-DD" -> ms
}

export interface AppSettings {
  isEnabled: boolean;
  snoozeDuration: number; // minutes
  isSnoozeHidden: boolean;
  blockerMessage: string;
  installDate: string; // "YYYY-MM-DD"
}

export interface TimerState {
  remainingSec: number;
  isActive: boolean;
  lastInputMin: number;
}

export type MessageType =
  | { type: "GET_STATUS"; url: string }
  | { type: "SET_TIMER"; minutes: number }
  | { type: "CANCEL_TIMER" }
  | { type: "ADD_BLOCK"; entry: Omit<BlockListEntry, "id" | "createdAt"> }
  | { type: "REMOVE_BLOCK"; id: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> }
  | { type: "GET_TIME_STATS"; dateRange: string[] }
  | { type: "EXPORT_DATA" }
  | { type: "IMPORT_DATA"; data: unknown }
  | { type: "CLEAR_ALL_DATA" };
```

#### 6.5 設計規範（Design System）

**主題：玻璃擬物（Glassmorphism）+ 淡黃色主色調**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fffef0",
          100: "#fffbcc",
          200: "#fff599",
          300: "#ffed66",
          400: "#ffe033", // 主色（淡黃）
          500: "#ffd000",
          600: "#d4a500",
        },
        glass: {
          bg: "rgba(255, 253, 200, 0.15)", // 玻璃背景
          border: "rgba(255, 248, 150, 0.30)", // 玻璃邊框
          shadow: "rgba(255, 220, 50, 0.20)", // 玻璃陰影
        },
      },
      backdropBlur: {
        glass: "12px",
        "glass-heavy": "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
};
```

**Glass Card 元件規範**：

```css
.glass-card {
  background: rgba(255, 253, 200, 0.12);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 248, 150, 0.3);
  box-shadow:
    0 8px 32px rgba(255, 220, 50, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}
```

**Popup 尺寸**：360px × 560px（固定寬度，響應式高度）

**字型**：`Inter` + `Noto Sans TC`（Google Fonts，預載入）

**動畫原則**：

- 頁面切換：`300ms ease-out` slide
- 按鈕 hover：`150ms ease` scale(1.02) + 光暈效果
- 名單項目進入：`staggered fade-up`（間隔 50ms）
- 計時器數字：`font-variant-numeric: tabular-nums`（防止跳動）

---

## 附錄 A：Popup 頁面結構

```
Popup（360 × 560px）
├── 頂部狀態列         → 當前網域 + 封鎖狀態指示
├── 頁籤導覽列
│   ├── [首頁]         → 快速操作（加入名單 + 計時器）
│   ├── [名單]         → 白名單/鎖定名單管理
│   ├── [統計]         → 圖表與時間分析
│   └── [設定]         → 全部設定項目
└── 內容區域
    ├── 首頁：
    │   ├── 快速加入鎖定 / 白名單按鈕
    │   ├── 計時器輸入 + 啟動按鈕
    │   └── 全域開關（Toggle）
    ├── 名單：
    │   ├── Tab：鎖定名單 / 白名單
    │   └── 可滾動清單 + 刪除按鈕
    ├── 統計：
    │   ├── 日期選擇器（今天/7天/自訂）
    │   ├── 圓餅圖（分類時間比例）
    │   └── 柱狀圖（每日趨勢）
    └── 設定：折疊式設定群組
```

---

## 附錄 B：封鎖優先級規則

```
算法：checkBlock(purifiedUrl)

1. 白名單優先：
   ├── 逐層比對 URL（從完整路徑到根網域）
   └── 命中白名單 → 立即返回 'white'（不再檢查鎖定名單）

2. 鎖定名單：
   ├── 逐層比對 URL
   └── 命中鎖定名單 → 返回 'locked'

3. 均未命中 → 返回 'none'

優先級：白名單 > 鎖定名單 > 未設定
```

---

## 附錄 C：MV3 計時器遷移說明

> ⚠️ MV3 Service Worker 會在閒置 30 秒後被瀏覽器終止，不能使用 `setInterval` 做長計時。

**解決方案：使用 `chrome.alarms` API**

```typescript
// TimerService.ts（Service Worker 中）
export const TimerService = {
  async start(minutes: number): Promise<void> {
    await chrome.alarms.create('limina', {
      delayInMinutes: minutes
    });
    // 每分鐘更新 Badge
    await chrome.alarms.create('limina-tick', {
      periodInMinutes: 1/60 // 每秒
    });
    await StorageService.setTimerState({
      isActive: true,
      remainingSec: minutes * 60,
      lastInputMin: minutes
    });
  },

  async cancel(): Promise<void> {
    await chrome.alarms.clear('limina');
    await chrome.alarms.clear('limina-tick');
    await StorageService.setTimerState({
      isActive: false,
      remainingSec: 0
    });
    chrome.action.setBadgeText({ text: '' });
  }
};

// Service Worker 監聽
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'limina') {
    await TimerService.cancel();
    chrome.notifications.create({ ... }); // 完成通知
  }
  if (alarm.name === 'limina-tick') {
    // 更新 Badge 與儲存剩餘時間
  }
});
```

---

_本文件由逆向工程分析現有 Limina v2.3 原始碼產出，並結合現代 Chrome Extension 最佳實踐整合而成。版本 v1.0，2026-02-25。_
