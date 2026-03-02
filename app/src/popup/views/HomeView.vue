<template>
  <div class="px-6 py-2 flex flex-col gap-6 animate-fade-in">
    <!-- Global Protection Toggle -->
    <div class="glass-panel rounded-2xl p-5 flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-lg">public</span>
          <h2 class="font-bold text-text-main dark:text-white">{{ $t('home.globalProtection') }}</h2>
        </div>
        <p class="text-sm text-text-secondary dark:text-gray-400">{{ $t('home.current') }}: {{ currentDomain || $t('home.none') }}</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          class="sr-only peer" 
          :checked="settingsStore.settings.isEnabled"
          @change="toggleBlock"
        />
        <div class="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary shadow-inner"></div>
      </label>
    </div>

    <!-- Timer Area -->
    <div class="flex-1 flex flex-col items-center justify-center min-h-[300px]">
      <div class="relative w-64 h-64 flex items-center justify-center">
        <!-- SVG Progress Ring -->
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
          <circle class="text-slate-200 dark:text-slate-700/50" cx="128" cy="128" fill="none" r="110" stroke="currentColor" stroke-width="12"></circle>
          <circle 
            class="text-dark-teal dark:text-primary transition-all duration-1000 ease-linear" 
            :class="{ 'animate-pulse-soft': timerStore.state.isActive }"
            cx="128" cy="128" fill="none" r="110" stroke="currentColor" 
            :stroke-dasharray="circumference" 
            :stroke-dashoffset="dashOffset" 
            stroke-linecap="round" stroke-width="12"
          ></circle>
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div v-if="timerStore.state.isActive" class="flex flex-col items-center">
            <span class="text-6xl font-bold text-text-main dark:text-white tracking-tighter tabular-nums">{{ timerStore.formatted() }}</span>
            <span class="text-text-secondary dark:text-gray-400 font-medium mt-1">{{ $t('home.focusing') }}</span>
          </div>
          <div v-else class="flex flex-col items-center gap-2">
            <input
              v-model.number="timerMinutes"
              type="number"
              min="1" max="999"
              class="w-32 bg-transparent text-center text-5xl font-bold text-text-main dark:text-white tracking-tighter tabular-nums focus:outline-none focus:ring-0 border-none p-0"
            />
            <span class="text-text-secondary dark:text-gray-400 font-medium mt-1">{{ $t('home.minutes') }}</span>
          </div>
        </div>
        <div class="absolute top-0 w-2 h-4 bg-primary rounded-full transform -translate-y-1/2"></div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 flex items-center gap-8 w-full justify-center">
        <button 
          class="group flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          @click="resetTimer"
        >
          <div class="w-12 h-12 rounded-full bg-white dark:bg-surface-dark shadow-sm hover:shadow-md border border-slate-100 dark:border-white/10 flex items-center justify-center transition-all transform group-hover:-translate-y-1 group-active:scale-95">
            <span class="material-symbols-outlined text-2xl group-hover:text-amber-500 transition-colors">restart_alt</span>
          </div>
          <span class="text-xs font-medium">{{ $t('home.reset') }}</span>
        </button>

        <button 
          class="group relative flex items-center justify-center w-20 h-20 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 transition-all transform hover:scale-105 active:scale-95 duration-300"
          @click="toggleTimer"
        >
          <span class="material-symbols-outlined text-4xl filled">
            {{ timerStore.state.isActive ? 'pause' : 'play_arrow' }}
          </span>
        </button>

        <button 
          class="group flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          @click="addFiveMinutes"
          :disabled="!timerStore.state.isActive"
          :class="{ 'opacity-50 cursor-not-allowed': !timerStore.state.isActive }"
        >
          <div class="w-12 h-12 rounded-full bg-white dark:bg-surface-dark shadow-sm hover:shadow-md border border-slate-100 dark:border-white/10 flex items-center justify-center transition-all transform group-hover:scale-110 group-active:scale-95">
            <span class="material-symbols-outlined text-2xl group-hover:text-emerald-500 transition-colors">more_time</span>
          </div>
          <span class="text-xs font-medium">{{ $t('home.addTime') }}</span>
        </button>
      </div>
    </div>

    <!-- Stats Preview (Quick actions combined here for demo) -->
    <div class="glass-panel rounded-2xl p-4 flex flex-col gap-3">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined">trending_up</span>
        </div>
        <div class="flex-1">
          <p class="text-xs font-bold uppercase text-text-secondary tracking-wider">{{ $t('home.quickActions') }}</p>
          <div class="flex items-center gap-2 mt-1">
            <button class="flex-1 py-1.5 px-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors" @click="quickLock" :disabled="!currentDomain">
              {{ $t('home.lockSite') }}
            </button>
            <button class="flex-1 py-1.5 px-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-medium transition-colors" @click="quickWhite" :disabled="!currentDomain">
              {{ $t('home.allowSite') }}
            </button>
          </div>
          <p v-if="quickMsg" class="text-xs mt-1" :class="quickMsgType === 'ok' ? 'text-green-500' : 'text-red-500'">{{ quickMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useBlocklistStore } from '../stores/useBlocklistStore'
import { useTimerStore } from '../stores/useTimerStore'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const blocklistStore = useBlocklistStore()
const timerStore = useTimerStore()

const currentDomain = ref('')
const currentUrl = ref('')
const timerMinutes = ref(25)
const quickMsg = ref('')
const quickMsgType = ref<'ok' | 'err'>('ok')

// SVG Circle Math
const radius = 110
const circumference = 2 * Math.PI * radius
const dashOffset = computed(() => {
  if (!timerStore.state.isActive) return 0
  const total = timerStore.state.lastInputMin * 60
  const remaining = timerStore.remainingSec
  const fraction = remaining / total
  return circumference * (1 - fraction)
})

onMounted(async () => {
  await Promise.all([settingsStore.load(), timerStore.load()])
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url) {
    currentUrl.value = tab.url
    try { currentDomain.value = new URL(tab.url).hostname } catch { }
  }
})

async function toggleBlock() {
  await settingsStore.update({ isEnabled: !settingsStore.settings.isEnabled })
}

async function showMsg(msg: string, type: 'ok' | 'err' = 'ok') {
  quickMsg.value = msg
  quickMsgType.value = type
  setTimeout(() => { quickMsg.value = '' }, 2500)
}

async function quickLock() {
  if (!currentDomain.value) return
  const res = await blocklistStore.addEntry({ domain: currentDomain.value, type: 'locked' })
  if (res) showMsg(t('home.lockedMsg', { domain: currentDomain.value }))
  else showMsg(t('home.alreadyInList'), 'err')
}

async function quickWhite() {
  if (!currentDomain.value) return
  const res = await blocklistStore.addEntry({ domain: currentDomain.value, type: 'white' })
  if (res) showMsg(t('home.allowedMsg', { domain: currentDomain.value }))
  else showMsg(t('home.alreadyInList'), 'err')
}

async function toggleTimer() {
  if (timerStore.state.isActive) {
    // Current timer store doesn't have a pause, only cancel
    timerStore.cancel()
  } else {
    if (!timerMinutes.value || timerMinutes.value < 1) return
    await timerStore.start(timerMinutes.value)
  }
}

function resetTimer() {
  timerStore.cancel()
}

async function addFiveMinutes() {
  if (!timerStore.state.isActive) return
  const newRemaining = timerStore.remainingSec + 300
  // Since background timer runs independently, we need to restart it with new duration
  // A proper addTime would require background script changes, so this is a simplified version
  await timerStore.start(Math.ceil(newRemaining / 60))
}
</script>

