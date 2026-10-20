**技術棧**： Tailwind CSS v4.3

## 1. 色彩系統 (Color System)

### 1.1 品牌色與其 Alpha 階

全站只有**一個色相**。層次不靠色階，靠同一顏色的透明度衍生 —— 這是本站辨識度最高的色彩手法。

| Token                         | 值                                  | Alpha | 用途                                             |
| ----------------------------- | ----------------------------------- | ----- | ------------------------------------------------ |
| `--color-brand`               | `#009fb7` / `rgb(0,159,183)`        | 1.0   | 主色：CTA 底、強調文字、選中態文字、圖示染色     |
| `--color-brand-hover`         | `rgba(0,159,183,0.8)` → `#009fb7cc` | 0.80  | 實色鈕 hover（**降透明度**，非換深色）           |
| `--color-brand-surface`       | `rgba(0,159,183,0.1)` → `#009fb71a` | 0.10  | 選中態底、ghost 鈕底、圖示圈底、inline `code` 底 |
| `--color-brand-border`        | `rgba(0,159,183,0.2)` → `#009fb733` | 0.20  | pill 鈕與徽章邊框                                |
| `--color-brand-border-strong` | `rgba(0,159,183,0.5)` → `#009fb780` | 0.50  | 強調容器邊框（隱私流程「你的電腦」卡）           |

| `--color-brand-surface-hover` | `rgba(0,159,183,0.16)` → `#009fb729` | 0.16 | ghost 鈕 hover 底 |

### 1.2 中性文字階 (Ink Scale)

| Token             | Light     | Dark      | 用途                                           |
| ----------------- | --------- | --------- | ---------------------------------------------- |
| `--color-ink-900` | `#05060f` | `#f0f6fc` | 最強標題、H1 前導詞、卡片主標                  |
| `--color-ink-800` | `#1f2933` | `#e6edf3` | **全域 body 文字色**、次級標題、導覽文字       |
| `--color-ink-700` | `#353535` | `#c9d1d9` | 內文段落、清單項                               |
| `--color-ink-600` | `#5e5e5e` | `#8b949e` | 區段副標、輔助說明                             |
| `--color-ink-500` | `#6b7280` | `#8b949e` | 弱化文字、placeholder、導覽閒置態、footer 版權 |
| `--color-ink-400` | `#9ca3af` | `#6e7681` | 弱化態：原價刪除線、停用勾勾                   |
| `--color-ink-300` | `#bababa` | `#484f58` | 裝飾序號（01/02/03）、停用態、dashed 佔位框    |

### 1.3 表面層 (Surface)

| Token                    | Light     | Dark      | 用途                                         |
| ------------------------ | --------- | --------- | -------------------------------------------- |
| `--color-surface-page`   | `#f4f4f8` | `#0d1117` | 頁面底色（body）、輸入框底                   |
| `--color-surface-card`   | `#ffffff` | `#161b22` | 卡片、面板、頁尾、白底區段                   |
| `--color-surface-tint`   | `#f1fdff` | `#161b22` | 品牌微染區段底（ADVANCED / FAQ 區）          |
| `--color-surface-subtle` | `#f8f8f9` | `#21262d` | 卡片內清單底、表頭、次要鈕底、步驟卡底       |
| `--color-surface-faint`  | `#f9f9f9` | `#1c2128` | FAQ 答案區底                                 |
| `--color-surface-muted`  | `#e9e9ec` | `#30363d` | 中性鈕 hover 底、Beta 徽章底、開關關閉態軌道 |

深淺順序（Light）：`page #f4f4f8` < `subtle #f8f8f9` ≈ `faint #f9f9f9` < `card #fff`。輸入框刻意用 `surface-page`（比卡片深）製造內凹感。

### 1.4 分隔線 (Line)

| Token              | Light     | Dark      | 用途                                        |
| ------------------ | --------- | --------- | ------------------------------------------- |
| `--color-line-200` | `#e6e6ea` | `#30363d` | 標準邊框、卡片框、表格 `divide-y`、區段分界 |
| `--color-line-300` | `#d9d9d9` | `#30363d` | `<hr>` 分隔線、輸入框框、表格外框與表頭下緣 |
| `--color-line-400` | `#d4d4d3` | `#484f58` | 導覽膠囊邊框（僅此一處）                    |

### 1.5 狀態色

沿用 Tailwind v4 原生色，未進 `@theme`：

| 角色 | Token       | oklch（編譯值）            | ≈ Hex     | 用途                                          |
| ---- | ----------- | -------------------------- | --------- | --------------------------------------------- |
| 危險 | `red-500`   | `oklch(63.7% .237 25.331)` | `#fb2c36` | 表單錯誤訊息、`notice-danger` 圖示            |
| 警告 | `amber-500` | `oklch(76.9% .188 70.08)`  | `#fe9a00` | `notice-warning` 圖示                         |
| 成功 | —           | —                          | —         | **不另設色**，一律用 `--color-brand` 表達成功 |

Notice 三色配方（`style.css`）：底 8% + 框 35%，文字沿用 `ink-800`。

| 變體              | background              | border-color            |
| ----------------- | ----------------------- | ----------------------- |
| `.notice-info`    | `rgba(0,159,183,0.08)`  | `rgba(0,159,183,0.35)`  |
| `.notice-warning` | `rgba(245,158,11,0.08)` | `rgba(245,158,11,0.35)` |
| `.notice-danger`  | `rgba(239,68,68,0.08)`  | `rgba(239,68,68,0.35)`  |

### 1.6 深色主題機制

`html.dark` 直接**翻轉同名 CSS 變數**，元件層零 `dark:` 前綴（全站 0 個）。初始判定由 `<head>` 內同步 inline script 完成（防 FOUC），切換後寫入 `localStorage.pb-theme`。

**關鍵特徵：`--color-brand` 系列在深色模式不變**（維持 `#009fb7`）。品牌色在兩個主題是同一個值，只有中性色與表面色翻轉。

深色色板取自 GitHub Dark 系：`#0d1117` / `#161b22` / `#1c2128` / `#21262d` / `#30363d` / `#484f58` / `#8b949e` / `#c9d1d9` / `#e6edf3` / `#f0f6fc`。

半透明的毛玻璃底色無法靠 `@theme` 翻轉（那裡的變數若沒有對應 utility 被使用就會被 tree-shake），因此獨立放在 `:root`／`html.dark` 的原生 CSS，模板端以 `bg-[var(--glass-*)]` 消費：

```css
:root {
  --glass-nav: rgba(255, 255, 255, 0.7); /* 導覽膠囊 */
  --glass-raised: rgba(255, 255, 255, 0.85); /* 浮動標籤 A、流程圖示圈 */
  --glass-raised-soft: rgba(255, 255, 255, 0.75); /* 浮動標籤 B */
}
html.dark {
  --glass-nav: rgba(22, 27, 34, 0.85);
  --glass-raised: rgba(22, 27, 34, 0.9);
  --glass-raised-soft: rgba(22, 27, 34, 0.88);
}
```

### 1.7 漸層 (Gradients)

**① Hero 環境光（Radial）** — 5 個頁面共用，掛在 Nav+Hero 的外層容器：

