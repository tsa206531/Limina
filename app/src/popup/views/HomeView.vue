<template>
  <div class="flex flex-col gap-3">
    <!-- 完成一個專注時段 -->
    <section v-if="timerStore.recentSession" class="card flex items-start gap-3 border-brand/[0.35] bg-brand/[0.08] p-4">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <AppIcon name="sparkle" :size="22" />
      </span>
      <div class="flex-1">
        <h2 class="font-bold text-ink-900">{{ $t('home.sessionDone') }}</h2>
        <p class="mt-0.5 text-sm text-ink-700">
          {{ $t('home.sessionDoneBody', { time: duration(timerStore.recentSession.ms, 'ceil') }) }}
        </p>
        <button class="btn-primary btn-sm mt-3" @click="startAgain">{{ $t('home.again') }}</button>
      </div>
      <button class="icon-btn -mr-2 -mt-2 h-8 w-8" :aria-label="$t('common.close')" @click="timerStore.dismissSession()">
        <AppIcon name="x" :size="16" />
      </button>
    </section>

    <!-- 計時器 -->
    <section class="card p-5">
      <div class="relative mx-auto h-48 w-48">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 256 256" aria-hidden="true">
          <circle cx="128" cy="128" r="112" fill="none" stroke="var(--line-200)" stroke-width="14" />
          <circle
            cx="128" cy="128" r="112" fill="none" stroke="#009fb7" stroke-width="14" stroke-linecap="round"
            class="transition-[stroke-dashoffset] duration-1000 ease-linear"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-5xl font-bold tabular-nums tracking-tight text-ink-900" aria-live="off">
            {{ timerStore.hasTimer ? timerStore.formatted() : formatClock(selectedMinutes * 60) }}
          </span>
        </div>
      </div>

      <p class="mt-3 text-center text-sm font-medium" :class="timerStore.hasTimer ? 'text-brand' : 'text-ink-600'">
        {{ statusLine }}
      </p>

      <!-- 開始前：時長與封鎖方式 -->
      <template v-if="!timerStore.hasTimer">
        <div class="segmented mt-4" role="group" :aria-label="$t('home.minutes')">
          <button
            v-for="m in TIMER_PRESETS"
            :key="m"
            class="segment tabular-nums"
            :aria-pressed="!customMode && selectedMinutes === m"
            @click="selectPreset(m)"
          >
            {{ m }}
          </button>
          <button class="segment" :aria-pressed="customMode" @click="customMode = true">
            {{ $t('common.custom') }}
          </button>
        </div>
        <label v-if="customMode" class="mt-2 flex items-center gap-2">
          <input
            v-model.number="customMinutes"
            type="number"
            :min="TIMER_MIN" :max="TIMER_MAX"
            class="input w-24 text-center tabular-nums"
            @blur="customMinutes = clampInt(customMinutes, TIMER_MIN, TIMER_MAX, 25)"
            @keyup.enter="toggleTimer"
          />
          <span class="text-sm text-ink-600">{{ $t('home.minutes') }}</span>
        </label>

        <p class="eyebrow mt-4">{{ $t('home.modeTitle') }}</p>
        <div class="segmented mt-2" role="group" :aria-label="$t('home.modeTitle')">
          <button
            v-for="m in MODES"
            :key="m"
            class="segment"
            :aria-pressed="mode === m"
            @click="setMode(m)"
          >
            {{ $t(`home.mode.${m}`) }}
          </button>
        </div>
        <p class="mt-2 text-xs leading-relaxed text-ink-600">{{ $t(`home.modeDesc.${mode}`) }}</p>
      </template>

      <!-- 控制列 -->
      <div class="mt-5 flex items-center justify-center gap-6">
        <button
          class="flex h-12 w-12 items-center justify-center rounded-full border border-line-300 bg-surface-subtle text-ink-700 transition hover:bg-surface-muted active:translate-y-px"
          :disabled="!timerStore.hasTimer"
          :aria-label="$t('home.reset')"
          :title="$t('home.reset')"
          @click="timerStore.cancel()"
        >
          <AppIcon name="arrow-counter-clockwise" :size="20" />
        </button>

        <button
          class="flex h-16 w-16 items-center justify-center rounded-lg bg-brand text-white shadow-btn transition hover:bg-brand/80 active:translate-y-px"
          :aria-label="primaryLabel"
          :title="primaryLabel"
          @click="toggleTimer"
        >
          <AppIcon :name="timerStore.state.isActive ? 'pause' : 'play'" :size="28" />
        </button>

        <button
          class="flex h-12 w-12 items-center justify-center rounded-full border border-line-300 bg-surface-subtle text-ink-700 transition hover:bg-surface-muted active:translate-y-px"
          :disabled="!timerStore.hasTimer"
          :aria-label="$t('home.addTime')"
          :title="$t('home.addTime')"
          @click="timerStore.extend(5)"
        >
          <AppIcon name="clock-clockwise" :size="20" />
        </button>
      </div>
    </section>

    <!-- 目前網站 -->
    <section class="card p-4">
      <p class="eyebrow">{{ $t('home.currentSite') }}</p>
      <template v-if="currentHost">
        <div class="mt-2 flex items-center gap-2">
          <AppIcon name="globe" :size="18" class="text-ink-500" />
          <span class="min-w-0 flex-1 truncate font-bold text-ink-900">{{ currentHost }}</span>
          <span class="badge" :class="statusClass">{{ statusLabel }}</span>
        </div>
        <select
          v-if="domainChoices.length > 1"
          v-model="selectedDomain"
          class="input mt-3 w-full py-2"
        >
          <option v-for="d in domainChoices" :key="d" :value="d">{{ d }}</option>
        </select>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <button class="btn-ghost btn-sm" :disabled="!selectedDomain || selectedListType === 'locked'" @click="quickAdd('locked')">
            <AppIcon name="prohibit" :size="16" />
            {{ $t('home.lockSite') }}
          </button>
          <button class="btn-neutral btn-sm" :disabled="!selectedDomain || selectedListType === 'white'" @click="quickAdd('white')">
            <AppIcon name="check" :size="16" />
            {{ $t('home.allowSite') }}
          </button>
        </div>
      </template>
      <p v-else class="mt-2 text-sm text-ink-500">{{ $t('home.noSite') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { domainOptions } from '@/utils/domain'
import { evaluateBlock, readBlockState } from '@/utils/block'
import {
  TIMER_MAX, TIMER_MIN, TIMER_PRESETS, clampInt, focusModeOf, settingsForMode,
  type BlockStatus, type FocusMode,
} from '@/types'
import AppIcon from '../components/AppIcon.vue'
import { showToast } from '../composables/useToast'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useBlocklistStore } from '../stores/useBlocklistStore'
import { useBlockingStore } from '../stores/useBlockingStore'
import { formatClock, useTimerStore } from '../stores/useTimerStore'

const MODES: FocusMode[] = ['blocklist', 'whitelist', 'free']

const { t, duration } = useI18n()
const settingsStore = useSettingsStore()
const blocklistStore = useBlocklistStore()
const blockingStore = useBlockingStore()
const timerStore = useTimerStore()

const currentUrl = ref('')
const currentHost = ref('')
const blockStatus = ref<BlockStatus>('none')
const domainChoices = ref<string[]>([])
const selectedDomain = ref('')

const presetMinutes = ref(25)
const customMode = ref(false)
const customMinutes = ref(25)
const selectedMinutes = computed(() =>
  customMode.value ? clampInt(customMinutes.value, TIMER_MIN, TIMER_MAX, 25) : presetMinutes.value,
)

const mode = computed(() => focusModeOf(settingsStore.settings))

/** 下拉選中的網域目前在哪份名單（決定快速加入按鈕是否可按） */
const selectedListType = computed(() =>
  blocklistStore.entries.find((e) => e.domain === selectedDomain.value)?.type ?? null,
)

const statusLine = computed(() => {
  const modeLabel = t(`home.mode.${mode.value}`)
  if (timerStore.state.isActive) return t('home.statusFocusing', { mode: modeLabel })
  if (timerStore.isPaused) return t('home.statusPaused', { mode: modeLabel })
  return t('home.statusIdle')
})

const primaryLabel = computed(() => {
  if (timerStore.state.isActive) return t('home.pause')
  if (timerStore.isPaused) return t('home.resume')
  return t('home.start')
})

const statusLabel = computed(() => ({
  locked: t('home.statusLocked'),
  white: t('home.statusWhite'),
  none: t('home.statusNone'),
})[blockStatus.value])

// 品牌實色 = 會被擋；品牌外框 = 永遠允許；中性 = 不在名單
const statusClass = computed(() => ({
  locked: 'bg-brand text-white',
  white: 'border border-brand/20 bg-brand/10 text-brand',
  none: 'border border-line-300 bg-surface-subtle text-ink-600',
})[blockStatus.value])

// SVG Circle Math
const circumference = 2 * Math.PI * 112
const dashOffset = computed(() => {
  if (!timerStore.hasTimer || timerStore.totalSec <= 0) return 0
  const fraction = Math.min(1, timerStore.remainingSec / timerStore.totalSec)
  return circumference * (1 - fraction)
})

async function refreshStatus() {
  if (!currentUrl.value) return
  // 與 content script 同一套規則，直接在 popup 計算。
  // 忽略暫停封鎖：暫停是暫時的，頁首已有橫幅說明，這裡顯示網站本身的名單狀態
  const state = await readBlockState()
  blockStatus.value = evaluateBlock({ ...state, snoozeUntil: 0 }, currentUrl.value)
}

onMounted(async () => {
  await Promise.all([settingsStore.load(), timerStore.load(true), blocklistStore.load()])
  const last = timerStore.state.lastInputMin || 25
  if (TIMER_PRESETS.includes(last)) presetMinutes.value = last
  else {
    customMode.value = true
    customMinutes.value = last
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url?.startsWith('http')) {
    currentUrl.value = tab.url
    try { currentHost.value = new URL(tab.url).hostname } catch { /* ignore */ }
    domainChoices.value = domainOptions(tab.url)
    selectedDomain.value = domainChoices.value[0] ?? ''
    await refreshStatus()
  }
})

// 名單、設定、計時器、暫停狀態改變時，重新判斷目前網站
watch(
  () => [blocklistStore.entries, settingsStore.settings, timerStore.state, blockingStore.snoozeUntil],
  () => void refreshStatus(),
)

function selectPreset(m: number) {
  customMode.value = false
  presetMinutes.value = m
}

async function setMode(m: FocusMode) {
  await settingsStore.update(settingsForMode(m))
}

async function quickAdd(type: 'locked' | 'white') {
  const domain = selectedDomain.value
  if (!domain) return
  const res = await blocklistStore.addEntry({ domain, type })
  if (!res || !res.created) return showToast(t('home.alreadyInList'), 'err')
  showToast(t(type === 'locked' ? 'home.lockedMsg' : 'home.allowedMsg', { domain }))
}

async function toggleTimer() {
  if (timerStore.state.isActive) await timerStore.pause()
  else if (timerStore.isPaused) await timerStore.resume()
  else await timerStore.start(selectedMinutes.value)
}

async function startAgain() {
  await timerStore.start(timerStore.state.lastInputMin || selectedMinutes.value)
}
</script>
