// src/popup/icons.ts
// Phosphor Icons（Regular / Fill）。逐一 import，只有用到的圖示會被打包；
// 小於 4KB 的 SVG 由 Vite 內嵌為 data URI，不會多出網路請求。

import { domainCategory, type DomainCategory } from '@/utils/domain'

import arrowCounterClockwise from '@phosphor-icons/core/regular/arrow-counter-clockwise.svg?url'
import caretDown from '@phosphor-icons/core/regular/caret-down.svg?url'
import chartBar from '@phosphor-icons/core/regular/chart-bar.svg?url'
import chartBarFill from '@phosphor-icons/core/fill/chart-bar-fill.svg?url'
import chats from '@phosphor-icons/core/regular/chats.svg?url'
import check from '@phosphor-icons/core/regular/check.svg?url'
import clockClockwise from '@phosphor-icons/core/regular/clock-clockwise.svg?url'
import code from '@phosphor-icons/core/regular/code.svg?url'
import downloadSimple from '@phosphor-icons/core/regular/download-simple.svg?url'
import envelope from '@phosphor-icons/core/regular/envelope.svg?url'
import gear from '@phosphor-icons/core/regular/gear.svg?url'
import gearFill from '@phosphor-icons/core/fill/gear-fill.svg?url'
import globe from '@phosphor-icons/core/regular/globe.svg?url'
import house from '@phosphor-icons/core/regular/house.svg?url'
import houseFill from '@phosphor-icons/core/fill/house-fill.svg?url'
import info from '@phosphor-icons/core/regular/info.svg?url'
import pause from '@phosphor-icons/core/fill/pause-fill.svg?url'
import play from '@phosphor-icons/core/fill/play-fill.svg?url'
import playCircle from '@phosphor-icons/core/regular/play-circle.svg?url'
import plus from '@phosphor-icons/core/regular/plus.svg?url'
import prohibit from '@phosphor-icons/core/regular/prohibit.svg?url'
import shield from '@phosphor-icons/core/regular/shield.svg?url'
import shieldFill from '@phosphor-icons/core/fill/shield-fill.svg?url'
import sparkle from '@phosphor-icons/core/regular/sparkle.svg?url'
import trash from '@phosphor-icons/core/regular/trash.svg?url'
import uploadSimple from '@phosphor-icons/core/regular/upload-simple.svg?url'
import warning from '@phosphor-icons/core/regular/warning.svg?url'
import x from '@phosphor-icons/core/regular/x.svg?url'

export const ICONS = {
  'arrow-counter-clockwise': arrowCounterClockwise,
  'caret-down': caretDown,
  'chart-bar': chartBar,
  'chart-bar-fill': chartBarFill,
  chats,
  check,
  'clock-clockwise': clockClockwise,
  code,
  'download-simple': downloadSimple,
  envelope,
  gear,
  'gear-fill': gearFill,
  globe,
  house,
  'house-fill': houseFill,
  info,
  pause,
  play,
  'play-circle': playCircle,
  plus,
  prohibit,
  shield,
  'shield-fill': shieldFill,
  sparkle,
  trash,
  'upload-simple': uploadSimple,
  warning,
  x,
} as const

export type IconName = keyof typeof ICONS

const CATEGORY_ICON: Record<DomainCategory, IconName> = {
  media: 'play-circle',
  social: 'chats',
  developer: 'code',
  mail: 'envelope',
  general: 'globe',
}

export function iconForDomain(domain: string): IconName {
  return CATEGORY_ICON[domainCategory(domain)]
}
