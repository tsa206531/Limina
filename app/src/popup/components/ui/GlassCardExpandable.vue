<template>
  <div class="group glass-card rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
    <button 
      class="w-full flex items-center justify-between p-4 cursor-pointer select-none bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:outline-none"
      @click="toggle"
    >
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-text-secondary dark:text-gray-400">{{ icon }}</span>
        <span class="font-medium text-text-main dark:text-white">{{ title }}</span>
      </div>
      <span 
        class="material-symbols-outlined text-text-secondary dark:text-gray-400 transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
      >
        expand_more
      </span>
    </button>
    
    <div 
      class="grid transition-all duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden">
        <div class="p-4 border-t border-white/20 dark:border-white/5 space-y-4 bg-white/20 dark:bg-black/10">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  icon: string
  open?: boolean
}>()

const isOpen = ref(props.open || false)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>
