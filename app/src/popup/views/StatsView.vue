<template>
  <div class="flex flex-col gap-3">
    <div class="segmented" role="group">
      <button
        v-for="opt in rangeOptions"
        :key="opt.days"
        class="segment"
        :aria-pressed="selectedDays === opt.days"
        @click="selectedDays = opt.days"
      >
        {{ opt.label }}
      </button>
    </div>

    <p v-if="statsStore.loading && !loaded" class="py-10 text-center text-sm text-ink-500">{{ $t('common.loading') }}</p>

    <template v-else>
      <!-- 專注成果 -->
      <section class="grid grid-cols-2 gap-3">
        <div class="card p-4">
          <p class="eyebrow">{{ $t('stats.focus') }}</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-ink-900">{{ duration(focus.focusMs) }}</p>
          <p class="mt-0.5 text-xs text-ink-600">{{ $t('stats.focusSessions', { n: focus.sessions }) }}</p>
        </div>
        <div class="card p-4">
          <p class="eyebrow">{{ $t('stats.blockedTitle') }}</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-ink-900">{{ $t('stats.blocks', { n: focus.blocks }) }}</p>
          <p class="mt-0.5 text-xs text-ink-600">{{ $t('stats.blockedHint') }}</p>
        </div>
      </section>

      <!-- 瀏覽時間 -->
      <section class="card p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="eyebrow">{{ $t('stats.browsingTime') }}</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-ink-900">{{ duration(rangeTotalMs) }}</p>
          </div>
          <span v-if="selectedDays > 1" class="badge border border-line-300 bg-surface-subtle text-ink-600">
            {{ $t('stats.avg', { time: duration(rangeTotalMs / selectedDays) }) }}
          </span>
        </div>
        <p class="mt-1 text-xs leading-relaxed text-ink-500">{{ $t('stats.browsingHint') }}</p>

        <!-- 每日長條（只在多天時顯示；單日一根長條沒有資訊量） -->
        <div v-if="selectedDays > 1" class="mt-4">
          <div class="flex h-28 items-end" :class="selectedDays === 30 ? 'gap-0.5' : 'gap-2'">
            <div
              v-for="bar in chartBars"
              :key="bar.date"
              class="flex-1 rounded-t-[4px]"
              :class="bar.isToday ? 'bg-brand' : 'bg-brand/40'"
              :style="{ height: `${bar.percentage}%` }"
              :title="bar.tooltip"
              role="img"
              :aria-label="bar.tooltip"
            />
          </div>
          <div class="mt-1.5 flex" :class="selectedDays === 30 ? 'gap-0.5' : 'gap-2'">
            <span
              v-for="bar in chartBars"
              :key="bar.date"
              class="flex-1 whitespace-nowrap text-center text-[10px]"
              :class="bar.isToday ? 'font-bold text-brand' : 'text-ink-500'"
            >{{ bar.label || ' ' }}</span>
          </div>
        </div>
      </section>

      <!-- 最常造訪 -->
      <section class="card p-4">
        <p class="eyebrow">{{ $t('stats.topSites') }}</p>
        <ul v-if="topSites.length > 0" class="mt-3 flex flex-col gap-3">
          <li v-for="(item, i) in topSites" :key="item.domain" class="flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand/10 text-brand">
              <AppIcon :name="iconForDomain(item.domain)" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <span class="truncate text-sm font-bold text-ink-900">{{ item.domain }}</span>
                <span class="shrink-0 text-sm font-bold tabular-nums text-ink-800">{{ duration(item.ms) }}</span>
              </div>
              <div class="mt-1 flex items-center gap-2">
                <span class="w-12 shrink-0 text-[11px] text-ink-500">{{ siteCategory(item.domain) }}</span>
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <!-- 單一色相，以透明度區分排名（style.md：層次靠 alpha 而非多色） -->
                  <div class="h-full rounded-full bg-brand" :style="{ width: `${item.percentage}%`, opacity: RANK_ALPHA[i] }" />
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="py-6 text-center text-sm text-ink-500">{{ $t('stats.empty') }}</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { domainCategory } from '@/utils/domain'
import { localDateKey, parseDateKey } from '@/utils/date'
import AppIcon from '../components/AppIcon.vue'
import { iconForDomain } from '../icons'
import { useStatsStore } from '../stores/useStatsStore'

const RANK_ALPHA = [1, 0.8, 0.62, 0.48, 0.36]

const { t, duration, lang } = useI18n()
const statsStore = useStatsStore()
const selectedDays = ref(1)
const loaded = ref(false)

const rangeOptions = computed(() => [
  { label: t('stats.range.today'), days: 1 },
  { label: t('stats.range.days7'), days: 7 },
  { label: t('stats.range.days30'), days: 30 },
])

onMounted(async () => {
  await statsStore.load()
  loaded.value = true
})

const focus = computed(() => statsStore.getFocusStats(selectedDays.value))
const dailyStats = computed(() => statsStore.getDateRangeStats(selectedDays.value))
const rangeTotalMs = computed(() => dailyStats.value.reduce((s, r) => s + r.ms, 0))

const chartBars = computed(() => {
  const range = dailyStats.value
  const maxMs = Math.max(...range.map((r) => r.ms), 60_000)
  const weekday = new Intl.DateTimeFormat(lang.value, { weekday: 'narrow' })
  const monthDay = new Intl.DateTimeFormat(lang.value, { month: 'numeric', day: 'numeric' })
  const today = localDateKey()

  return range.map((r, i) => {
    const date = parseDateKey(r.date)
    let label = ''
    if (selectedDays.value === 7) label = weekday.format(date)
    // 30 天：每 7 天標一次日期，最後一天必標
    else if ((range.length - 1 - i) % 7 === 0) label = monthDay.format(date)

    return {
      date: r.date,
      label,
      isToday: r.date === today,
      tooltip: `${monthDay.format(date)} · ${duration(r.ms)}`,
      percentage: r.ms > 0 ? Math.max(4, (r.ms / maxMs) * 100) : 2,
    }
  })
})

const topSites = computed(() => {
  const list = statsStore.getDomainStats(selectedDays.value).slice(0, 5)
  const maxMs = list[0]?.ms || 1
  return list.map((item) => ({ ...item, percentage: (item.ms / maxMs) * 100 }))
})

function siteCategory(domain: string): string {
  return t(`stats.category.${domainCategory(domain)}`)
}
</script>