```css
background: radial-gradient(
  ellipse 1300px 900px at 30% 0%,
  rgba(0, 159, 183, 0.22) 0%,
  rgba(0, 159, 183, 0.06) 50%,
  transparent 75%
);
```

方向：自左上（30%, 0%）向外擴散的橢圓。過渡：三段式 22% → 6% → 全透明，中段在 50% 就衰減到 6%，因此視覺重心緊貼頂部。深色模式不覆寫，品牌光暈在兩主題一致。

**② 區段標題文字漸層（Linear，`bg-clip-text`）**：

```css
background-image: linear-gradient(
  to right,
  #009fb7 0%,
  #004651 100%
); /* teal-500 → teal-900 */
-webkit-background-clip: text;
color: transparent;
```

方向：水平（`to right`，90deg）。ADVANCED 區段**反向**（`from-teal-900 to-teal-500`），與前後區段交錯，形成節奏。

**③ 卡片漸層邊框（Linear + mask-composite）** — 以 mask 挖空內容區，只留邊框：

```css
.gradient-border-card::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 2px; /* ＝邊框粗細 */
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    #009fb7 0%,
    #3a3afd 100%
  ); /* 品牌青 → 電光藍，垂直 */
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude; /* -webkit-mask-composite: xor */
  pointer-events: none;
}
.gradient-border-card-reverse::before {
  background: linear-gradient(180deg, #3a3afd 0%, #009fb7 100%);
}
.gradient-border-faq[open]::before {
  padding: 1px; /* 其餘同上 */
}
```

方向：垂直（180deg，上→下）。粗細：卡片 2px、FAQ 展開態 1px。`#3a3afd` 是全站唯一的第二色相，**只出現在漸層終點**，不作為獨立語義色使用。

---

## 2. 字體排版 (Typography)

### 2.1 字體族與載入

```
https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@600&family=Inter:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap
```

| Token           | Stack                                                                                                               | 載入權重        | 使用次數 | 角色                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ------------------------------------------------- |
| `--font-sans`   | `'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif`                                                   | 400/500/700/900 | 165      | **全域預設**，所有標題與內文                      |
| `--font-ui`     | `'Inter', 'Noto Sans TC', sans-serif`                                                                               | 400/500/700     | 6        | Logo 字標、方案卡 emoji 圈                        |
| `--font-accent` | `'Big Shoulders', 'Big Shoulders Display', 'Noto Sans TC', sans-serif`                                              | 600             | 8        | 價格數字、步驟序號、`NO CLOUD` 標語（窄體高辨識） |
| `--font-mono`   | Tailwind 預設：`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace` | —               | 6        | SHA-256 雜湊、版本日期、系統需求                  |

⚠️ `font-accent` 只載入 600，但原始碼一律寫 `font-bold`(700) 或 `font-semibold`(600) —— 700 會由瀏覽器合成（faux bold）。

### 2.2 字重使用律

| 權重 | Token           | 使用次數 | 角色                                           |
| ---- | --------------- | -------- | ---------------------------------------------- |
| 900  | `font-black`    | 22       | Hero H1、頁級大標、最新版號                    |
| 700  | `font-bold`     | **193**  | 全站主力：所有標題、按鈕、徽章、強調文字       |
| 600  | `font-semibold` | 1        | 僅 `NO CLOUD` 標語（`font-accent` 的原生權重） |
| 500  | `font-medium`   | 41       | 導覽閒置態、信任列、FAQ 答案、次要動作         |
| 400  | `font-normal`   | 30       | 內文段落、Hero lead、FAQ 收合態問句            |

律：**700 是預設強調，不是特例**。400 反而需明寫。無 300/800。

### 2.3 字級階層

Tailwind v4 命名級距（編譯實值）：

| Class       | font-size       | line-height |
| ----------- | --------------- | ----------- |
| `text-xs`   | 12px (.75rem)   | 1.33333     |
| `text-sm`   | 14px (.875rem)  | 1.42857     |
| `text-base` | 16px (1rem)     | 1.5         |
| `text-lg`   | 18px (1.125rem) | 1.55556     |
| `text-xl`   | 20px (1.25rem)  | 1.4         |
| `text-2xl`  | 24px (1.5rem)   | 1.33333     |
| `text-3xl`  | 30px (1.875rem) | 1.2         |
| `text-4xl`  | 36px (2.25rem)  | 1.11111     |
| `text-5xl`  | 48px (3rem)     | 1           |

`leading-*`：`tight 1.25` / `snug 1.375` / `normal 1.5` / `relaxed 1.625`
`tracking-*`：`wide .025em` / `wider .05em`

#### 標籤級規範（實測）

| 語義級別                              | 字級（桌機 → 手機）        | 字重      | 行高                    | 字距                                | 顏色                              | 使用場景                                   |
| ------------------------------------- | -------------------------- | --------- | ----------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------ |
| **H1 · 首頁 Hero**                    | 54 → 44 → 36 → 28px        | 900       | 1.2                     | `+0.0185em`                         | 前導 `ink-900` + 後段 `brand`     | 首頁主標，唯一 54px                        |
| **H1 · 內頁 Hero**                    | 48 → 36 → 28px             | 900       | 1.2                     | normal                              | 同上雙色                          | 定價／下載／更新／隱私                     |
| **H1 · 文件頁**                       | 36 → 30px                  | 900       | 1.111                   | normal                              | `ink-900`                         | 手冊首標                                   |
| **H2 · 區段主標**                     | 48 → 40 → 32 → 26px        | 700       | 1.5                     | `+0.0185em`                         | **漸層字**（teal-500→900）        | 首頁四大區段，強制 `uppercase`             |
| **H2 · 頁級大標**                     | 48 → 36 → 28px             | 900       | 1.5                     | `+0.0208em`                         | `ink-800`                         | 首頁底部 CTA                               |
| **H2 · 內頁區段**                     | 36 → 30px                  | 900       | 1.111                   | normal                              | `ink-900`                         | 定價比較表、FAQ、底部 CTA                  |
| **H2 · 政策區段**                     | 30 → 24px                  | 900       | 1.2                     | normal                              | `ink-900`                         | 隱私頁各章                                 |
| **H2 · 卡片標題**                     | 24 → 20px                  | 700       | 1.333                   | normal                              | `ink-900`                         | 訂閱卡、隱私卡、文件章節                   |
| **H3 · 功能列標題**                   | 32 → 24px                  | 700       | 1.25                    | `+0.0313em`                         | `ink-800`                         | ADVANCED 三列                              |
| **H3 · 卡片／流程標題**               | 24px                       | 700       | 1.25                    | `+0.0417em`                         | `ink-800` / `ink-900`             | 隱私條目、方案名、平台名                   |
| **H3 · 次級卡標題**                   | 20px                       | 700       | 1.4                     | normal                              | `ink-900`                         | 快速開始步驟、隱私子卡                     |
| **H3 · 內文章節**（`.docs-prose h3`） | 18px                       | 700       | 28px                    | normal                              | `ink-900`                         | Markdown 內文小標，`margin-top: 1.5rem`    |
| **H4 · 舊版條目**                     | 18px                       | 700       | 1.556                   | normal                              | `ink-900`                         | 更新紀錄 legacy                            |
| **區段副標**                          | 28 → 22 → 18px             | 700       | 1.25                    | **`-0.0396em`**（唯一負字距的標題） | `ink-600`                         | 緊接 H2 下方                               |
| **Lead · 首頁**                       | 24 → 20 → 18px             | 400       | 1.2                     | `+0.0417em`                         | `ink-800`                         | Hero 副文案                                |
| **Lead · 內頁**                       | 20 → 18px                  | 400       | 1.625                   | normal                              | `ink-800`                         | 內頁 Hero 副文案                           |
| **p · 正文**                          | 16px                       | 400       | 1.625                   | normal                              | `ink-700`                         | 段落、卡片說明、文件內文                   |
| **p · 功能清單**                      | 20 → 16px                  | 400       | 1.5                     | normal                              | `ink-700`                         | ADVANCED 項目                              |
| **p · 流程說明**                      | 20px                       | 400       | 1.5                     | `+0.05em`                           | `ink-800`                         | 隱私流程卡                                 |
| **p · 小字**                          | 14px                       | 400/500   | 1.428                   | normal                              | `ink-500` / `ink-600` / `ink-700` | 註記、狀態訊息、表格                       |
| **p · 微字**                          | 12px                       | 400/700   | 1.333                   | normal                              | `ink-500` / `ink-800`             | 標語、方案功能清單、徽章                   |
| **Eyebrow**                           | 14px                       | 700       | 1.428                   | `+0.05em`（`tracking-wider`）       | `brand`                           | 區段前導標，強制 `uppercase`               |
| **Logo 字標**                         | 24px                       | 700       | 1.25                    | **`-0.025em`**                      | `ink-800`                         | `font-ui`（Inter）                         |
| **價格數字**                          | 48px（內頁）/ 36px（首頁） | 700 / 900 | 1（內頁）/ 1.25（首頁） | normal                              | `brand` 或 `ink-900`              | `font-accent`（內頁）/ `font-sans`（首頁） |
| **裝飾序號**                          | 24px                       | 700       | 1.25                    | `+0.0417em`                         | `ink-300`                         | 隱私條目 01/02/03                          |
| **等寬**                              | 14px / 12px                | 400       | 1.428 / 1.333           | normal                              | `ink-500` / `ink-600`             | 雜湊、日期、系統需求                       |

