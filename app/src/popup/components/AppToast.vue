<template>
  <Transition
    enter-from-class="opacity-0 translate-y-2"
    leave-to-class="opacity-0 translate-y-2"
    enter-active-class="transition duration-200"
    leave-active-class="transition duration-150"
  >
    <div
      v-if="toast"
      :key="toast.id"
      role="status"
      aria-live="polite"
      class="fixed inset-x-4 bottom-20 z-50 flex items-center gap-3 rounded-md border bg-surface-card px-4 py-3 text-sm font-medium shadow-lg"
      :class="toast.type === 'ok' ? 'border-brand/[0.35] text-ink-800' : 'border-danger/[0.35] text-danger'"
    >
      <AppIcon :name="toast.type === 'ok' ? 'check' : 'warning'" :size="18" :class="toast.type === 'ok' ? 'text-brand' : ''" />
      <span class="flex-1">{{ toast.text }}</span>
      <button
        v-if="toast.action"
        class="font-bold text-brand hover:text-brand/80"
        @click="runAction"
      >
        {{ toast.action.label }}
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { dismissToast, useToast } from '../composables/useToast'

const toast = useToast()

function runAction() {
  toast.value?.action?.run()
  dismissToast()
}
</script>
