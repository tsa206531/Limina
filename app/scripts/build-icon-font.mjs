// scripts/build-icon-font.mjs
// 產生只含專案用到圖示的 Material Symbols 子集字型（約數 KB，取代完整的 3.4 MB 字型）
//
// 用法：新增或改用圖示後，把名稱加進 ICONS，再執行
//   npm run icons
// 產物 src/assets/fonts/material-symbols-subset.woff2 需一併 commit

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// 所有用到的圖示名稱（含動態圖示：src/utils/domain.ts 的 CATEGORY_ICON、AppLayout 導覽列、GlassCardExpandable 的 icon prop）
const ICONS = [
  'add', 'add_link', 'bar_chart', 'code', 'delete', 'delete_sweep', 'download',
  'edit_note', 'expand_more', 'forum', 'home', 'inbox', 'lock', 'lock_open',
  'mail', 'more_time', 'notifications', 'pause', 'pie_chart', 'play_arrow',
  'play_circle', 'public', 'restart_alt', 'settings', 'settings_suggest',
  'shield', 'trending_up', 'upload', 'warning',
]

// 固定 opsz 24 / wght 400 / GRAD 0，保留 FILL 0..1（導覽列使用中的項目會填滿）
const AXES = 'opsz,wght,FILL,GRAD@24,400,0..1,0'
const OUT = fileURLToPath(new URL('../src/assets/fonts/material-symbols-subset.woff2', import.meta.url))

const names = [...new Set(ICONS)].sort() // API 要求依字母排序
const cssUrl =
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:${AXES}` +
  `&icon_names=${names.join(',')}&display=block`

// 需要現代瀏覽器的 UA，API 才會回傳 woff2
const css = await (await fetch(cssUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
})).text()

const fontUrl = css.match(/url\((https:[^)]+)\)/)?.[1]
if (!fontUrl) throw new Error(`Unexpected response from Google Fonts:\n${css}`)

const font = Buffer.from(await (await fetch(fontUrl)).arrayBuffer())
await mkdir(new URL('../src/assets/fonts/', import.meta.url), { recursive: true })
await writeFile(OUT, font)
console.log(`✓ ${names.length} icons → ${OUT} (${(font.length / 1024).toFixed(1)} KB)`)
