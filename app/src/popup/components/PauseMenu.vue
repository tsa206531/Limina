<template>
  <!-- 暫停封鎖：取代原本一鍵關閉的開關，必須選擇暫停多久，到期自動恢復 -->
  <div ref="root" class="relative">
    <button
      class="btn-neutral btn-sm"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      {{ $t('home.pauseBlocking') }}
      <AppIcon name="caret-down" :size="14" class="transition-transform duration-200" :class="{ 'rotate-180': open }" />
    </button>
    <div
      v-if="open"
      role="menu"
      class="absolute right-0 top-full z-40 mt-2 w-40 rounded-lg border border-line-300 bg-surface-card p-1.5 shadow-xl"
    >
      <button
        v-for="item in items"
        :key="item.label"
        role="menuitem"
        class="w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-ink-800 transition hover:bg-brand/10 hover:text-brand"
        @click="choose(item.run)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import AppIcon from './AppIcon.vue'
import { useBlockingStore } from '../stores/useBlockingStore'

const { t } = useI18n()
const blocking = useBlockingStore()
const open = ref(false)
const root = ref<HTMLElement>()

const items = computed(() => [
  { label: t('home.pauseFor15'), run: () => blocking.pauseFor(15) },
  { label: t('home.pauseFor60'), run: () => blocking.pauseFor(60) },
  { label: t('home.pauseUntilTomorrow'), run: () => blocking.pauseUntilTomorrow() },
])

async function choose(run: () => Promise<void>) {
  open.value = false
  await run()
}

function onPointerDown(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) open.value = false
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>
