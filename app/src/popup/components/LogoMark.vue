<template>
  <!-- Limina 標誌：拱門（limen = 門檻）＋ 門檻線 ＋ 門內一點光。與 public/icons/icon.svg 同一組圖形 -->
  <svg :width="size" :height="size" viewBox="0 0 128 128" aria-hidden="true">
    <rect width="128" height="128" rx="30" fill="#009fb7" />
    <path d="M42 94V62a22 22 0 0 1 44 0v32" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M28 98h72" stroke="#fff" stroke-width="12" stroke-linecap="round" />
    <circle cx="64" cy="72" r="8" fill="#fff" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>
