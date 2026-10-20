<template>
  <!-- 開關（style.md §4.8）：軌道 44×24，關閉 surface-muted、開啟 brand；鍵盤可操作 -->
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors"
    :class="modelValue ? 'border-brand bg-brand' : 'border-line-300 bg-surface-muted'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform"
      :class="modelValue ? 'translate-x-[22px]' : 'translate-x-[2px]'"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string }>()
defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>
