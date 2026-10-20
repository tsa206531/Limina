// scripts/build-logo.mjs
// 產生擴充功能圖示：public/icons/icon.svg 與各尺寸 PNG
// - icon-{size}.png        一般狀態（品牌青 #009fb7）
// - icon-paused-{size}.png 封鎖暫停時的工具列圖示（灰階）
//
// 用法：npm run logo（修改圖形後執行，產物需一併 commit）

import { writeFile } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'

const SIZES = [16, 32, 48, 128]
const OUT_DIR = new URL('../public/icons/', import.meta.url)

/** 拱門（limen = 門檻）＋ 門檻線 ＋ 門內一點光。與 src/popup/components/LogoMark.vue 同一組圖形 */
const logo = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="30" fill="${bg}"/>
  <path d="M42 94V62a22 22 0 0 1 44 0v32" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M28 98h72" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
  <circle cx="64" cy="72" r="8" fill="#fff"/>
</svg>
`

const variants = { icon: logo('#009fb7'), 'icon-paused': logo('#9ca3af') }

await writeFile(new URL('icon.svg', OUT_DIR), variants.icon)
for (const [name, svg] of Object.entries(variants)) {
  for (const size of SIZES) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
    await writeFile(new URL(`${name}${size}.png`, OUT_DIR), png)
  }
}
console.log(`✓ icons written for sizes ${SIZES.join(', ')}`)
