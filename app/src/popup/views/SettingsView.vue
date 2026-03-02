<template>
  <div class="px-4 py-6 pb-24 space-y-6 animate-fade-in">

    <!-- Configuration Section Header -->
    <section class="space-y-4">
      <h3 class="px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">{{ $t('settings.title') }}</h3>

      <!-- 封鎖行為 (Block Behavior) -->
      <GlassCardExpandable :title="$t('settings.blockBehavior')" icon="lock" open>
        <!-- Snooze Duration -->
        <div class="flex items-center justify-between py-1">
          <div>
             <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.snoozeDuration') }}</span>
             <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.snoozeDesc') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="settings.snoozeDuration"
              type="number" min="1" max="60"
              class="w-16 bg-white/50 dark:bg-black/20 text-text-main dark:text-white text-center rounded-lg px-2 py-1.5 text-sm font-mono border border-white/20 dark:border-white/10 focus:outline-none focus:border-primary/50"
              @change="save"
            />
            <span class="text-xs text-text-secondary dark:text-gray-400">min</span>
          </div>
        </div>

        <!-- Strict Mode -->
        <div class="flex items-center justify-between py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1">
          <div>
            <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.strictMode') }}</span>
            <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.strictDesc') }}</span>
          </div>
          <ToggleSwitch v-model="settings.isSnoozeHidden" @update:modelValue="save" />
        </div>

        <!-- Timer Pauses Blocking -->
        <div class="flex items-center justify-between py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1">
          <div>
            <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.timerPauses') }}</span>
            <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.timerPausesDesc') }}</span>
          </div>
          <ToggleSwitch v-model="settings.timerPausesBlocking" @update:modelValue="save" />
        </div>
      </GlassCardExpandable>

      <!-- 通知 (Notifications) -->
      <GlassCardExpandable :title="$t('settings.notifications')" icon="notifications">
        <div class="flex items-center justify-between py-1">
          <div>
            <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.timerAlerts') }}</span>
            <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.timerAlertsDesc') }}</span>
          </div>
          <ToggleSwitch v-model="settings.showNotifications" @update:modelValue="save" />
        </div>
      </GlassCardExpandable>

      <!-- 自訂封鎖文字 -->
      <GlassCardExpandable :title="$t('settings.blockerMessage')" icon="edit_note">
        <div class="py-1">
          <textarea
            v-model="settings.blockerMessage"
            maxlength="100"
            rows="2"
            placeholder="You shall not pass! 🧙‍♂️"
            class="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 text-text-main dark:text-white"
            @blur="save"
          />
          <div class="text-right text-xs mt-1 text-text-secondary dark:text-gray-400">
            {{ settings.blockerMessage.length }} / 100
          </div>
        </div>
      </GlassCardExpandable>

      <!-- Advanced / 資料管理 -->
      <GlassCardExpandable :title="$t('settings.advanced')" icon="settings_suggest">
        <!-- Language Selection -->
        <div class="flex items-center justify-between py-1 border-b border-white/10 dark:border-white/5 pb-3 mb-1">
          <div>
            <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.language') }}</span>
          </div>
          <select 
            v-model="settings.language" 
            @change="saveLanguage"
            class="bg-white/50 dark:bg-black/20 text-text-main dark:text-white rounded-lg px-2 py-1 text-sm border border-white/20 dark:border-white/10 focus:outline-none focus:border-primary/50"
          >
            <option value="auto">Auto</option>
            <option value="en">English</option>
            <option value="zh-TW">繁體中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <div class="flex items-center justify-between cursor-pointer py-1" @click="exportData">
          <span class="text-sm text-text-main dark:text-gray-200">{{ $t('settings.exportData') }}</span>
          <span class="material-symbols-outlined text-text-secondary dark:text-gray-400 text-lg">download</span>
        </div>
        
        <label class="flex items-center justify-between cursor-pointer py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1">
          <span class="text-sm text-text-main dark:text-gray-200">{{ $t('settings.importData') }}</span>
          <span class="material-symbols-outlined text-text-secondary dark:text-gray-400 text-lg">upload</span>
          <input type="file" accept=".json" class="hidden" @change="importData" />
        </label>
        
        <div class="flex items-center justify-between cursor-pointer py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1 group" @click="showConfirm = true">
          <span class="text-sm text-red-500 font-medium group-hover:text-red-600 transition-colors">{{ $t('settings.clearAll') }}</span>
          <span class="material-symbols-outlined text-red-400 group-hover:text-red-500 text-lg transition-colors">delete_sweep</span>
        </div>

        <div class="pt-4 border-t border-white/10 dark:border-white/5 mt-1">
          <p class="text-[10px] text-center text-text-secondary dark:text-gray-500">Limina v2.0.0 (New UI)</p>
        </div>
      </GlassCardExpandable>
    </section>

    <!-- 狀態訊息 -->
    <div
      v-if="msg"
      class="fixed bottom-24 left-1/2 -translate-x-1/2 text-center text-xs py-2 px-4 rounded-full shadow-lg z-50 transition-all font-medium"
      :class="msg.type === 'ok' ? 'text-green-700 bg-green-100 border border-green-200 dark:text-green-400 dark:bg-green-900/40 dark:border-green-800/50' : 'text-red-700 bg-red-100 border border-red-200 dark:text-red-400 dark:bg-red-900/40 dark:border-red-800/50'"
    >
      {{ msg.text }}
    </div>
  </div>

  <!-- 確認清除對話框 -->
  <Teleport to="body">
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="glass-card-strong p-6 mx-4 max-w-xs w-full text-center">
        <div class="text-3xl mb-3 text-red-500">
          <span class="material-symbols-outlined text-4xl">warning</span>
        </div>
        <div class="text-sm font-bold text-text-main dark:text-white mb-2">{{ $t('settings.clearWarningTitle') }}</div>
        <div class="text-xs mb-6 text-text-secondary dark:text-gray-400 leading-relaxed">
          {{ $t('settings.clearWarningBody') }}
        </div>
        <div class="flex gap-3">
          <button class="flex-1 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-text-main dark:text-white rounded-xl transition-colors" @click="showConfirm = false">{{ $t('common.cancel') }}</button>
          <button class="flex-1 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md shadow-red-500/20 transition-colors" @click="clearData">{{ $t('settings.confirmDelete') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import GlassCardExpandable from '../components/ui/GlassCardExpandable.vue'
import { useSettingsStore } from '../stores/useSettingsStore'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { setLocale } from '@/composables/useI18n'

const settingsStore = useSettingsStore()
const settings = reactive<AppSettings>({ ...DEFAULT_SETTINGS })
const msg = ref<{ text: string; type: 'ok' | 'err' } | null>(null)
const showConfirm = ref(false)

onMounted(async () => {
  await settingsStore.load()
  Object.assign(settings, settingsStore.settings)
})

async function save() {
  await settingsStore.update({ ...settings })
  showMsg('Settings Saved', 'ok')
}

async function saveLanguage() {
  await save()
  let target = settings.language
  if (target === 'auto') {
    target = navigator.language.startsWith('zh') ? 'zh-TW' : navigator.language.startsWith('ja') ? 'ja' : 'en'
  }
  setLocale(target as any)
}

function showMsg(text: string, type: 'ok' | 'err') {
  msg.value = { text, type }
  setTimeout(() => { msg.value = null }, 2000)
}

async function exportData() {
  chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }, (res) => {
    if (!res?.success) return showMsg('Export Failed', 'err')
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `limina-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMsg('Export Successful', 'ok')
  })
}

async function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  try {
    const data = JSON.parse(text)
    chrome.runtime.sendMessage({ type: 'IMPORT_DATA', data }, (res) => {
      if (res?.success) {
        settingsStore.load() // 重新讀取最新設定
        showMsg('Import Successful', 'ok')
      } else {
        showMsg('Import Failed', 'err')
      }
    })
  } catch {
    showMsg('Invalid JSON Format', 'err')
  }
}

async function clearData() {
  chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' }, (res) => {
    showConfirm.value = false
    if (res?.success) {
      Object.assign(settings, DEFAULT_SETTINGS)
      showMsg('All Data Cleared', 'ok')
    } else {
      showMsg('Clear Failed', 'err')
    }
  })
}
</script>