字距律：**大標微正（+0.0185em）、卡片標中正（+0.0417em）、副標負（−0.0396em）、Logo 負（−0.025em）**。正字距用於拉開中文標題的呼吸感，負字距用於收緊視覺重量。

---

## 3. 幾何與效果 (Geometry & Effects)

### 3.1 圓角 (Border Radius)

⚠️ **整組 radius 級距被覆寫，與 Tailwind 預設完全不同**（預設 sm=2px / md=6px / lg=8px / xl=12px）。移植時不可沿用 Tailwind 直覺。

| Token           | 值         | 應用對象                                                                                     |
| --------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `--radius-sm`   | **10px**   | 導覽項、導覽 CTA、45×45 圖示鈕、語言下拉項、行動選單項                                       |
| `--radius-md`   | **16px**   | 輸入框、送出鈕、方案 CTA、平台 CTA、卡內清單容器、開關容器、圖片外框                         |
| `--radius-lg`   | **20px**   | Logo 圖、流程卡、行動下拉面板、語言下拉面板、文件側欄項、FAQ **展開態**、章節圖示方塊(40×40) |
| `--radius-xl`   | **24px**   | FAQ **收合態**、促銷卡、表格外框、舊版條目卡、圖示方塊(48×48)                                |
| `--radius-2xl`  | **50px**   | 方案卡、平台卡、訂閱卡、步驟卡、更新紀錄卡、文件面板、校驗碼區 —— **本站的招牌大圓角**       |
| `--radius-nav`  | **60px**   | 頂部導覽膠囊（手機降為 `lg` 20px）                                                           |
| `--radius-pill` | **9999px** | 所有徽章、Hero/底部 CTA 大鈕、圖示圈、emoji 圈、開關軌與鈕、浮動標籤                         |

例外的字面值：`rounded-[12px]`（內嵌截圖，3 處）、`rounded-[6px]`（Hero 主截圖）、`rounded-[4px]`（FAQ summary 的 focus-visible 外框）。

律：**內容物 10–16px、容器 20–24px、卡片 50px、互動膠囊 9999px**。FAQ 展開時圓角**縮小**（24 → 20px），是全站唯一的動態圓角。

### 3.2 陰影與發光 (Shadow)

品牌陰影是全站唯一的**常駐**陰影，灰陰影僅用於 hover 與浮層。

