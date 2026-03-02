# Limina 2.0 Code Quality & Architecture Review

## Overview

This document represents a senior-level architectural and code quality review of the Limina Chrome Extension. The review focuses on performance, maintainability, syntax correctness, and domain-driven design best practices, particularly within the context of a Chrome Extension Manifest V3 environment.

---

## 1. Background Services & Storage API Performance

### ❌ 問題：`checkBlockWithTimer` 中非必要的平行 `StorageService` 呼叫

在 `src/background/services/BlockEngine.ts` 中，`checkBlockWithTimer` 函式每次都會平行請求三個 Storage 節點：

```typescript
const [settings, timerState, snoozeUntil] = await Promise.all([
  StorageService.getSettings(),
  StorageService.getTimerState(),
  StorageService.getSnoozeUntil(),
]);
```

**Why it's a problem**:
Chrome Storage API (`chrome.storage.local.get`) 雖然是非同步的，但頻繁呼叫仍有少量 I/O 成本。更重要的是，在後續邏輯中，如果 `!settings.isEnabled` 為 `true`，後面的 `timerState` 和 `snoozeUntil` 根本不需要被讀取。這違反了 Early Return 避免無謂計算的原則。

### 💡 改進建議

改為依賴短路求值 (Short-circuit evaluation) 或層次讀取。或者，如果確定這三個總是經常一起使用，在 `StorageService` 提供一個 `getAppState()` 一次性打包取得，會比三次單獨的 API 呼叫更有效率。

### ✅ 優化後範例

```typescript
export async function checkBlockWithTimer(url: string): Promise<BlockStatus> {
  // 先只取設定，如果是關閉狀態就直接 Return，省下後續兩次 I/O
  const settings = await StorageService.getSettings();
  if (!settings.isEnabled) return "none";

  // 再取其他需要的狀態
  const [timerState, snoozeUntil] = await Promise.all([
    StorageService.getTimerState(),
    StorageService.getSnoozeUntil(),
  ]);

  if (snoozeUntil > 0 && Date.now() < snoozeUntil) return "none";
  if (settings.timerPausesBlocking && timerState.isActive) return "none";

  return checkBlock(url);
}
```

---

## 2. API Design & Promise Wrapping (Pinia Stores)

### ❌ 問題：不必要的 Promise Wrapping (Anti-pattern)

在 `src/popup/stores/useBlocklistStore.ts` 中，`load` 函式的寫法：

```typescript
return new Promise<void>((resolve) => {
  chrome.runtime.sendMessage({ type: "GET_BLOCKLIST" }, (res) => {
    // ...
    resolve();
  });
});
```

**Why it's a problem**:
這本身不是語法錯誤，但這是在將已經支援 Promise 的 API 包裝成 Promise，屬於典型的 Anti-pattern (疊床架屋)。

### 💡 改進建議

MV3 之後，不提供 callback 函式的 `chrome.runtime.sendMessage` 預設就會回傳 Promise。直接使用 `await` 能夠讓寫法更平坦，並自動捕捉網路錯誤，而不是讓未知的 callback 在出錯時可能永遠不呼叫 `resolve()` 導致 `load` 永遠 pending。

### ✅ 優化後範例

```typescript
async function load(force = false) {
  if (
    !force &&
    lastFetchedAt.value &&
    Date.now() - lastFetchedAt.value < CACHE_TTL
  )
    return;

  loading.value = true;
  try {
    const res = await chrome.runtime.sendMessage({ type: "GET_BLOCKLIST" });
    if (res?.success) {
      entries.value = res.data ?? [];
      lastFetchedAt.value = Date.now();
    }
  } catch (err) {
    console.error("Failed to load blocklist", err);
  } finally {
    loading.value = false;
  }
}
```

---

## 3. Duplicated Logic & DRY Principle

### ❌ 問題：重複的 `extractDomainLevels` 實作處理

在 `BlockEngine.ts` 中，處理網址層次比對的地方有重複的迴圈：

```typescript
// 1. 白名單優先
for (const level of levels) {
  if (whiteList.some((e) => e.domain === level)) {
    return "white";
  }
}

// 2. 鎖定名單
for (const level of levels) {
  if (lockList.some((e) => e.domain === level)) {
    return "locked";
  }
}
```

**Why it's a problem**:
邏輯重複（走訪 levels 並利用 some 檢查 list）。這是擴充性與維護性漏洞，如果將來新增了第三種名單類型（例如例外名單），又得再複製一次迴圈。而且 `levels.some + array.some` 是 $O(N \times M)$。雖然 `levels` 長度不大，但可以更精簡。

### 💡 改進建議

抽取一個獨立的 Helper 函數來隱藏陣列比對細節。

### ✅ 優化後範例 (抽取 Helper)

```typescript
// 幫助函式：檢查目標 domain 是否存在於提供的規則列表中
function matchesAnyLevel(levels: string[], list: BlockListEntry[]): boolean {
  return levels.some((level) => list.some((item) => item.domain === level));
}

export async function checkBlock(url: string): Promise<BlockStatus> {
  const settings = await StorageService.getSettings();
  if (!settings.isEnabled) return "none";

  const blocklist = await StorageService.getBlocklist();
  // ...略過防呆檢查

  const whiteList = blocklist.filter((e) => e.type === "white");
  if (matchesAnyLevel(levels, whiteList)) return "white";

  const lockList = blocklist.filter((e) => e.type === "locked");
  if (matchesAnyLevel(levels, lockList)) return "locked";

  return "none";
}
```

---

## 4. 潛在的效能與狀態管理陷阱

### ❌ 問題：Background 訊息監聽器可能導致 Memory Leak

在擴充功能中，`src/popup/App.vue` 監聽了 `chrome.storage.onChanged` 來更新 Pinia。這非常正確。但如果是 Popup 開著，它在 `onUnmounted` 也有清理嗎？

**Why it's a problem**:
我們在 `App.vue` 綁定了 listener：

```typescript
chrome.storage.onChanged.addListener(onStorageChanged);
```

但**沒有在元件解除掛載 (`onUnmounted`) 時移除 (`removeListener`)**。雖然 Popup 關閉時整個 JS Context 會被清掉，但如果發生像是你在設定頁面上切換而導致的各種元件重繪，若不注意生命週期可能會綁定多次監聽器，導致重複觸發 `invalidate()` 浪費效能。

### 💡 改進建議

在 Vue 的根元件，加上明確的清理機制：

```typescript
onMounted(() => {
  chrome.storage.onChanged.addListener(onStorageChanged);
});

onUnmounted(() => {
  chrome.storage.onChanged.removeListener(onStorageChanged);
});
```

---

## 總結評語 (Verdict)

這份專案的**基礎架構設計非常優秀**。

1. **模組化良好**：`Service` 與 `Store` 分開，責任界線清楚。
2. **符合 MV3 安全性**：沒有濫用 `unsafe-eval`，成功轉換至靜態字串分析 i18n。
3. **優化的快取設計**：引進 `CACHE_TTL`（60秒快取）與 `lastFetchedAt`，這對於 Chrome Extension 和非同步的 Storage 溝通是非常高級的效能優化手段。

**結論**：除了上述指出的冗餘（Promise 包裝、重複的 for 迴圈、過早平行讀取 Config），核心邏輯與安全性皆達到資深工程師等級標準，沒有嚴重的效能或漏洞風險。
