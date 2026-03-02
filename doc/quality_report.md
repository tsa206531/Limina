# 🔍 Limina Chrome Extension — 軟體品質評估報告

> **評估日期**：2026-02-25  
> **評估人員**：資深軟體架構師（15 年經驗）  
> **專案版本**：2.3  
> **評估範疇**：架構設計、程式碼品質、測試品質、效能與擴充性、技術債

---

## 🔍 專案整體評分

| 面向         | 分數（/10） | 說明                                   |
| ------------ | ----------- | -------------------------------------- |
| 架構設計     | 3           | 無分層、無模組化、高度耦合             |
| 程式碼品質   | 3.5         | 大量重複程式碼、God Object、命名不一致 |
| 測試品質     | 1           | 完全缺乏任何測試                       |
| 效能與擴充性 | 4           | 基本功能正常，但難以橫向擴充           |
| 技術債管理   | 2           | 大量被注解掉的死碼、使用過時 API       |

### 🏆 **總評分：2.9 / 10**

> 這是一個個人學習專案，功能基本完整，但從軟體工程標準來看，存在需要優先處理的嚴重架構問題與技術債。

---

## 📌 主要問題摘要

### 🔴 嚴重問題（P0）

1. **Manifest V2 即將淘汰**  
   `manifest.json` 使用 `manifest_version: 2`，Manifest V2 已被 Chrome 廢棄，MV3 為現行標準。這是**部署層面的生存威脅**。

2. **`popup.js` 是 God Object（1642 行）**  
   整個 popup 的 UI 邏輯、狀態管理、資料處理、導覽動畫全混在單一檔案中，嚴重違反 Single Responsibility Principle（SRP）。

3. **全域變數污染（Global State Pollution）**  
   所有模組共享大量全域變數（`softLockList`、`whiteList`、`timeRecord`、`timer`、`isAppClosed` 等），在 `popup.js`、`backgroundScript.js`、`fileStorage.js` 中均有各自獨立的同名副本，難以追蹤資料一致性。

   ```js
   // popup.js
   var softLockList = [];
   var whiteList = [];
   var timer = 0;

   // backgroundScript.js（完全重複定義）
   var softLockList = [];
   var whiteList = [];
   var timer = 0;
   ```

4. **`fileStorage.js` 直接依賴全域變數（外部副作用）**  
   `saveFileFully()`、`loadFile()` 等函式不接受參數，而是直接讀寫全域變數，導致函式無法獨立測試或重用。

5. **資料序列化脆弱（Custom String Encoding）**  
   所有資料以 `key||value::key2||value2` 格式的字串儲存，若任何 URL 或資料包含 `::` 或 `||` 字元，將導致**靜默資料損毀**，沒有任何防護機制。

   ```js
   // fileStorage.js
   str += "::" + key + "||" + timeRecord[key]; // 脆弱的序列化
   ```

### 🟠 嚴重問題（P1）

6. **Callback Hell（深層巢狀 Callback）**  
   多處出現超過 5 層的巢狀 callback，可讀性極差，錯誤處理困難。

   ```js
   // popup.js - 超過5層巢狀
   $("#clearAllData").click(function () {
     $("#warningPop").fadeIn("fast", function () {
       $("#warningYes").click(function () {
         $("#warningFakeLoad").fadeIn("fast", function () {
           fakeLoadTimerInst = setInterval(function () {
             clearAllData();
           }, 4000);
         });
       });
     });
   });
   ```

7. **嚴重程式碼重複（DRY Violation）**  
   `createRemoveList()` 中「移除白名單」與「移除鎖定名單」的 UI 建立邏輯幾乎完全相同（約 120 行），差異僅在資料來源。`listPossibleAddDomain()` 中 `white` 與 `locked` 的 click handler 也完全重複。

   ```js
   // popup.js L1025-1248: removeFromWhite 與 removeFromSoft 邏輯 95% 相同
   // 應抽出為共用函式 createRemoveListSection(listData, listType)
   ```

8. **`cutOffHeadAndTail()` 函式同時存在於 `utility.js` 與 `contentScript.js`**  
   完全相同的 URL 解析函式在兩個檔案中各有一份，違反 DRY 原則。

9. **大量被注解掉的死碼（Dead Code）**  
   整個專案充斥著大量被注解的廢棄功能（hardLockList、singleHardLock、singleSoftLock 等），這些程式碼佔比估計超過 20%，嚴重影響可讀性且混淆未來開發者的理解。

