<template>
  <!-- 單色遮罩圖示：顏色永遠等於文字色（currentColor），與 style.md §4.2 一致 -->
  <span class="inline-block shrink-0 bg-current" :style="style" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS, type IconName } from '../icons'

const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 })

const style = computed(() => {
  // 內嵌的 SVG data URI 含有空白與引號，url() 內必須加引號
  const mask = `url("${ICONS[props.name]}") center / contain no-repeat`
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    mask,
    WebkitMask: mask,
  }
})
</script>
