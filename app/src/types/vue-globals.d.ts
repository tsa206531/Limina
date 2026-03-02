// src/types/vue-globals.d.ts
// Declare custom global properties added in main.ts

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, params?: Record<string, string | number>) => string
  }
}

export {}