| Token / Class  | 值                                                                           | 對象                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--shadow-btn` | `0 5px 8px -5px rgba(0,159,183,0.2)`, `0 13px 20px -4px rgba(0,159,183,0.2)` | **所有 primary CTA**。雙層品牌色投影：近層 5px/8px 模糊、-5px 收縮；遠層 13px/20px 模糊、-4px 收縮 ⇒ 大範圍柔光而非硬投影 |
| `shadow-sm`    | `0 1px 3px 0 rgba(0,0,0,.1)`, `0 1px 2px -1px rgba(0,0,0,.1)`                | 浮動標籤、徽章、圖示圈、表格外框、文件面板、次級方案卡                                                                    |
| `shadow-md`    | `0 4px 6px -1px rgba(0,0,0,.1)`, `0 2px 4px -2px rgba(0,0,0,.1)`             | 步驟序號方塊、major 版本卡                                                                                                |
| `shadow-lg`    | `0 10px 15px -3px rgba(0,0,0,.1)`, `0 4px 6px -4px rgba(0,0,0,.1)`           | 焦點方案卡（首頁）、最新版本卡、方案卡 hover                                                                              |
| `shadow-xl`    | `0 20px 25px -5px rgba(0,0,0,.1)`, `0 8px 10px -6px rgba(0,0,0,.1)`          | 焦點方案卡（定價頁）、行動選單、語言下拉、平台卡 hover 與選中                                                             |

**發光／模糊**：`backdrop-blur-md` = `blur(12px)`，用於導覽膠囊（`--glass-nav`）與兩顆浮動標籤（`--glass-raised` / `--glass-raised-soft`）。這是本站唯一的毛玻璃效果。

### 3.3 邊框

| 情境               | 規格                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| 標準               | `1px solid var(--color-line-200)`                                     |
| 輸入框／表格／下拉 | `1px solid var(--color-line-300)`                                     |
| 導覽膠囊           | `1px solid var(--color-line-400)`                                     |
| 品牌 pill          | `1px solid var(--color-brand-border)`（20%）                          |
| 強調容器           | `1px solid var(--color-brand-border-strong)`（50%）                   |
| 焦點方案卡         | `2px solid rgba(0,159,183,0.4)` + 疊加漸層 mask 邊框                  |
| 選中平台卡         | `ring-2` = `0 0 0 2px var(--color-brand)`（全站唯一使用 ring 的地方） |
| 佔位               | `1px dashed`（`ink-300`；空價格與空 FAQ 答案的開發期佔位）            |
| `<hr>`             | `h-px bg-line-300 border-0`（用背景色畫線，非 border）                |

### 3.4 動效參數

| 參數       | 值                                                                 |
| ---------- | ------------------------------------------------------------------ |
| 預設時長   | `--default-transition-duration: 0.15s`                             |
| 預設曲線   | `--default-transition-timing-function: cubic-bezier(.4, 0, .2, 1)` |
| 互動過渡   | `transition duration-150` / `transition-colors duration-150`       |
| 位移與旋轉 | `duration-200`（卡片 hover 上浮、FAQ 圓角、chevron 旋轉）          |
| Logo hover | `scale-105` + `transition-transform`（150ms）                      |

全站**只有兩個時長（150 / 200ms）與一條曲線**，無自訂 easing、無 keyframes 動畫。

---

## 4. 核心元件規範 (Component Styles)

### 4.0 全站互動狀態總表

| 狀態                 | 統一規則                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Hover · 實色鈕**   | `bg-brand` → `bg-brand-hover`（＝同色降至 80% 不透明度，**非換深色**）                                                       |
| **Hover · Ghost 鈕** | `brand-surface` 10% → 16% 或 18%（未 token 化）                                                                              |
| **Hover · 中性鈕**   | `surface-subtle` → `surface-muted`；或改染邊框與文字為 `brand`                                                               |
| **Hover · 導覽項**   | 一律 `bg-brand-surface` + `text-brand`（頁尾例外：只換文字色，不加底）                                                       |
| **Hover · 卡片**     | `-translate-y-1`（上浮 4px）+ 陰影升一級（`shadow-lg` 或 `shadow-xl`），**不換邊框色**                                       |
| **Active**           | 全站統一 `active:translate-y-px`（下壓 1px）。**無 :active 換色、無 scale**                                                  |
| **Focus**            | `focus-visible:outline-2 outline-brand`，offset 依元件 `1`（輸入框）／`2`（圖示鈕、開關）／`4`（FAQ summary）。**不用 ring** |
| **Disabled**         | `opacity-60` + `cursor-not-allowed`（不改色相）                                                                              |
| **Selected**         | `bg-brand-surface` + `text-brand` + `font-bold`（導覽）；`ring-2 ring-brand` + `shadow-xl`（平台卡）                         |

### 4.1 按鈕 (Buttons)

**尺寸階**

Padding 一律以 CSS 縮寫順序記（垂直 水平）：

| 級別                   | Padding                         | 字級 / 字重       | 圓角      | 圖文間距        |
| ---------------------- | ------------------------------- | ----------------- | --------- | --------------- |
| **XL（Hero pill）**    | `24px 32px`（手機 `16px 24px`） | 20px → 18px / 700 | `pill`    | `gap-3`(12px)   |
| **L（底部 CTA pill）** | `20px 32px`                     | 18px / 700        | `pill`    | `gap-3`         |
| **M（卡片 CTA）**      | `14px`（全滿寬）或 `14px 24px`  | 16–18px / 700     | `md` 16px | `gap-2`(8px)    |
| **S（導覽 CTA）**      | `10px 20px`                     | 18px / **500**    | `sm` 10px | `gap-2.5`(10px) |
| **Icon-only**          | 45 × 45px（固定尺寸）           | —                 | `sm` 10px | —               |

**變體 × 狀態**

| 變體               | Default                                                                                           | Hover                                                                | Active             | Focus                          | Disabled                               |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------ | ------------------------------ | -------------------------------------- |
| **Primary 實色**   | `bg: #009fb7`<br>`color: #fff`<br>`border: 1px brand-border`（pill 版）<br>`shadow: --shadow-btn` | `bg: rgba(0,159,183,.8)`<br>陰影不變                                 | `translate-y: 1px` | `outline: 2px brand`, offset 2 | `opacity: .6`<br>`cursor: not-allowed` |
| **Ghost 品牌**     | `bg: rgba(0,159,183,.1)`<br>`color: #009fb7`<br>`border: 1px rgba(0,159,183,.2)`<br>**無陰影**    | `bg: rgba(0,159,183,.16)`（Hero）<br>`rgba(0,159,183,.18)`（定價頁） | `translate-y: 1px` | 同上                           | 同上                                   |
| **中性次要**       | `bg: #f8f8f9`<br>`color: #1f2933`<br>`border: 1px #d9d9d9`<br>無陰影                              | `bg: #e9e9ec`                                                        | `translate-y: 1px` | 同上                           | 同上                                   |
| **Outline 轉品牌** | `bg: #f8f8f9`<br>`color: #1f2933`<br>`border: 1px #d9d9d9`                                        | `border-color: #009fb7`<br>`color: #009fb7`<br>底色不變              | 無位移             | 同上                           | 同上                                   |
| **Icon-only**      | 透明底<br>`color: #1f2933`<br>45×45，`radius: 10px`                                               | `bg: rgba(0,159,183,.1)`<br>`color: #009fb7`                         | 無位移             | `outline: 2px brand`, offset 2 | —                                      |
| **文字連結**       | `color: #6b7280`<br>`underline`, `underline-offset: 4px`                                          | `color: #009fb7`                                                     | —                  | 瀏覽器預設                     | —                                      |

過渡：全部 `transition ... 150ms cubic-bezier(.4,0,.2,1)`。

> 內文連結另有一套：`color: brand` + `underline` + `font-weight: 500`（`.docs-prose a`），hover 轉 `brand-hover`，`underline-offset: 2px`。

### 4.2 圖示 (Icons)

**實作機制** —— 全部走 CSS Mask，**不是 `<img>`、不是字型圖示**：

```css
.icon {
  display: inline-block;
  flex: 0 0 auto;
  width: var(--icon-size, 24px);
  height: var(--icon-size, 24px);
  background-color: currentColor; /* ← 顏色永遠等於文字色 */
  mask: var(--icon) center / contain no-repeat;
}
.icon--lock {
  --icon: url("../icons/icon-lock.svg");
}
```

⇒ 圖示不可能與相鄰文字脫色。`text-brand` 染品牌青、`text-amber-500` 染警告橘，全靠繼承。

**設計語彙**

| 維度     | 規格                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 風格     | **單色實心填充（Filled / Solid）**，非線性描邊。所有 SVG 皆為單一 `<path fill>`，無 `stroke` 屬性                                   |
| 來源一   | **Phosphor Icons · Regular**（`viewBox 0 0 256 256`）：lock / gift / devices / storage / check / theme / lang / flow-arrow / apple  |
| 來源二   | **Material Design Icons**（`viewBox 0 0 24 24`）：computer / chevron-up                                                             |
| 來源三   | **Simple Icons**（`viewBox 0 0 24 24`）：OpenAI / Claude / Gemini 品牌標                                                            |
| 視覺筆畫 | Phosphor Regular 在 256 網格上為 **16u** ⇒ 24px 渲染下等效 **1.5px**；MDI chevron 為 `0.75 × 2 = 1.5px`。**兩套來源的光學重量一致** |
| 邊角處理 | 圓端、圓角接合（Phosphor Regular 的原生特徵），無尖角                                                                               |
| 顏色     | 恆為 `currentColor`，無雙色、無漸層                                                                                                 |