10. **`backgroundScript.js` 的訊息處理器過於龐大**  
    `chrome.extension.onMessage.addListener` 回調函式使用大量 `else-if` 鏈（超過 20 個分支），違反 Open/Closed Principle，每次新增功能都必須修改這個核心函式。

### 🟡 中等問題（P2）

11. **jQuery 版本過舊（1.11.3, 2014年）**  
    使用超過 10 年的 jQuery 版本，存在已知安全漏洞，且與 Manifest V3 的 CSP 政策衝突。

12. **有潛在 Bug 的邏輯錯誤**  
    `fileStorage.js L96` 的兩個條件完全相同：

    ```js
    if(softLockList.indexOf(sp[0])>=0){ rL[j] += ... }
    else if(softLockList.indexOf(sp[0])>=0){ rW[j] += ... } // BUG: 永遠不會執行
    ```

    第二個條件應為 `whiteList.indexOf(sp[0])>=0`，這是一個靜默的邏輯 Bug。

13. **DOM 操作效率低落**  
    `popup.js` 的字體縮小邏輯使用 `while` 迴圈逐一減少 px，在某些情況下可能觸發大量 DOM reflow。

14. **命名規範不一致**  
    混用 `callBack`、`callback`、`callBack` 等大小寫變體；函式命名問題如 `creatUserServuce`（拼錯）的風格蔓延到整個專案（`getCurrentTabUrl` vs `loadCurrentTime` 等一致性問題）。

---

## 🔧 優先重構建議（依優先順序排序）

### 第一優先：立即行動（P0 — 攸關存活）

#### 1. 升級至 Manifest V3

**為什麼**：Chrome Web Store 自 2024 年起停止接受 MV2 擴充功能更新，現有版本將無法升級。

```json
// 升級前 manifest.json
{
  "manifest_version": 2,
  "browser_action": { ... },
  "background": { "scripts": [...] }
}

// 升級後 manifest.json
{
  "manifest_version": 3,
  "action": { ... },
  "background": { "service_worker": "service_worker.js" },
  "host_permissions": ["*://*/*"]
}
```

> ⚠️ **注意**：MV3 不支援持久化 Background Script，需改為 Service Worker，會影響計時器邏輯，需要重構 `backgroundScript.js` 中的 `setTimer()` 和 `doTimeRecord()`。

---

#### 2. 修復資料序列化漏洞

**為什麼**：使用者若在白名單或鎖定名單中加入包含 `::` 或 `||` 的 URL（雖罕見但可能），將導致資料解析錯誤，靜默損毀所有時間記錄資料。

```js
// 重構前（脆弱）
str += "::" + key + "||" + value;

// 重構後（使用 JSON）
// 儲存
chrome.storage.local.set({ timeRecordData: JSON.stringify(timeRecord) });

// 讀取
const raw = data.timeRecordData;
timeRecord = raw ? JSON.parse(raw) : {};
```

---

### 第二優先：架構重構（P1）

#### 3. 消滅 God Object：拆分 `popup.js`

**為什麼**：1642 行的單一檔案讓任何協作者都難以維護，且任何修改都有連帶風險。

建議拆分結構：

```
popup/
├── popup.js          (入口，只做初始化)
├── modules/
│   ├── stateManager.js    (管理 isAppClosed, timer 等狀態)
│   ├── listManager.js     (管理 softLockList, whiteList)
│   ├── timerController.js (計時器 UI 邏輯)
│   ├── navigation.js      (moveLeftTo, moveRightTo)
│   ├── removeListUI.js    (建立移除名單 UI)
│   └── statisticsChart.js (圖表邏輯)
```

---

#### 4. 解決全域變數污染：引入模組模式

**為什麼**：多個 context（popup、background、content）各自維護獨立的狀態副本，難以保證一致性。

```js
// 重構前
var softLockList = [];
var whiteList = [];

// 重構後：使用 IIFE 模組模式或 ES Modules
const StateManager = (() => {
  let _softLockList = [];
  let _whiteList = [];

  return {
    getSoftLockList: () => [..._softLockList],
    addToSoftLock: (url) => {
      _softLockList.push(url);
    },
    removeFromSoftLock: (url) => {
      _softLockList = _softLockList.filter((u) => u !== url);
    },
  };
})();
```

---

