// tailwind.config.js — extends Tailwind with no-vain-years brand tokens.
// Mirrors login v2 / onboarding base; profile page adds:
//   • hero-overlay         — semi-transparent dark scrim for white-on-blur legibility
//   • white-soft / strong  — alpha tints of pure white for nav icons / divider on blur
// delete-cancel PHASE 2 adds:
//   • modal-overlay        — stronger dim scrim for dialog/sheet (rgba(15,18,28,0.48))
//
// device-management spec adds: NOTHING. All decisions reuse existing tokens.
//   • 「本机」徽标       → bg-brand-soft + text-brand-600 (semantic identity, not danger)
//   • destructive 移除   → bg-err + text-surface (mirrors delete-cancel "确认注销")
//   • sheet overlay      → modal-overlay (reused from delete-cancel freeze modal)
//   • sheet handle       → bg-line-strong (small pill, no new token)
//   • device-icon stroke → ink-muted (no new token)

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
        // === Profile-page additions ===
        "hero-overlay": "rgba(15,18,28,0.36)",
        "white-soft":   "rgba(255,255,255,0.72)",
        "white-strong": "rgba(255,255,255,0.92)",
        // === delete-cancel PHASE 2 addition ===
        "modal-overlay": "rgba(15,18,28,0.48)",
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
        "hero-ring": "0 4px 16px -4px rgba(0,0,0,0.18)",
        // err-fill primary CTA halo (移除该设备 / 移除); mirrors shadow.cta but err-tinted.
        "cta-err": "0 4px 12px -2px rgba(239,68,68,0.28)",
        // bottom-sheet card lift (above modal-overlay scrim).
        sheet: "0 -4px 24px -6px rgba(17,24,39,0.18)",
      },
    },
  },
  plugins: [],
};