**尺寸階與文字比例**

| 圖示尺寸 | 設定方式              | 搭配字級 | 比例     | 場景                                   |
| -------- | --------------------- | -------- | -------- | -------------------------------------- |
| 16px     | `w-4 h-4`             | 12–14px  | ≈1.2×    | 清單勾勾、文件側欄項                   |
| 20px     | `w-5 h-5`             | 16px     | 1.25×    | 隱私頁清單                             |
| **24px** | 預設（`--icon-size`） | 16–20px  | 1.2–1.5× | 信任列、按鈕、導覽、notice             |
| 36px     | `[--icon-size:36px]`  | —        | —        | 圓形圖示圈內（`p-5` 內距 ⇒ 圈徑 76px） |
| 48px     | `[--icon-size:48px]`  | 16px     | 3×       | 流程指示箭頭                           |

圖文間距：`gap-2`(8px) → `gap-2.5`(10px) → `gap-3`(12px)，隨圖示變大而增。

**圖示容器**

| 容器               | 規格                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| 圓形圈（品牌底）   | `padding: 20px; border-radius: 9999px; background: brand-surface`                                |
| 圓形圈（白底浮起） | `padding: 20px; border-radius: 9999px; background: rgba(255,255,255,.85); box-shadow: shadow-sm` |
| 方形（48×48）      | `border-radius: 24px; background: brand-surface; color: brand`                                   |
| 方形（40×40）      | `border-radius: 20px; background: brand-surface; color: brand`                                   |
| emoji 圈（56×56）  | `border-radius: 9999px; background: brand-surface; font: 400 24px/1.33 var(--font-ui)`           |

### 4.3 卡片 (Cards)

| 規格                  | Default                                                                                                                            | Hover                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **方案卡（標準）**    | `bg: surface-card`; `border: 1px line-200`; `radius: 50px`; `padding: 28px`; `shadow-sm`（首頁）／無（定價頁）                     | `translateY(-4px)` + `shadow-lg`，200ms |
| **方案卡（焦點）**    | 疊加 2px 垂直漸層 mask 邊框 + `border: 2px rgba(0,159,183,.4)` + `shadow-lg`(首頁)／`shadow-xl`(定價頁) + `scale(1.05)`（≥1280px） | `translateY(-4px)`，陰影不再升級        |
| **平台卡**            | 漸層 mask 邊框; `radius: 50px`; `padding: 32px`（手機 24px）                                                                       | `translateY(-4px)` + `shadow-xl`        |
| **平台卡（OS 命中）** | 追加 `ring: 2px brand` + `shadow-xl`（常駐）                                                                                       | 同上                                    |
| **資訊卡**            | `bg: surface-card`; `border: 1px line-200`; `radius: 24px`; `padding: 24px`                                                        | 無                                      |
| **步驟卡**            | `bg: surface-subtle`; `border: 1px line-200`; `radius: 50px`; `padding: 32px`                                                      | 無                                      |
| **版本卡（最新）**    | 漸層 mask 邊框; `radius: 50px`; `padding: 32–40px`; `shadow-lg`                                                                    | 無                                      |
| **版本卡（一般）**    | `border: 1px line-200`; `shadow-md`（major）／`shadow-sm`                                                                          | 無                                      |

焦點卡的頂部徽章：`position: absolute; top: -12px`（首頁）／`-14px`（定價頁）`; left: 50%; transform: translateX(-50%)`。

### 4.4 FAQ 手風琴 (`<details>` / `<summary>`)

| 狀態      | 樣式                                                                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **收合**  | `bg: surface-card`; `border: 1px line-200`; `radius: 24px`（手機 16px）; `padding: 36px`（→28→20px）<br>summary：`font-weight: 400`; `20px`（→18→16px）; `line-height: 1.5`; `letter-spacing: +0.05em`; `color: ink-800`<br>chevron：`rotate(180deg)`                                                                                   |
| **展開**  | `border-color: transparent` + 1px 垂直漸層 mask 邊框（`#009fb7 → #3a3afd`）<br>`border-radius: 20px`（**縮小** 24 → 20px）<br>summary：`font-weight: 700`<br>chevron：`rotate(0)`，`transition-transform 200ms`<br>答案區：上方 `hr`(1px line-300) + `padding: 20px`; `bg: surface-faint`; `18px`/500/1.625/`+0.02em`; `color: ink-700` |
| **Focus** | summary：`outline: 2px brand`; `outline-offset: 4px`; `border-radius: 4px`                                                                                                                                                                                                                                                              |
| **其他**  | 原生標記隱藏：`list-none` + `[&::-webkit-details-marker]:hidden`；同組互斥：`name="faq"`                                                                                                                                                                                                                                                |

定價頁為簡化版：`padding: 24px`，summary 恆為 700/18px，答案以 `border-t line-200` 分隔，無 `surface-faint` 底。

### 4.5 輸入框與表單 (Input / Form)

| 元素                             | 規格                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **輸入框 Default**               | `padding: 14px 16px`; `radius: 16px`; `bg: surface-page`（**比卡片深，形成內凹**）; `border: 1px line-300`; `color: ink-900`; `font-size: 16px` |
| **Placeholder**                  | `color: ink-500`                                                                                                                                |
| **Focus**                        | `outline: 2px brand`; `outline-offset: 1px`（邊框不變色）                                                                                       |
| **Disabled**                     | `opacity: .6`                                                                                                                                   |
| **送出鈕**                       | `padding: 14px 24px`; `radius: 16px`; `bg: brand`; `color: #fff`; 700/16px; `shadow-btn`; disabled `opacity:.6 + not-allowed`                   |
| **狀態訊息**                     | 14px/500。成功與重複 → `text-brand`；載入中 → `text-ink-500`；錯誤／無效 → `text-red-500`                                                       |
| **隱私註記**                     | 12px/400/1.625，`color: ink-500`                                                                                                                |
| **卡片外框（`variant="card"`）** | 漸層 mask 邊框 + `bg: surface-card`; `radius: 50px`; `padding: 32px`（手機 24px）                                                               |

### 4.6 徽章與膠囊 (Badges / Pills)

共同基底：`border-radius: 9999px; font: 700 12px var(--font-sans)`。

| 變體          | Padding                 | 背景                                     | 文字      | 邊框               | 額外                                                                 |
| ------------- | ----------------------- | ---------------------------------------- | --------- | ------------------ | -------------------------------------------------------------------- |
| 品牌實色      | `4px 14px` / `2px 12px` | `brand`                                  | `#fff`    | —                  | `shadow-sm`、`tracking-wide`                                         |
| 品牌外框      | `4px 14px`              | `brand-surface`                          | `brand`   | `1px brand-border` | —                                                                    |
| 中性外框      | `4px 12px`              | `surface-subtle`                         | `ink-600` | `1px line-300`     | —                                                                    |
| 中性實色      | `2px 8px`               | `surface-muted`                          | `ink-600` | —                  | Beta 標                                                              |
| **Hero 徽章** | `6px 16px`              | `brand-surface`                          | `brand`   | `1px brand-border` | 放大為 **14px**/700                                                  |
| **浮動標籤**  | `24px 32px`             | `--glass-raised` / `--glass-raised-soft` | `ink-900` | `1px brand-border` | 20px/700、`+0.05em`、`uppercase`、`backdrop-blur(12px)`、`shadow-sm` |

