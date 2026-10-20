<template>
  <div class="flex flex-col h-full animate-fade-in relative z-10">
    
    <!-- 日期範圍選擇 -->
    <div class="px-4 pt-4 mb-4">
      <div class="flex p-1 rounded-2xl glass-card bg-white/30 dark:bg-white/5">
        <button
          v-for="opt in rangeOptions"
          :key="opt.days"
          class="flex-1 py-1.5 text-sm font-medium rounded-xl transition-all duration-300"
          :class="selectedDays === opt.days 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
            : 'text-text-secondary dark:text-slate-400 hover:text-primary'"
          @click="selectedDays = opt.days"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- 統計內容區 -->
    <div class="flex-1 overflow-y-auto px-4 pb-28 space-y-5 scrollbar-hide">
      
      <div v-if="loading" class="text-center py-12 text-text-secondary dark:text-slate-500 font-medium">
        {{ $t('common.loading') }}
      </div>

      <template v-else>
        <!-- Total Screen Time & Doughnut Chart -->
        <div class="glass-card rounded-3xl p-5 relative overflow-hidden bg-white/20 dark:bg-black/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="text-text-secondary dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                {{ $t('stats.totalScreenTime') }}
              </h2>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-text-main dark:text-slate-100">{{ todayTotal }}</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary">pie_chart</span>
            </div>
          </div>
          
          <div class="relative py-2 flex items-center justify-center">
            <div class="h-44 w-44 relative">
              <Doughnut :data="doughnutData" :options="doughnutOptions" class="relative z-10" />
              <!-- Center Text -->
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Focus Trends (HTML Bar Chart) -->
        <div class="glass-card rounded-3xl p-5 bg-white/20 dark:bg-black/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-base font-bold text-text-main dark:text-slate-100">{{ $t('stats.dailyFocusTrends') }}</h2>
            <span class="text-[10px] font-medium text-text-secondary dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
              {{ $t('stats.avg', { time: avgTime }) }}
            </span>
          </div>

          <div class="h-40 flex items-end justify-between px-1 relative" :class="selectedDays === 30 ? 'gap-0.5' : 'gap-1.5'">
            <div v-for="(day, index) in chartBars" :key="index" class="flex flex-col items-center gap-2 flex-1 group cursor-pointer h-full justify-end">
              <div class="relative w-full bg-slate-200/50 dark:bg-slate-700/30 rounded-t-lg h-[110px] overflow-hidden">
                <!-- Tooltip directly on hover -->
                <div class="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-slate-800 dark:bg-white text-white dark:text-black px-1 rounded mb-1 z-20 whitespace-nowrap">
                  {{ day.tooltip }}
                </div>
                <div 
                  class="absolute bottom-0 w-full rounded-t-lg transition-all duration-1000 ease-out bg-gradient-to-t from-primary to-primary-dark group-hover:to-cyan-400 delay-[200ms]" 
                  :style="{ height: animateData ? `${day.percentage}%` : '0%' }"
                ></div>
              </div>
              <span class="text-[10px] font-medium transition-colors whitespace-nowrap" :class="index === chartBars.length - 1 ? 'font-bold text-primary' : 'text-text-secondary dark:text-slate-500 group-hover:text-primary'">
                {{ day.label || ' ' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Top Sites List -->
        <div class="glass-card rounded-3xl p-5 bg-white/20 dark:bg-black/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <h2 class="text-base font-bold text-text-main dark:text-slate-100 mb-4">{{ $t('stats.topSites') }}</h2>
          
          <div class="flex flex-col gap-4">
            <template v-if="rangeStats.length > 0">
              <div 
                v-for="(item, i) in topSites" 
                :key="item.domain"
                class="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0"
              >
                <!-- Dynamic Icons & Colors -->
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="getSiteColorClass(i)">
                  <span class="material-symbols-outlined text-xl">{{ iconForDomain(item.domain) }}</span>
                </div>
                
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-text-main dark:text-slate-200 truncate">{{ item.domain }}</h3>
                  <p class="text-[10px] text-text-secondary dark:text-slate-500 uppercase tracking-widest mt-0.5">{{ siteCategory(item.domain) }}</p>
                </div>
                
                <div class="text-right shrink-0">
                  <p class="text-sm font-bold text-text-main dark:text-slate-200">{{ item.formattedTime }}</p>
                  <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden flex justify-end">
                    <div class="h-full rounded-full transition-all duration-1000 ease-out delay-300" :class="getSiteBgClass(i)" :style="{ width: animateData ? `${item.percentage}%` : '0%' }"></div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="text-center py-6">
              <div class="text-2xl mb-2 opacity-30">🌱</div>
              <div class="text-sm text-text-secondary dark:text-slate-500 font-medium">{{ $t('stats.emptyTopSites') }}</div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from 'chart.js'
import { useI18n } from '@/composables/useI18n'
import { domainCategory, iconForDomain } from '@/utils/domain'
import { parseDateKey } from '@/utils/date'
import { useStatsStore } from '../stores/useStatsStore'

ChartJS.register(ArcElement, ChartTooltip)

const { t, lang } = useI18n()

const statsStore = useStatsStore()
const loading = ref(false)
const selectedDays = ref(1)
const animateData = ref(false)

const rangeOptions = computed(() => [
  { label: t('stats.todayOptions.today'), days: 1 },
  { label: t('stats.todayOptions.days7'), days: 7 },
  { label: t('stats.todayOptions.days30'), days: 30 },
])

onMounted(async () => {
  loading.value = true
  await statsStore.load()
  loading.value = false
  setTimeout(() => { animateData.value = true }, 50)
})

// 區間內各網域總時長（甜甜圈圖與 Top Sites 共用）
const rangeStats = computed(() => statsStore.getDomainStats(selectedDays.value))
// 區間內每日總時長（長條圖、總計、平均共用）
const dailyStats = computed(() => statsStore.getDateRangeStats(selectedDays.value))
const rangeTotalMs = computed(() => dailyStats.value.reduce((s, r) => s + r.ms, 0))

const todayTotal = computed(() => msToTime(rangeTotalMs.value))
const avgTime = computed(() => msToTime(Math.floor(rangeTotalMs.value / selectedDays.value)))

// === Doughnut Chart Setup ===
const CHART_COLORS = [
  '#088396', '#38bdf8', '#fbbf24', '#f87171', '#818cf8', '#34d399'
]

const doughnutData = computed(() => {
  const top = rangeStats.value.slice(0, 5)
  return {
    labels: top.map((r) => r.domain),
    datasets: [{
      data: top.map((r) => r.ms),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: { label?: string; raw?: unknown }) => ` ${ctx.label}: ${msToTime(Number(ctx.raw) || 0)}`,
      },
    },
  },
  cutout: '75%', // Creates the thin inner ring
}

// === HTML Bar Chart Setup ===
const chartBars = computed(() => {
  const range = dailyStats.value
  const maxMs = Math.max(...range.map(r => r.ms), 60000) // minimum 1 min height
  const weekday = new Intl.DateTimeFormat(lang.value, { weekday: 'short' })
  const monthDay = new Intl.DateTimeFormat(lang.value, { month: 'numeric', day: 'numeric' })

  return range.map((r, i) => {
    const date = parseDateKey(r.date)
    let label = ''
    if (selectedDays.value === 1) label = t('stats.today')
    else if (selectedDays.value === 7) label = weekday.format(date)
    // 30 天：每 5 天標一次日期，最後一天必標
    else if ((range.length - 1 - i) % 5 === 0) label = monthDay.format(date)

    return {
      label,
      tooltip: `${monthDay.format(date)} · ${msToTime(r.ms)}`,
      percentage: Math.min(100, Math.max(5, (r.ms / maxMs) * 100)) // 5% min height
    }
  })
})

// === Top Sites Setup ===
const topSites = computed(() => {
  const maxMs = rangeStats.value[0]?.ms || 1
  return rangeStats.value.slice(0, 5).map(item => ({
    ...item,
    formattedTime: msToTime(item.ms),
    percentage: Math.min(100, (item.ms / maxMs) * 100)
  }))
})

// === Utilities ===
function msToTime(ms: number): string {
  if (!ms || ms < 0) return '0m'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h}h ${rm}m`
}

function siteCategory(domain: string): string {
  const cat = domainCategory(domain)
  return t(`stats.category.${cat === 'mail' ? 'general' : cat}`)
}

function getSiteColorClass(index: number): string {
  const classes = [
    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'bg-red-100 dark:bg-red-900/30 text-red-500',
    'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500',
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500'
  ]
  return classes[index % classes.length]
}

function getSiteBgClass(index: number): string {
  const classes = ['bg-blue-500', 'bg-red-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500']
  return classes[index % classes.length]
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
</style>
