<template>
  <div class="flex flex-col gap-3">
    <!-- 封鎖頁 -->
    <section class="card">
      <h2 class="eyebrow px-4 pb-1 pt-4">{{ $t('settings.blockPage') }}</h2>
      <div class="divide-y divide-line-200">

      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <label for="snooze-duration" class="min-w-0">
          <span class="block text-sm font-bold text-ink-800">{{ $t('settings.snoozeDuration') }}</span>
          <span class="block text-xs text-ink-500">{{ $t('settings.snoozeDesc') }}</span>
        </label>
        <div class="flex shrink-0 items-center gap-1.5">
          <input
            id="snooze-duration"
            :value="settings.snoozeDuration"
            type="number" :min="SNOOZE_MIN" :max="SNOOZE_MAX"
            class="input w-16 px-2 py-1.5 text-center tabular-nums"
            @change="saveSnooze"
          />
          <span class="text-xs text-ink-500">{{ $t('home.minutes') }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <span class="block text-sm font-bold text-ink-800">{{ $t('settings.hideSnooze') }}</span>
          <span class="block text-xs text-ink-500">{{ $t('settings.hideSnoozeDesc') }}</span>
        </div>
        <ToggleSwitch
          :modelValue="settings.isSnoozeHidden"
          :label="$t('settings.hideSnooze')"
          @update:modelValue="save({ isSnoozeHidden: $event })"
        />
      </div>

      <div class="px-4 py-3">
        <label for="blocker-message" class="block text-sm font-bold text-ink-800">{{ $t('settings.blockerMessage') }}</label>
        <span class="block text-xs text-ink-500">{{ $t('settings.blockerMessageDesc') }}</span>
        <textarea
          id="blocker-message"
          v-model="blockerMessage"
          maxlength="100"
          rows="2"
          :placeholder="$t('overlay.defaultMessage')"
          class="input mt-2 w-full resize-none"
          @blur="saveMessage"
        />
        <p class="mt-1 text-right text-xs tabular-nums text-ink-500">{{ blockerMessage.length }} / 100</p>
      </div>
      </div>
    </section>

    <!-- 通知與語言 -->
    <section class="card">
      <h2 class="eyebrow px-4 pb-1 pt-4">{{ $t('settings.notifications') }}</h2>
      <div class="divide-y divide-line-200">
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <span class="block text-sm font-bold text-ink-800">{{ $t('settings.timerAlerts') }}</span>
          <span class="block text-xs text-ink-500">{{ $t('settings.timerAlertsDesc') }}</span>
        </div>
        <ToggleSwitch
          :modelValue="settings.showNotifications"
          :label="$t('settings.timerAlerts')"
          @update:modelValue="save({ showNotifications: $event })"
        />
      </div>
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <label for="language" class="text-sm font-bold text-ink-800">{{ $t('settings.language') }}</label>
        <select
          id="language"
          :value="settings.language"
          class="input py-1.5"
          @change="save({ language: ($event.target as HTMLSelectElement).value as AppSettings['language'] })"
        >
          <option value="auto">{{ $t('settings.languageAuto') }}</option>
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      </div>
    </section>

    <!-- 資料 -->
    <section class="card p-4">
      <h2 class="eyebrow">{{ $t('settings.data') }}</h2>
      <p class="mt-1 text-xs text-ink-500">{{ $t('settings.dataDesc') }}</p>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <button class="btn-neutral btn-sm" @click="exportData">
          <AppIcon name="download-simple" :size="16" />
          {{ $t('settings.exportData') }}
        </button>
        <label class="btn-neutral btn-sm cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
          <AppIcon name="upload-simple" :size="16" />
          {{ $t('settings.importData') }}
          <input type="file" accept=".json,application/json" class="sr-only" @change="importData" />
        </label>
      </div>
      <button
        class="btn btn-sm mt-2 w-full rounded-sm border border-danger/[0.35] bg-danger/[0.08] text-danger hover:bg-danger/[0.14]"
        @click="showConfirm = true"
      >
        <AppIcon name="trash" :size="16" />
        {{ $t('settings.clearAll') }}
      </button>
    </section>

    <p class="pb-2 text-center text-xs text-ink-400">Limina v{{ version }}</p>

    <!-- 確認清除對話框 -->
    <Teleport to="body">
      <div
        v-if="showConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showConfirm = false"
        @keydown.esc="showConfirm = false"
      >
        <div role="alertdialog" aria-modal="true" aria-labelledby="clear-title" class="card w-full max-w-xs p-5 text-center shadow-xl">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AppIcon name="warning" :size="24" />
          </span>
          <h2 id="clear-title" class="mt-3 font-bold text-ink-900">{{ $t('settings.clearWarningTitle') }}</h2>
          <p class="mt-1 text-sm leading-relaxed text-ink-600">{{ $t('settings.clearWarningBody') }}</p>
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button ref="cancelBtn" class="btn-neutral btn-sm" @click="showConfirm = false">{{ $t('common.cancel') }}</button>
            <button class="btn btn-sm rounded-sm bg-danger text-white hover:bg-danger/80" @click="clearData">{{ $t('settings.confirmDelete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { localDateKey } from '@/utils/date'
import type { AppSettings } from '@/types'
import { SNOOZE_MAX, SNOOZE_MIN, clampInt } from '@/types'
import AppIcon from '../components/AppIcon.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import { showToast } from '../composables/useToast'
import { useSettingsStore } from '../stores/useSettingsStore'

const { t } = useI18n()
const settingsStore = useSettingsStore()
// 直接讀 store：匯入、清除或其他視窗修改後都會即時反映
const settings = computed(() => settingsStore.settings)
const blockerMessage = ref('')
const showConfirm = ref(false)
const cancelBtn = ref<HTMLButtonElement>()
const version = chrome.runtime.getManifest().version

watch(() => settingsStore.settings.blockerMessage, (v) => { blockerMessage.value = v }, { immediate: true })
// 對話框開啟時把焦點移到「取消」，避免誤按清除
watch(showConfirm, async (open) => {
  if (!open) return
  await nextTick()
  cancelBtn.value?.focus()
})

onMounted(() => settingsStore.load())

async function save(patch: Partial<AppSettings>) {
  const ok = await settingsStore.update(patch)
  showToast(ok ? t('settings.saved') : t('settings.saveFail'), ok ? 'ok' : 'err')
}

function saveSnooze(event: Event) {
  const input = event.target as HTMLInputElement
  const minutes = clampInt(input.value, SNOOZE_MIN, SNOOZE_MAX, settings.value.snoozeDuration)
  input.value = String(minutes)
  void save({ snoozeDuration: minutes })
}

function saveMessage() {
  const message = blockerMessage.value.trim()
  if (message === settings.value.blockerMessage) return
  void save({ blockerMessage: message })
}

async function exportData() {
  const res = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }).catch(() => undefined)
  if (!res?.success) return showToast(t('settings.exportFail'), 'err')
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `limina-backup-${localDateKey()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  showToast(t('settings.exportOk'))
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
    return showToast(t('settings.invalidJson'), 'err')
  }
  const res = await chrome.runtime.sendMessage({ type: 'IMPORT_DATA', data }).catch(() => undefined)
  // 各 store 會由 App.vue 的 storage.onChanged 自動重新載入
  showToast(res?.success ? t('settings.importOk') : t('settings.importFail'), res?.success ? 'ok' : 'err')
}

async function clearData() {
  const res = await chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' }).catch(() => undefined)
  showConfirm.value = false
  showToast(res?.success ? t('settings.cleared') : t('settings.clearFail'), res?.success ? 'ok' : 'err')
}
</script>