### 4.7 導覽項 (Nav Items)

律：**Active = `bg-brand-surface` + `text-brand` + `font-bold`**，Idle = 中性色 + 同一組 hover 染色。

| 位置       | Padding / 圓角     | Idle                                                         | Active                                                                   |
| ---------- | ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 桌機主導覽 | `10px 14px` / `sm` | `color: ink-500`; 500/16px; `min-width: 92px`（Active 才有） | `bg: brand-surface`; `color: brand`; 700                                 |
| 行動選單   | `12px 16px` / `sm` | `color: ink-800`; 500/16px                                   | 同上                                                                     |
| 頁尾       | 無內距             | `color: ink-800`; 400/16px；hover **只換文字色**             | `color: brand`; 500                                                      |
| 文件側欄   | `10px 14px` / `lg` | `color: ink-700`; 14px                                       | `bg: brand-surface`; `color: brand`; 700（scroll-spy 以 `.active` 同步） |
| 語言下拉   | `10px 14px` / `sm` | `color: ink-800`; 500/16px                                   | `bg: brand-surface`; `color: brand`; 700                                 |
| 語言橫列   | `8px 12px` / `sm`  | `color: ink-700`; 500/14px                                   | 同上                                                                     |

**導覽膠囊容器**：`padding: 20px 40px`; `radius: 60px`; `bg: rgba(255,255,255,.7)`; `border: 1px line-400`; `backdrop-blur(12px)`。手機縮為 `12px 16px` + `radius: 20px`。
**下拉面板**：`bg: surface-card`; `border: 1px line-300`; `radius: 20px`; `shadow-xl`; `padding: 6px`。

### 4.8 開關 (Toggle Switch)

| 部件  | Off                                                                                   | On                  |
| ----- | ------------------------------------------------------------------------------------- | ------------------- |
| 軌道  | `56 × 32px`; `radius: 9999px`; `bg: surface-muted`; `border: 1px line-300`            | `bg: brand`；無邊框 |
| 鈕    | `24 × 24px`; `radius: 9999px`; `bg: #fff`; `shadow-sm`; `top: 4px`; `translateX(4px)` | `translateX(28px)`  |
| 過渡  | 軌道 `transition-colors 150ms`；鈕 `transition-transform 150ms`                       |                     |
| Focus | `outline: 2px brand`; `outline-offset: 2px`                                           |                     |

### 4.9 內容樣式 (Notice / Table / Code)

**Notice Callout**

```css
.notice {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.125rem 1.25rem; /* 18px 20px */
  border-radius: var(--radius-md); /* 16px */
  border: 1px solid; /* 色由變體決定 */
  margin: 1.5rem 0;
}
.notice p {
  margin: 0;
  line-height: 1.6;
}
.notice-body strong {
  display: block;
  margin-bottom: 0.25rem;
  color: ink-900;
  font-weight: 700;
}
.notice-body p {
  font-size: 0.875rem;
  line-height: 1.6;
}
```

圖示：`shrink-0 mt-1`（4px 下推對齊首行）。三色見 §1.5。

**表格**

| 部件   | 規格                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| 外框   | `overflow-x: auto`; `radius: 24px`; `border: 1px line-300`; `bg: surface-page`／`surface-card`; `shadow-sm`     |
| 表頭   | `bg: surface-subtle`; `border-bottom: 1px line-300`; `color: ink-900`; 700                                      |
| 列分隔 | `divide-y` = `1px line-200`                                                                                     |
| 儲存格 | `padding: 16px`（≥768px `20px`）; `font-size: 14px`; `color: ink-800`                                           |
| 高亮欄 | 對**不透明**的 `--color-brand` 取 alpha：表頭 `bg-brand/15`（Pro）· `/10`（Lifetime）；內文 `bg-brand/8` · `/4` |

**程式碼**

```css
pre {
  background: #1a1e29;
  color: #e2e8f0;
  padding: 1.25rem;
  border-radius: 16px;
  font-size: 0.875rem;
  line-height: 1.6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
:not(pre) > code {
  background: var(--color-brand-surface);
  color: var(--color-brand);
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: 0.875em;
}
```

`pre` 恆為深色，不隨主題切換。inline `code` 的 6px 圓角是全站唯一未走 radius token 的圓角。

---

## 5. 工程化輸出

### 5.1 Tailwind v4 `@theme`（本專案實際 token 源）

```css
@import "tailwindcss";

@theme {
  /* ===== Fonts ===== */
  --font-sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
  --font-ui: "Inter", "Noto Sans TC", sans-serif;
  --font-accent:
    "Big Shoulders", "Big Shoulders Display", "Noto Sans TC", sans-serif;

  /* ===== Brand（單一色相 + alpha 階）===== */
  --color-brand: #009fb7;
  --color-brand-hover: rgba(0, 159, 183, 0.8);
  --color-brand-surface: rgba(0, 159, 183, 0.1);
  --color-brand-surface-hover: rgba(0, 159, 183, 0.16);
  --color-brand-border: rgba(0, 159, 183, 0.2);
  --color-brand-border-strong: rgba(0, 159, 183, 0.5);

  /* 漸層端點 */
  --color-teal-500: #009fb7;
  --color-teal-900: #004651;

  /* ===== Ink（文字中性階）===== */
  --color-ink-900: #05060f;
  --color-ink-800: #1f2933;
  --color-ink-700: #353535;
  --color-ink-600: #5e5e5e;
  --color-ink-500: #6b7280;
  --color-ink-400: #9ca3af;
  --color-ink-300: #bababa;

  /* ===== Surface ===== */
  --color-surface-page: #f4f4f8;
  --color-surface-tint: #f1fdff;
  --color-surface-card: #ffffff;
  --color-surface-subtle: #f8f8f9;
  --color-surface-faint: #f9f9f9;
  --color-surface-muted: #e9e9ec;

  /* ===== Line ===== */
  --color-line-200: #e6e6ea;
  --color-line-300: #d9d9d9;
  --color-line-400: #d4d4d3;

  /* ===== Radius（刻意覆寫 Tailwind 預設）===== */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-2xl: 50px;
  --radius-nav: 60px;
  --radius-pill: 9999px;

  /* ===== Shadow ===== */
  --shadow-btn:
    0 5px 8px -5px rgba(0, 159, 183, 0.2),
    0 13px 20px -4px rgba(0, 159, 183, 0.2);
}

html.dark {
  --color-surface-page: #0d1117;
  --color-surface-tint: #161b22;
  --color-surface-card: #161b22;
  --color-surface-subtle: #21262d;
  --color-surface-faint: #1c2128;
  --color-surface-muted: #30363d;

  --color-line-200: #30363d;
  --color-line-300: #30363d;
  --color-line-400: #484f58;

  --color-ink-900: #f0f6fc;
  --color-ink-800: #e6edf3;
  --color-ink-700: #c9d1d9;
  --color-ink-600: #8b949e;
  --color-ink-500: #8b949e;
  --color-ink-400: #6e7681;
  --color-ink-300: #484f58;
  /* brand 系列不翻轉 */
}
```

