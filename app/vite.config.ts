import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest })
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // 不使用 manualChunks：統計頁已改為延遲載入，Chart.js 會自然落在 StatsView 的 chunk。
  // 手動指定 chart-lib 會把 vue-chartjs 依賴的 Vue 一起拉進去，反而讓 popup 一開就載入整包。
});
