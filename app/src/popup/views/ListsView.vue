<template>
  <div class="flex flex-col gap-3">
    <!-- 名單切換 -->
    <div class="segmented" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        role="tab"
        class="segment flex items-center justify-center gap-1.5"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="rounded-full bg-surface-muted px-1.5 text-[11px] font-bold tabular-nums text-ink-600">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 這份名單的作用 -->
    <div class="notice-info">
      <AppIcon name="info" :size="18" class="mt-0.5 text-brand" />
      <p class="leading-relaxed text-ink-700">
        {{ activeTab === 'locked' ? $t('blocklist.blockedHint') : $t('blocklist.whiteHint') }}
      </p>
    </div>

    <!-- 加入網域 -->
    <form class="flex gap-2" @submit.prevent="addManual">
      <input
        v-model="inputDomain"
        class="input min-w-0 flex-1"
        :placeholder="$t('blocklist.addDomain')"
        :aria-label="$t('blocklist.addDomain')"
        type="text"
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="btn-primary px-4 py-2.5" :disabled="!inputDomain.trim()">
        <AppIcon name="plus" :size="18" />
        {{ $t('blocklist.add') }}
      </button>
    </form>

    <!-- 名單 -->
    <section class="card overflow-hidden">
      <p v-if="blocklistStore.loading && currentList.length === 0" class="p-6 text-center text-sm text-ink-500">
        {{ $t('common.loading') }}
      </p>
      <div v-else-if="currentList.length === 0" class="flex flex-col items-center gap-2 p-8 text-center">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <AppIcon :name="activeTab === 'locked' ? 'prohibit' : 'check'" :size="24" />
        </span>
        <p class="text-sm text-ink-600">
          {{ activeTab === 'locked' ? $t('blocklist.emptyBlocked') : $t('blocklist.emptyWhitelisted') }}
        </p>
      </div>
      <ul v-else class="divide-y divide-line-200">
        <li v-for="entry in currentList" :key="entry.id" class="flex items-center gap-3 px-4 py-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand/10 text-brand">
            <AppIcon :name="iconForDomain(entry.domain)" :size="18" />
          </span>
          <span class="min-w-0 flex-1 truncate text-sm font-bold text-ink-900">{{ entry.domain }}</span>
          <button
            class="icon-btn h-9 w-9 hover:bg-danger/10 hover:text-danger"
            :aria-label="`${$t('common.remove')} ${entry.domain}`"
            :title="$t('common.remove')"
            @click="removeEntry(entry)"
          >
            <AppIcon name="trash" :size="18" />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { normalizeDomain } from '@/utils/domain'
import type { BlockListEntry } from '@/types'
import AppIcon from '../components/AppIcon.vue'
import { iconForDomain } from '../icons'
import { showToast } from '../composables/useToast'
import { useBlocklistStore } from '../stores/useBlocklistStore'

const { t } = useI18n()
const blocklistStore = useBlocklistStore()
const activeTab = ref<'locked' | 'white'>('locked')
const inputDomain = ref('')

const tabs = computed(() => [
  { key: 'locked' as const, label: t('blocklist.blocked'), count: blocklistStore.lockedList.length },
  { key: 'white' as const, label: t('blocklist.whitelisted'), count: blocklistStore.whiteList.length },
])

// 新加入的排在最上面
const currentList = computed(() =>
  [...(activeTab.value === 'locked' ? blocklistStore.lockedList : blocklistStore.whiteList)]
    .sort((a, b) => b.createdAt - a.createdAt),
)

onMounted(() => blocklistStore.load())

async function addManual() {
  const domain = normalizeDomain(inputDomain.value)
  if (!domain) return showToast(t('blocklist.invalidDomain'), 'err')
  const res = await blocklistStore.addEntry({ domain, type: activeTab.value })
  if (res?.created) {
    showToast(t('blocklist.added', { domain }))
    inputDomain.value = ''
  } else {
    showToast(t('home.alreadyInList'), 'err')
  }
}

async function removeEntry(entry: BlockListEntry) {
  await blocklistStore.removeEntry(entry.id)
  showToast(t('blocklist.removed', { domain: entry.domain }), 'ok', {
    label: t('common.undo'),
    run: () => void blocklistStore.addEntry({ domain: entry.domain, type: entry.type }),
  })
}
</script>