### 5.2 框架無關的純 CSS Variables

```css
:root {
  /* ===== Color ===== */
  --brand: #009fb7;
  --brand-hover: rgba(0, 159, 183, 0.8);
  --brand-surface: rgba(0, 159, 183, 0.1);
  --brand-surface-hover: rgba(0, 159, 183, 0.16);
  --brand-border: rgba(0, 159, 183, 0.2);
  --brand-border-strong: rgba(0, 159, 183, 0.5);
  --gradient-end: #3a3afd;
  --teal-900: #004651;

  --ink-900: #05060f;
  --ink-800: #1f2933;
  --ink-700: #353535;
  --ink-600: #5e5e5e;
  --ink-500: #6b7280;
  --ink-400: #9ca3af;
  --ink-300: #bababa;

  --surface-page: #f4f4f8;
  --surface-card: #fff;
  --surface-tint: #f1fdff;
  --surface-subtle: #f8f8f9;
  --surface-faint: #f9f9f9;
  --surface-muted: #e9e9ec;

  --line-200: #e6e6ea;
  --line-300: #d9d9d9;
  --line-400: #d4d4d3;
  --danger: #fb2c36;
  --warning: #fe9a00;

  /* ===== Typography ===== */
  --font-sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
  --font-ui: "Inter", "Noto Sans TC", sans-serif;
  --font-accent: "Big Shoulders", "Noto Sans TC", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
  --text-5xl: 48px;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --tracking-title: 0.0185em; /* 大標 */
  --tracking-card: 0.0417em; /* 卡片標 */
  --tracking-wider: 0.05em; /* eyebrow / uppercase */
  --tracking-sub: -0.0396em; /* 副標 */
  --tracking-logo: -0.025em;

  /* ===== Geometry ===== */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-2xl: 50px;
  --radius-nav: 60px;
  --radius-pill: 9999px;
  --border-w: 1px;

  /* ===== Elevation ===== */
  --shadow-btn:
    0 5px 8px -5px rgba(0, 159, 183, 0.2),
    0 13px 20px -4px rgba(0, 159, 183, 0.2);
  --shadow-sm:
    0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md:
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg:
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl:
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --blur-glass: 12px;

  /* ===== Motion ===== */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);

  /* ===== Gradients ===== */
  --gradient-hero: radial-gradient(
    ellipse 1300px 900px at 30% 0%,
    rgba(0, 159, 183, 0.22) 0%,
    rgba(0, 159, 183, 0.06) 50%,
    transparent 75%
  );
  --gradient-title: linear-gradient(
    90deg,
    var(--brand) 0%,
    var(--teal-900) 100%
  );
  --gradient-edge: linear-gradient(
    180deg,
    var(--brand) 0%,
    var(--gradient-end) 100%
  );
}

.dark {
  --surface-page: #0d1117;
  --surface-card: #161b22;
  --surface-tint: #161b22;
  --surface-subtle: #21262d;
  --surface-faint: #1c2128;
  --surface-muted: #30363d;
  --line-200: #30363d;
  --line-300: #30363d;
  --line-400: #484f58;
  --ink-900: #f0f6fc;
  --ink-800: #e6edf3;
  --ink-700: #c9d1d9;
  --ink-600: #8b949e;
  --ink-500: #8b949e;
  --ink-400: #6e7681;
  --ink-300: #484f58;
}

/* ---------- 元件 ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-sans);
  font-weight: 700;
  transition: all var(--duration-fast) var(--ease);
}
.btn:active {
  transform: translateY(1px);
}
.btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn--primary {
  background: var(--brand);
  color: #fff;
  border: var(--border-w) solid var(--brand-border);
  box-shadow: var(--shadow-btn);
}
.btn--primary:hover {
  background: var(--brand-hover);
}

.btn--ghost {
  background: var(--brand-surface);
  color: var(--brand);
  border: var(--border-w) solid var(--brand-border);
}
.btn--ghost:hover {
  background: var(--brand-surface-hover);
}

.btn--neutral {
  background: var(--surface-subtle);
  color: var(--ink-800);
  border: var(--border-w) solid var(--line-300);
}
.btn--neutral:hover {
  background: var(--surface-muted);
}

.btn--xl {
  padding: 24px 32px;
  font-size: var(--text-xl);
  border-radius: var(--radius-pill);
}
.btn--md {
  padding: 14px 24px;
  font-size: var(--text-base);
  border-radius: var(--radius-md);
}
.btn--sm {
  padding: 10px 20px;
  font-size: var(--text-lg);
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.card {
  background: var(--surface-card);
  border: var(--border-w) solid var(--line-200);
  border-radius: var(--radius-2xl);
  padding: 28px;
  transition:
    transform var(--duration-base) var(--ease),
    box-shadow var(--duration-base) var(--ease);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 漸層邊框：以 mask 挖空內容區，只留 2px 外框 */
.card--gradient {
  position: relative;
  border-color: transparent;
}
.card--gradient::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: var(--gradient-edge);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.input {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--surface-page); /* 比卡片深 ⇒ 內凹 */
  border: var(--border-w) solid var(--line-300);
  color: var(--ink-900);
  font-size: var(--text-base);
}
.input::placeholder {
  color: var(--ink-500);
}
.input:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 1px;
}
.input:disabled {
  opacity: 0.6;
}

.badge {
  border-radius: var(--radius-pill);
  font: 700 var(--text-xs)/1.33 var(--font-sans);
  padding: 4px 14px;
  background: var(--brand);
  color: #fff;
}

.nav-item {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--ink-500);
  font-weight: 500;
  font-size: var(--text-base);
  transition:
    color var(--duration-fast) var(--ease),
    background-color var(--duration-fast) var(--ease);
}
.nav-item:hover,
.nav-item[aria-current="page"] {
  background: var(--brand-surface);
  color: var(--brand);
}
.nav-item[aria-current="page"] {
  font-weight: 700;
}

/* 單色遮罩圖示：顏色永遠 = 文字色 */
.icon {
  display: inline-block;
  flex: 0 0 auto;
  width: var(--icon-size, 24px);
  height: var(--icon-size, 24px);
  background-color: currentColor;
  -webkit-mask: var(--icon) center / contain no-repeat;
  mask: var(--icon) center / contain no-repeat;
}

.glass {
  background: rgba(255, 255, 255, 0.7);
  border: var(--border-w) solid var(--line-400);
  border-radius: var(--radius-nav);
  backdrop-filter: blur(var(--blur-glass));
}
.dark .glass {
  background: rgba(22, 27, 34, 0.85);
}
```

### 5.3 Design Tokens (JSON)

