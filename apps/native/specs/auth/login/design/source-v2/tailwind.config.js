// tailwind.config.js — extends Tailwind with no-vain-years brand tokens
// so RN components written with NativeWind can use semantic utility classes
// like bg-brand-500, text-ink-muted, rounded-md, p-md, shadow-card.
// Drop this in alongside packages/design-tokens; presets/extends as you wish.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{ts,tsx,js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EEF3FE",
          100: "#D5E0FC",
          200: "#ABC1F9",
          300: "#7DA0F5",
          400: "#4F7EEF",
          500: "#2456E5",
          600: "#1D47C2",
          700: "#173BA0",
          800: "#122E7C",
          900: "#0E2461",
          soft: "#E8EEFD",
        },
        accent:  { DEFAULT: "#FF8C00", soft: "#FFF1DE" },
        ink:     { DEFAULT: "#1A1A1A", muted: "#666666", subtle: "#999999" },
        line:    { DEFAULT: "#E5E7EB", strong: "#D1D5DB", soft: "#EEF0F3" },
        surface: { DEFAULT: "#FFFFFF", alt: "#F9F9F9", sunken: "#F2F4F7" },
        ok:      { DEFAULT: "#10B981", soft: "#E7F8F1" },
        warn:    { DEFAULT: "#F59E0B", soft: "#FEF3DC" },
        err:     { DEFAULT: "#EF4444", soft: "#FDECEC" },
      },
      spacing: {
        xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px",
        "2xl": "48px", "3xl": "64px",
      },
      borderRadius: {
        xs: "4px", sm: "8px", md: "12px", lg: "16px", full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "PingFang SC", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(17,24,39,.05), 0 1px 3px 0 rgba(17,24,39,.04)",
        cta:  "0 4px 12px -2px rgba(36,86,229,0.25)",
      },
    },
  },
  plugins: [],
};
