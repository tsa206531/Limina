import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{vue,ts,tsx,html}", "./src/popup/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#088396",
        "primary-dark": "#066878",
        "background-light": "#F2F7F9",
        "background-dark": "#102022",
        "surface-light": "rgba(255, 255, 255, 0.6)",
        "surface-dark": "rgba(26, 43, 48, 0.6)",
        "text-main": "#1A2B30",
        "text-secondary": "#647A82",
        "accent-teal": "#7AB2B2",
        "dark-teal": "#09637E",
      },
      backdropBlur: {
        glass: "12px",
        "glass-heavy": "20px",
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        breathe: "breathe 8s ease-in-out infinite",
        float: "float 12s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-10px) translateX(10px)" },
          "66%": { transform: "translateY(10px) translateX(-10px)" },
        },
      },
      fontFamily: {
        // Inter 由 @fontsource-variable/inter 本地打包；中日文退回系統字體
        display: ["Inter Variable", "system-ui", "Noto Sans TC", "Microsoft JhengHei", "sans-serif"],
        sans: ["Inter Variable", "system-ui", "Noto Sans TC", "Microsoft JhengHei", "sans-serif"],
      },
      borderRadius: {
        xl: "1.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/forms"),
  ],
} satisfies Config;