```json
{
  "color": {
    "brand": {
      "base": "#009fb7",
      "hover": "rgba(0,159,183,0.8)",
      "surface": "rgba(0,159,183,0.1)",
      "surfaceHover": "rgba(0,159,183,0.16)",
      "border": "rgba(0,159,183,0.2)",
      "borderStrong": "rgba(0,159,183,0.5)",
      "note": "深色模式不翻轉"
    },
    "ink": {
      "900": "#05060f",
      "800": "#1f2933",
      "700": "#353535",
      "600": "#5e5e5e",
      "500": "#6b7280",
      "300": "#bababa"
    },
    "inkDark": {
      "900": "#f0f6fc",
      "800": "#e6edf3",
      "700": "#c9d1d9",
      "600": "#8b949e",
      "500": "#8b949e",
      "300": "#484f58"
    },
    "surface": {
      "page": "#f4f4f8",
      "card": "#ffffff",
      "tint": "#f1fdff",
      "subtle": "#f8f8f9",
      "faint": "#f9f9f9",
      "muted": "#e9e9ec"
    },
    "surfaceDark": {
      "page": "#0d1117",
      "card": "#161b22",
      "tint": "#161b22",
      "subtle": "#21262d",
      "faint": "#1c2128",
      "muted": "#30363d"
    },
    "line": { "200": "#e6e6ea", "300": "#d9d9d9", "400": "#d4d4d3" },
    "lineDark": { "200": "#30363d", "300": "#30363d", "400": "#484f58" },
    "status": {
      "danger": "#fb2c36",
      "warning": "#fe9a00",
      "success": "#009fb7"
    }
  },
  "gradient": {
    "hero": {
      "type": "radial",
      "shape": "ellipse 1300px 900px at 30% 0%",
      "stops": [
        "rgba(0,159,183,0.22) 0%",
        "rgba(0,159,183,0.06) 50%",
        "transparent 75%"
      ]
    },
    "title": {
      "type": "linear",
      "angle": "90deg",
      "stops": ["#009fb7 0%", "#004651 100%"],
      "usage": "background-clip: text"
    },
    "edge": {
      "type": "linear",
      "angle": "180deg",
      "stops": ["#009fb7 0%", "#3a3afd 100%"],
      "usage": "mask-composite 邊框",
      "width": { "card": "2px", "faq": "1px" }
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
      "ui": "'Inter', 'Noto Sans TC', sans-serif",
      "accent": "'Big Shoulders', 'Noto Sans TC', sans-serif",
      "mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    },
    "fontWeight": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700,
      "black": 900
    },
    "scale": {
      "h1Hero": {
        "size": [54, 44, 36, 28],
        "weight": 900,
        "lineHeight": 1.2,
        "letterSpacing": "0.0185em"
      },
      "h1Page": {
        "size": [48, 36, 28],
        "weight": 900,
        "lineHeight": 1.2,
        "letterSpacing": "normal"
      },
      "h2Section": {
        "size": [48, 40, 32, 26],
        "weight": 700,
        "lineHeight": 1.5,
        "letterSpacing": "0.0185em",
        "transform": "uppercase",
        "fill": "gradient"
      },
      "h2Page": {
        "size": [36, 30],
        "weight": 900,
        "lineHeight": 1.111,
        "letterSpacing": "normal"
      },
      "h2Card": {
        "size": [24, 20],
        "weight": 700,
        "lineHeight": 1.333,
        "letterSpacing": "normal"
      },
      "h3Feature": {
        "size": [32, 24],
        "weight": 700,
        "lineHeight": 1.25,
        "letterSpacing": "0.0313em"
      },
      "h3Card": {
        "size": [24],
        "weight": 700,
        "lineHeight": 1.25,
        "letterSpacing": "0.0417em"
      },
      "h3Sub": {
        "size": [20],
        "weight": 700,
        "lineHeight": 1.4,
        "letterSpacing": "normal"
      },
      "h3Prose": {
        "size": [18],
        "weight": 700,
        "lineHeight": "28px",
        "letterSpacing": "normal"
      },
      "subtitle": {
        "size": [28, 22, 18],
        "weight": 700,
        "lineHeight": 1.25,
        "letterSpacing": "-0.0396em"
      },
      "leadHome": {
        "size": [24, 20, 18],
        "weight": 400,
        "lineHeight": 1.2,
        "letterSpacing": "0.0417em"
      },
      "leadPage": {
        "size": [20, 18],
        "weight": 400,
        "lineHeight": 1.625,
        "letterSpacing": "normal"
      },
      "body": {
        "size": [16],
        "weight": 400,
        "lineHeight": 1.625,
        "letterSpacing": "normal"
      },
      "small": {
        "size": [14],
        "weight": 400,
        "lineHeight": 1.428,
        "letterSpacing": "normal"
      },
      "micro": {
        "size": [12],
        "weight": 400,
        "lineHeight": 1.333,
        "letterSpacing": "normal"
      },
      "eyebrow": {
        "size": [14],
        "weight": 700,
        "lineHeight": 1.428,
        "letterSpacing": "0.05em",
        "transform": "uppercase"
      },
      "logo": {
        "size": [24],
        "weight": 700,
        "lineHeight": 1.25,
        "letterSpacing": "-0.025em",
        "family": "ui"
      },
      "price": {
        "size": [48, 36],
        "weight": 700,
        "lineHeight": 1,
        "family": "accent"
      }
    },
    "iconSize": { "xs": 16, "sm": 20, "base": 24, "lg": 36, "xl": 48 }
  },
  "radius": {
    "sm": "10px",
    "md": "16px",
    "lg": "20px",
    "xl": "24px",
    "2xl": "50px",
    "nav": "60px",
    "pill": "9999px",
    "mapping": {
      "control": "sm",
      "field": "md",
      "panel": "lg",
      "container": "xl",
      "card": "2xl",
      "navbar": "nav",
      "capsule": "pill"
    }
  },
  "border": {
    "width": {
      "default": "1px",
      "featured": "2px",
      "gradientCard": "2px",
      "gradientFaq": "1px"
    },
    "style": ["solid", "dashed(placeholder)"]
  },
  "shadow": {
    "brandCta": "0 5px 8px -5px rgba(0,159,183,.2), 0 13px 20px -4px rgba(0,159,183,.2)",
    "sm": "0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)",
    "md": "0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)",
    "lg": "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
    "xl": "0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)",
    "glassBlur": "12px"
  },
  "motion": {
    "duration": { "fast": "150ms", "base": "200ms" },
    "easing": { "default": "cubic-bezier(.4, 0, .2, 1)" },
    "patterns": {
      "buttonPress": "translateY(1px)",
      "cardLift": "translateY(-4px) + shadow +1 級, 200ms",
      "chevron": "rotate(180deg) → rotate(0), 200ms",
      "logoHover": "scale(1.05), 150ms",
      "toggleKnob": "translateX(4px) → translateX(28px), 150ms"
    }
  },
  "states": {
    "hoverSolid": "brand → brand @80% alpha",
    "hoverGhost": "brand @10% → @16%",
    "hoverNeutral": "surface-subtle → surface-muted",
    "hoverNav": "bg brand @10% + text brand",
    "hoverCard": "translateY(-4px) + shadow 升一級",
    "active": "translateY(1px)",
    "focus": "outline 2px brand, offset 1|2|4",
    "selected": "bg brand @10% + text brand + weight 700",
    "disabled": "opacity .6 + cursor not-allowed"
  }
}
```

---
