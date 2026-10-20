import type { Config } from "tailwindcss";

// 設計規範：doc/style/style.md
// - 單一品牌色相 #009fb7，層次靠 alpha（bg-brand/10、border-brand/20…）
// - 中性色、表面、分隔線以 CSS 變數定義（src/popup/style.css），深色模式只翻轉變數，元件不寫 dark: 前綴
// - 圓角級距沿用 style.md；popup 只有 360px 寬，卡片用 xl（24px）而非網站的 50px
export default {
  content: ["./src/**/*.{vue,ts,tsx,html}", "./src/popup/index.html"],
  theme: {
    extend: {
      colors: {
        brand: "rgb(0 159 183 / <alpha-value>)", // 深色模式不翻轉
        danger: "rgb(251 44 54 / <alpha-value>)",
        warning: "rgb(254 154 0 / <alpha-value>)",
        ink: {
          900: "var(--ink-900)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
          600: "var(--ink-600)",
          500: "var(--ink-500)",
          400: "var(--ink-400)",
          300: "var(--ink-300)",
        },
        surface: {
          page: "var(--surface-page)",
          card: "var(--surface-card)",
          subtle: "var(--surface-subtle)",
          muted: "var(--surface-muted)",
        },
        line: {
          200: "var(--line-200)",
          300: "var(--line-300)",
        },
      },
      fontFamily: {
        // Inter（本地打包）負責拉丁字與數字，中日文交給系統字體
        sans: ["Inter Variable", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Hiragino Sans", "sans-serif"],
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "20px",
        xl: "24px",
      },
      boxShadow: {
        btn: "0 5px 8px -5px rgba(0,159,183,0.2), 0 13px 20px -4px rgba(0,159,183,0.2)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
