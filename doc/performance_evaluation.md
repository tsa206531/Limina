# Limina 2.0 - 極限效能與架構審查報告

本報告以「Chrome Extension MV3 極限效能」標準全面審查 Limina 專案，重點放在降低 CPU 佔用、減少 Service Worker (SW) 喚醒次數、DOM 效能及渲染優化。

---

## 🔥 第一部分：Service Worker（MV3）極限優化檢查

### 🔴 高風險效能瓶頸：每秒觸發的 `chrome.alarms`

- **問題位置**：`src/background/services/timerService.ts` (`ALARM_TICK` 每 1/60 分鐘觸發)
- **問題說明**：實作中依賴 `chrome.alarms` 來進行每一秒的倒數 (tick)，每次 tick 都進行 Storage 寫入 (`setTimerState`) 與發送 Badge 更新。
- **為何影響效能（底層機制）**：
  1. MV3 的 Service Worker 在背景閒置時會被瀏覽器強制休眠。使用高頻 Alarm 會導致 SW 被迫**不斷喚醒 / 阻止休眠**，極度消耗 CPU 與筆電電池。
  2. **Chrome 官方限制**：在正是發布的 Extension 中，`chrome.alarms` 的最小觸發間隔被強制限制為 **1 分鐘** (即使設定 `1/60`，在 Production 環境也會被 throttle 到 1 分鐘)，這會導致你的計時器在使用者電腦上完全失效或嚴重卡頓。
- **極限改善方式（Lazy & Math Calculation）**：
  徹底移除 `ALARM_TICK`，背景只需要設定一次「結束時間」的 Alarm。倒數邏輯交給 Popup (前端開啟時依靠 `endTime - Date.now()` 算距離) 或 Badge (直接使用 `chrome.action.setBadgeText`)。
- **重構範例**：
  ```typescript
  // TimerService.ts 重構：僅保留一次性的 Alarm
  export const TimerService = {
    async start(minutes: number): Promise<void> {
      await chrome.alarms.clearAll();
      const endTime = Date.now() + minutes * 60 * 1000;

      // 僅設定未來結算的 Alarm
      await chrome.alarms.create("limina-done", { when: endTime });

      await StorageService.setTimerState({
        isActive: true,
        endTime, // 儲存時間戳而非剩餘秒數
        lastInputMin: minutes,
      });
      // 註：不需要每秒寫入 Storage，Popup 每次只要讀取 endTime 自己倒數就好
    },
  };
  ```

### 🟡 中等優化空間：同步阻塞與重複取值 (Storage Thrashing)

- **問題位置**：`index.ts` 中 `checkBlockWithTimer` 與每個 `tab.onUpdated` 的 Storage 讀取。
- **問題說明**：每次切換 Tab 或載入新網頁時，背景都會去 `await StorageService.getSettings()`。
- **改善方式**：在 SW 頂層宣告一個 **In-memory Map/Cache**。利用 `chrome.storage.onChanged` 維護這份快取，存取時直接讀取記憶體 (Time Complexity: $O(1)$) 而不經過 IO 非同步傳輸。

---

## 🔥 第二部分：Content Script 效能審查

### 🔴 高風險效能瓶頸：被動依賴 Background 廣播

- **問題位置**：`src/background/index.ts` 的 `notifyAllTabs()` 以及 Content script 依賴 `BLOCK_STATUS` 訊息。
- **問題說明**：當用戶開啟了 50 個分頁，SW 在計時器結束或按下 Snooze 時，會呼叫 `chrome.tabs.query` 並跑 `for...of` 執行 50 次 `sendMessage`。
- **為何影響效能**：跨執行緒 (IPC Message) 的呼叫成本非常昂貴，廣播風暴會導致瀏覽器主執行緒卡頓。
- **極限改善方式（Shared State & Pull 模式）**：
  Content Script 應直接監聽 `chrome.storage.local.onChanged`！背景更改狀態 (如 `isSnooze = true`) 只需要寫入 Storage 一次，所有的 Content script 會自動透過 `onChanged` 事件收到通知並自我更新，完全免去 Background 的迴圈廣播。
- **重構範例**：
  ```typescript
  // Content Script 直接接收 Storage 變化，大幅降低 Message IPC 次數
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.timerState || changes.settings) {
      checkAndShow(); // 自行拉取或透過 changes 比對決定是否顯示/隱藏 Overlay
    }
  });
  ```

### 🟢 微優化建議：DOM 渲染與 Paint Thrashing