#### 5. 消除程式碼重複：抽出共用 `createRemoveListSection()`

**為什麼**：白名單和鎖定名單的移除 UI 有 95% 相同邏輯，修一個 Bug 需要改兩個地方。

```js
// 重構後：共用函式
function createRemoveListSection(listData, listType, containerId) {
  const ul = $(`#${containerId}`);
  const config = {
    white: { deleteMsg: "whiteList", arr: whiteList },
    locked: { deleteMsg: "softLockList", arr: softLockList },
  }[listType];

  if (listData.length === 0) {
    ul.append('<li class="removeCheckWrapper"><div>(empty)</div></li>');
    return;
  }

  listData.forEach((item) => {
    const li = createRemoveListItem(item, config);
    ul.append(li);
  });

  highlightCurrentTab(containerId);
}

// 呼叫端
document.getElementById("removeFromWhite").addEventListener("click", () => {
  createRemoveListSection(whiteList, "white", "removeWhiteListDomain");
});
document.getElementById("removeFromSoft").addEventListener("click", () => {
  createRemoveListSection(softLockList, "locked", "removeSoftListDomain");
});
```

---

#### 6. 重構訊息處理器：使用 Command Pattern 取代 if-else 鏈

**為什麼**：`backgroundScript.js` 的訊息處理器有超過 20 個分支，新增功能必須修改核心函式，違反 OCP。

```js
// 重構前（20+ else-if 鏈）
chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.blockerLoadRequest) { ... }
  else if (msg.pageJustLoaded) { ... }
  // 20+ 個分支...
});

// 重構後（Command Pattern）
const messageHandlers = {
  blockerLoadRequest: (msg, sendResponse) => {
    loadBlocker();
    sendResponse({ mainMessage: mainMessage.toString() });
  },
  pageJustLoaded: (msg, sendResponse) => { ... },
  modifyMainMessage: (msg) => { mainMessage = msg.modifyMainMessage; },
  // 每個功能對應一個獨立函式
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = Object.keys(messageHandlers)
    .find(key => msg[key] !== undefined);

  if (handler) messageHandlers[handler](msg, sendResponse);
  return true;
});
```

---

#### 7. 清除死碼（Dead Code Removal）

**為什麼**：被注解掉的 `hardLockList`、`singleHardLock`、`singleSoftLock` 等大量廢棄功能，讓程式碼難以閱讀，增加認知負擔。

- 刪除所有已注解超過 1 年的程式碼
- 若功能有復活可能，使用 Git 分支管理，而非注解留存

---

### 第三優先：品質提升（P2）

#### 8. 建立基本測試框架

**為什麼**：完全沒有測試，任何重構都是盲目進行。

```bash
# 安裝測試框架
npm install --save-dev jest jest-webextension-mock
```

```js
// 優先測試純函式（utility.js）
describe("cutOffHeadAndTail", () => {
  test("應正確去除 https:// 前綴", () => {
    expect(cutOffHeadAndTail("https://www.google.com")).toBe("www.google.com");
  });
  test("應正確去除尾部斜線", () => {
    expect(cutOffHeadAndTail("https://google.com/")).toBe("google.com");
  });
});

describe("purifyUrl", () => {
  test("應返回乾淨的 domain", () => {
    expect(purifyUrl("https://www.youtube.com/watch?v=xxx")).toBe(
      "www.youtube.com/watch?v=xxx",
    );
  });
});
```

---

#### 9. 移除舊版 Chrome 相容代碼

```js
// 重構前（已無意義）
if (!chrome.runtime) {
  chrome.runtime = chrome.extension; // Chrome 20-21
} else if (!chrome.runtime.onMessage) {
  // Chrome 22-25
}

