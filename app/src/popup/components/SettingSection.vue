<template>
  <div class="glass-card p-4">
    <div
      class="text-xs font-semibold mb-2 uppercase tracking-widest"
      style="color: rgba(255, 224, 51, 0.5)"
    >
      {{ title }}
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
