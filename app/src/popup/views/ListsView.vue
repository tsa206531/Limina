<template>
  <div class="flex flex-col h-full animate-fade-in relative z-10">
    <!-- 手動輸入加入 -->
    <div class="px-4 py-4 shrink-0">
      <div class="glass-card rounded-xl flex items-center p-1 group focus-within:ring-2 focus-within:ring-primary/50 transition-all bg-white/40 dark:bg-black/20">
        <div class="pl-3 pr-2 text-text-secondary dark:text-gray-400 flex items-center justify-center">
          <span class="material-symbols-outlined" style="font-size: 20px;">add_link</span>
        </div>
        <input
          v-model="inputDomain"
          class="w-full bg-transparent border-none focus:ring-0 text-text-main dark:text-white placeholder:text-gray-400 text-sm py-2 px-1 focus:outline-none"
          :placeholder="$t('blocklist.addDomain')" 
          type="text"
          @keyup.enter="addManual"
        />
        <button 
          class="bg-primary hover:bg-primary-dark text-white rounded-lg p-2 m-1 shadow-md transition-transform active:scale-95 flex items-center justify-center disabled:opacity-50"
          :disabled="!inputDomain.trim()"
          @click="addManual"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">add</span>
        </button>
      </div>
      <div v-if="addMsg" class="mt-2 text-xs text-center font-medium" :class="addMsg.type === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
        {{ addMsg.text }}
      </div>
    </div>

    <!-- Tab 切換 -->
    <div class="px-4 pb-2 shrink-0">
      <div class="glass-card p-1 rounded-xl flex relative bg-white/20 dark:bg-black/10">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex-1 py-1.5 text-center text-sm font-semibold rounded-lg shadow-sm transition-all"
          :class="activeTab === tab.key 
            ? 'bg-white/90 dark:bg-white/10 text-text-main dark:text-white' 
            : 'text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" :class="activeTab === tab.key ? 'bg-black/10 dark:bg-white/20' : 'bg-black/5 dark:bg-white/5'">
            {{ tab.key === 'locked' ? blocklistStore.lockedList.length : blocklistStore.whiteList.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- 列表內容區塊 -->
    <div class="flex-1 overflow-y-auto px-4 pb-28 pt-2 space-y-3 z-0 scrollbar-hide">
      <div v-if="loading" class="text-center py-8 text-text-secondary dark:text-gray-500 text-sm">
        {{ $t('common.loading') }}
      </div>

      <div v-else-if="currentList.length === 0" class="text-center py-10">
        <div class="text-4xl mb-3 opacity-50 flex justify-center">
          <span class="material-symbols-outlined text-4xl text-text-secondary dark:text-gray-500">{{ activeTab === 'locked' ? 'lock_open' : 'inbox' }}</span>
        </div>
        <div class="text-sm text-text-secondary dark:text-gray-400 font-medium">
          {{ activeTab === 'locked' ? $t('blocklist.emptyBlocked') : $t('blocklist.emptyWhitelisted') }}
        </div>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="space-y-3">
        <div
          v-for="entry in currentList"
          :key="entry.id"
          class="glass-card rounded-2xl p-3 flex items-center justify-between group bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="bg-white/80 dark:bg-slate-800 p-2 rounded-xl shadow-sm shrink-0 flex items-center justify-center w-10 h-10">
              <span class="material-symbols-outlined text-slate-400">{{ iconForDomain(entry.domain) }}</span>
            </div>
            <div class="flex flex-col min-w-0">
              <p class="text-text-main dark:text-slate-100 text-sm font-semibold truncate leading-tight tracking-wide">
                {{ entry.domain }}
              </p>
              <p class="text-text-secondary dark:text-slate-500 text-[10px] truncate uppercase tracking-wider mt-0.5 font-medium">
                {{ activeTab === 'locked' ? $t('blocklist.blocked') : $t('blocklist.whitelisted') }}
              </p>
            </div>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/40 text-text-secondary dark:text-gray-500 hover:text-red-500 transition-colors"
            @click="blocklistStore.removeEntry(entry.id)"
            :title="$t('common.remove')"
          >
            <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { iconForDomain, normalizeDomain } from '@/utils/domain'
import { useBlocklistStore } from '../stores/useBlocklistStore'

const { t } = useI18n()
const blocklistStore = useBlocklistStore()
const activeTab = ref<'locked' | 'white'>('locked')
const inputDomain = ref('')
const loading = ref(false)
const addMsg = ref<{ text: string; type: 'ok' | 'warn' } | null>(null)

const tabs = computed<{ key: 'locked' | 'white'; label: string }[]>(() => [
  { key: 'locked', label: t('blocklist.blocked') },
  { key: 'white', label: t('blocklist.whitelisted') },
])

const currentList = computed(() =>
  activeTab.value === 'locked' ? blocklistStore.lockedList : blocklistStore.whiteList,
)

onMounted(async () => {
  loading.value = true
  await blocklistStore.load()
  loading.value = false
})

let msgTimer: ReturnType<typeof setTimeout> | undefined
function showAddMsg(text: string, type: 'ok' | 'warn') {
  addMsg.value = { text, type }
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { addMsg.value = null }, 2500)
}

async function addManual() {
  if (!inputDomain.value.trim()) return
  const domain = normalizeDomain(inputDomain.value)
  if (!domain) return showAddMsg(t('blocklist.invalidDomain'), 'warn')
  const res = await blocklistStore.addEntry({ domain, type: activeTab.value })
  if (res?.created) {
    showAddMsg(t('blocklist.added', { domain }), 'ok')
    inputDomain.value = ''
  } else {
    showAddMsg(t('home.alreadyInList'), 'warn')
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.list-move,
.list-enter-active, 
.list-leave-active { 
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); 
}
.list-enter-from,
.list-leave-to { 
  opacity: 0; 
  transform: translateX(16px); 
}
.list-leave-active {
  position: absolute;
}
</style>
