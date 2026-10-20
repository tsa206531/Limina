<template>
  <div>
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
                :value="settings.snoozeDuration"
                type="number" :min="SNOOZE_MIN" :max="SNOOZE_MAX"
                class="w-16 bg-white/50 dark:bg-black/20 text-text-main dark:text-white text-center rounded-lg px-2 py-1.5 text-sm font-mono border border-white/20 dark:border-white/10 focus:outline-none focus:border-primary/50"
                @change="saveSnooze"
              />
              <span class="text-xs text-text-secondary dark:text-gray-400">min</span>
            </div>
          </div>

          <!-- Hide Snooze -->
          <div class="flex items-center justify-between py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1">
            <div>
              <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.hideSnooze') }}</span>
              <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.hideSnoozeDesc') }}</span>
            </div>
            <ToggleSwitch :modelValue="settings.isSnoozeHidden" @update:modelValue="save({ isSnoozeHidden: $event })" />
          </div>

          <!-- Ultimate Focus Mode (whitelist only) -->
          <div class="flex items-center justify-between py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1">
            <div>
              <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.strictMode') }}</span>
              <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.strictDesc') }}</span>
            </div>
            <ToggleSwitch
              :modelValue="settings.focusWhitelistOnly"
              @update:modelValue="save({ focusWhitelistOnly: $event, ...($event ? { timerPausesBlocking: false } : {}) })"
            />
          </div>

          <!-- Timer Pauses Blocking (Free Time Mode)：與終極專注模式互斥 -->
          <div class="flex items-center justify-between py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1">
            <div>
              <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.timerPauses') }}</span>
              <span class="text-xs text-text-secondary dark:text-gray-400">
                {{ settings.focusWhitelistOnly ? $t('settings.exclusiveHint') : $t('settings.timerPausesDesc') }}
              </span>
            </div>
            <div :class="{ 'opacity-50 pointer-events-none': settings.focusWhitelistOnly }">
              <ToggleSwitch :modelValue="settings.timerPausesBlocking" @update:modelValue="save({ timerPausesBlocking: $event })" />
            </div>
          </div>
        </GlassCardExpandable>

        <!-- 通知 (Notifications) -->
        <GlassCardExpandable :title="$t('settings.notifications')" icon="notifications">
          <div class="flex items-center justify-between py-1">
            <div>
              <span class="text-sm text-text-main dark:text-gray-200 block">{{ $t('settings.timerAlerts') }}</span>
              <span class="text-xs text-text-secondary dark:text-gray-400">{{ $t('settings.timerAlertsDesc') }}</span>
            </div>
            <ToggleSwitch :modelValue="settings.showNotifications" @update:modelValue="save({ showNotifications: $event })" />
          </div>
        </GlassCardExpandable>

        <!-- 自訂封鎖文字 -->
        <GlassCardExpandable :title="$t('settings.blockerMessage')" icon="edit_note">
          <div class="py-1">
            <textarea
              v-model="blockerMessage"
              maxlength="100"
              rows="2"
              :placeholder="$t('overlay.defaultMessage')"
              class="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 text-text-main dark:text-white"
              @blur="saveMessage"
            />
            <div class="text-right text-xs mt-1 text-text-secondary dark:text-gray-400">
              {{ blockerMessage.length }} / 100
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
              :value="settings.language"
              @change="save({ language: ($event.target as HTMLSelectElement).value as AppSettings['language'] })"
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
            <input type="file" accept=".json,application/json" class="hidden" @change="importData" />
          </label>

          <div class="flex items-center justify-between cursor-pointer py-1 border-t border-white/10 dark:border-white/5 pt-3 mt-1 group" @click="showConfirm = true">
            <span class="text-sm text-red-500 font-medium group-hover:text-red-600 transition-colors">{{ $t('settings.clearAll') }}</span>
            <span class="material-symbols-outlined text-red-400 group-hover:text-red-500 text-lg transition-colors">delete_sweep</span>
          </div>

          <div class="pt-4 border-t border-white/10 dark:border-white/5 mt-1">
            <p class="text-[10px] text-center text-text-secondary dark:text-gray-500">Limina v{{ version }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import GlassCardExpandable from '../components/ui/GlassCardExpandable.vue'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useI18n } from '@/composables/useI18n'
import { localDateKey } from '@/utils/date'
import type { AppSettings } from '@/types'
import { SNOOZE_MAX, SNOOZE_MIN, clampInt } from '@/types'

const { t } = useI18n()
const settingsStore = useSettingsStore()
// 直接讀 store：匯入、清除或其他視窗修改後都會即時反映
const settings = computed(() => settingsStore.settings)
const blockerMessage = ref('')
const msg = ref<{ text: string; type: 'ok' | 'err' } | null>(null)
const showConfirm = ref(false)
const version = chrome.runtime.getManifest().version

watch(() => settingsStore.settings.blockerMessage, (v) => { blockerMessage.value = v }, { immediate: true })

onMounted(() => settingsStore.load())

let msgTimer: ReturnType<typeof setTimeout> | undefined
function showMsg(text: string, type: 'ok' | 'err') {
  msg.value = { text, type }
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { msg.value = null }, 2000)
}

async function save(patch: Partial<AppSettings>) {
  const ok = await settingsStore.update(patch)
  showMsg(ok ? t('settings.saved') : t('settings.saveFail'), ok ? 'ok' : 'err')
}

function saveSnooze(event: Event) {
  const input = event.target as HTMLInputElement
  const minutes = clampInt(input.value, SNOOZE_MIN, SNOOZE_MAX, settings.value.snoozeDuration)
  input.value = String(minutes)
  void save({ snoozeDuration: minutes })
}

function saveMessage() {
  if (blockerMessage.value === settings.value.blockerMessage) return
  void save({ blockerMessage: blockerMessage.value })
}

async function exportData() {
  const res = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }).catch(() => undefined)
  if (!res?.success) return showMsg(t('settings.exportFail'), 'err')
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `limina-backup-${localDateKey()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  showMsg(t('settings.exportOk'), 'ok')
}

async function importData(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允許再次選擇同一個檔案
  if (!file) return

  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    return showMsg(t('settings.invalidJson'), 'err')
  }
  const res = await chrome.runtime.sendMessage({ type: 'IMPORT_DATA', data }).catch(() => undefined)
  // 各 store 會由 App.vue 的 storage.onChanged 自動重新載入
  showMsg(res?.success ? t('settings.importOk') : t('settings.importFail'), res?.success ? 'ok' : 'err')
}

async function clearData() {
  const res = await chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' }).catch(() => undefined)
  showConfirm.value = false
  showMsg(res?.success ? t('settings.cleared') : t('settings.clearFail'), res?.success ? 'ok' : 'err')
}
</script>
