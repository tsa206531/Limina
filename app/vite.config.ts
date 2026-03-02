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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.indexOf('node_modules/chart.js') !== -1 || id.indexOf('node_modules/vue-chartjs') !== -1) {
            return 'chart-lib';
          }
        }
      }
    }
  }
});