// 重構後：直接移除，支援 Chrome 88+ 即可
```

---

## 🏗 建議重構策略

### 短期（1-2 週）：止血

| 任務                                             | 優先級 | 預估工時 |
| ------------------------------------------------ | ------ | -------- |
| 修復 `calculatePastNDaysTotal` 的邏輯 Bug（L96） | P0     | 1h       |
| 移除 Chrome 20-25 的舊版相容代碼                 | P1     | 0.5h     |
| 清除所有被注解的死碼                             | P1     | 2h       |
| 將 `cutOffHeadAndTail` 合併到一個位置            | P1     | 0.5h     |
| 資料序列化改為 JSON                              | P0     | 4h       |

### 中期（1-2 個月）：重建架構

| 任務                                             | 優先級 | 預估工時 |
| ------------------------------------------------ | ------ | -------- |
| 升級至 Manifest V3                               | P0     | 1-2週    |
| 拆分 `popup.js` 為多個模組                       | P1     | 3-5天    |
| 消除 `createRemoveList` 重複程式碼               | P1     | 1天      |
| 重構背景訊息處理器（Command Pattern）            | P1     | 2天      |
| 建立基本 unit test（utility.js、fileStorage.js） | P1     | 3天      |

### 長期（3-6 個月）：現代化升級

| 任務                                | 優先級 | 預估工時 |
| ----------------------------------- | ------ | -------- |
| 移除 jQuery，改用 Vanilla JS 或 Lit | P2     | 1-2週    |
| 採用 TypeScript 重寫                | P2     | 3-4週    |
| 引入 Web Components 重構 UI 元件    | P2     | 2-3週    |
| 引入 Webpack/Vite 建構流程          | P2     | 3天      |
| 達到 80% 測試覆蓋率                 | P2     | 持續進行 |

---

## 🚀 升級為高品質專案的具體行動步驟

### Phase 1：現代化基礎設施（最優先）

```bash
# Step 1: 初始化 npm 並建立建構流程
cd Limina--chrome_extension
npm init -y
npm install --save-dev webpack webpack-cli jest jest-webextension-mock babel-loader @babel/core @babel/preset-env

# Step 2: 設定 Webpack
# webpack.config.js 分離 popup/background/content 三個入口點
```

### Phase 2：測試先行（TDD 重構）

```
測試策略（由易到難）：
1. utility.js 純函式 → 最容易，無副作用
2. fileStorage.js 儲存邏輯 → mock chrome.storage API
3. backgroundScript.js 訊息處理邏輯 → mock chrome.runtime
4. popup.js UI 邏輯 → 使用 JSDOM 或 Playwright
```

### Phase 3：架構重構（模組化）

```
重構順序（風險由低到高）：
1. utility.js → 已是獨立模組，出口 ES Module
2. fileStorage.js → 改為 StorageService class，消除全域依賴
3. backgroundScript.js → 拆出 TimerService、BlockService、TimeRecordService
4. popup.js → 按功能模組化，最後整合
```

### Phase 4：Manifest V3 遷移

```
關鍵變更：
1. background scripts → service_worker（計時器需改用 Alarms API）
2. chrome.extension.onMessage → chrome.runtime.onMessage
3. browser_action → action
4. content_security_policy 更嚴格（移除 inline script/eval）
5. host_permissions 從 permissions 分離
```

---

## 📊 技術債風險評估

### 最嚴重的技術債

1. **Manifest V2 即將淘汰** → 風險：擴充功能無法在 Chrome 上繼續運行
2. **無測試** → 風險：任何重構都可能引入難以發現的回歸 Bug
3. **脆弱的字串序列化** → 風險：資料損毀，使用者流失重要的時間統計資料
4. **全域狀態** → 風險：難以追蹤的狀態同步 Bug，特別是在多 Tab 環境下

### 技術債造成的風險矩陣

| 技術債               | 發生機率 | 衝擊程度 | 優先處理 |
| -------------------- | -------- | -------- | -------- |
| MV2 淘汰             | 高       | 致命     | ✅ 立即  |
| 序列化 Bug           | 低       | 高       | ✅ 立即  |
| 無法擴充新功能       | 中       | 高       | 🔄 中期  |
| 安全漏洞（舊jQuery） | 低       | 中       | 🔄 中期  |
| 協作困難             | 高       | 中       | 🔄 中期  |

---

## 💡 總結

Limina 是一個功能完整且有創意的個人專案，能看出開發者對計時器、網站封鎖和時間統計功能的用心。然而，從工程品質角度，這是一個典型的**原型等級程式碼被用於生產環境**的案例。

當前最緊迫的行動是：

1. **升級 Manifest V3**（否則擴充功能將無法繼續發布）
2. **改用 JSON 序列化**（防止資料損毀）
3. **拆分 popup.js**（讓後續所有重構成為可能）

如果只能做一件事，就從**拆分 popup.js 並補上基礎測試**開始，這是後續所有重構的基石。

---

_本報告由資深軟體架構師依據靜態程式碼分析產出，評估基準參考 Clean Code、SOLID Principles、Google Chrome Extension 官方最佳實踐。_