- **問題位置**：`nerd-overlay` 動畫。
- **改善方式**：目前的 `pointer-events: none` 搭配 `opacity` 已經是不錯的實踐。但若要追求極致，建議將 `#nerd-overlay` 的 `display: none` 與 `display: flex` 做切換，或是搭配 `requestAnimationFrame` 防抖。當 `opacity: 0` 時，如果不設定 `visibility: hidden` 或移出 DOM 樹，瀏覽器依舊可能會計算 Layout。

---

## 🔥 第三部分：Vue 3 渲染效能檢查

### 🟡 中等優化空間：不必要的全域 Reactivity (Ref vs ShallowRef)

- **問題位置**：`src/popup/stores/useTimerStore.ts`
- **問題說明**：`state = ref({ isActive: true, remainingSec: 0 })`。因為此 state 只會每次「整包被替換」，不需要監聽深層屬性的獨立變動。
- **改善方式**：對於「一旦更新就是整包覆寫從 background 抓回來」的資料，改用 `shallowRef`，可以節省 Vue 遞迴物件加上 Proxy 監聽器的昂貴成本。
- **重構範例**：
  ```typescript
  import { shallowRef } from "vue";
  const state = shallowRef<TimerState>({ ...DEFAULT_TIMER_STATE });
  const timeRecords = shallowRef<Record[]>([]); // 陣列或大筆設定也應使用 shallowRef
  ```

### 🟢 微優化建議：計時器 Tick 的 DOM 更新

- **說明**：Popup 中的 `setInterval` 每秒 `state.value.remainingSec--` 會觸發 Vue 的 re-render。雖然不影響大局，但如果要極限優化，可將 SVG 圓環的計算邏輯改以 `requestAnimationFrame` 單純透過 Vanilla JS 修改 `.style.strokeDashoffset`，這樣就能跳過 Vue 的 Virtual DOM Diff 比較。

---

## 🔥 第四部分：Message 傳遞與資料流優化

### 🔴 高風險效能瓶頸：頻繁 ping-pong 導致 Bottleneck

- **說明**：整體架構偏向「Content Script 發送 GET_STATUS -> Background 計算 -> Background 回傳 BLOCK_STATUS」。這強迫 Background 成為所有邏輯判斷的單點瓶頸。
- **為何影響效能**：萬一 Background 正在休眠，每次載入網頁都會強制冷啟動 (Cold start) Service Worker，增加網頁白屏時間與處理延遲。
- **極限改善方式（Decentralized 判斷）**：
  把黑白名單規則、Snooze Timestamp 等「判斷依據」**快取在 Content Script 的全域變數中**（初始化抓一次），當使用者到達新網站，Content Script 靠自身的 JS 邏輯判斷是否該封鎖即可，完全不需喚醒 Service Worker，實現零延遲展現遮罩。

---

## 🔥 第五部分：Bundle 與載入優化（Vite / CRXJS）

### 🟡 中等優化空間：Popup 的載入體積過大 (Code Splitting)

- **問題位置**：`vite.config.ts`
- **問題說明**：目前預設的 Build 會將 Vue、Vue Router、Pinia、ChartJS 全塞入一個很大的 `assets/index-[hash].js`，這導致雖然只要開 Home 頁面，卻必須把 Stats 頁面的 ChartJS 函式庫一併解析。
- **極限改善方式（動態載入 + Vendor 拆分）**：
  1. Vue Router 的頁面改為 Dynamic Import (`component: () => import('./views/StatsView.vue')`)。
  2. Vite 設定分包策略 (manualChunks)。
- **重構範例**：
  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vue-core": ["vue", "vue-router", "pinia"],
            "chart-lib": ["chart.js", "vue-chartjs"], // 把肥大的圖表庫從主包拆走
          },
        },
      },
    },
  });
  ```

---

## 🎯 總結：邁向極限效能的行動清單 (Action Items)

如果你想大幅度升級這份專案，請遵循以下優先順序：

1. **[最高優先] 刪除 `TimerService` 中的 `1/60` Alarm API**。改在 Storage 寫入 `endTime`，讓 Popup 自行算差額。解決生產環境必定失效與大量噴電的致命傷。
2. **[架構革新] 放棄「廣播迴圈 (`notifyAllTabs`)」**。Content script 直接監聽 `chrome.storage.onChanged` 實作自動反應狀態，解耦雙向依賴。
3. **[降低喚醒] Decentralized Block Logic**。讓 Content Script 自己承擔網址判斷的能力，不要把每個 request 都 `sendMessage` 推給 Background。
4. **[優化渲染] 引進 `shallowRef` & Lazy Import**。減輕 Vue 3 Virtual DOM 的追蹤負擔，並運用 Vite 切割 `chart.js`。
