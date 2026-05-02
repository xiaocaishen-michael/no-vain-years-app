// Design tokens — single source of truth for native (now) + web (M2 Next.js).
//
// Imported by:
// - apps/native/tailwind.config.ts (theme.extend)
// - apps/web/tailwind.config.ts (M2)
// - packages/ui/src/index.ts (re-export to consumers)
//
// Token naming follows Tailwind conventions (brand-{50..900} / spacing.md / text-base etc.).
// Phase 4 design system 定调 后扩展色阶 / 间距 / 字号；M1.2 起手只放最小集，避免"先造没用上的 token"。

export const colors = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  surface: '#ffffff',
  text: '#111827',
  border: '#e5e7eb',
  muted: '#6b7280',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const fontSize = {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['14px', { lineHeight: '20px' }],
  base: ['16px', { lineHeight: '24px' }],
  lg: ['18px', { lineHeight: '28px' }],
  xl: ['20px', { lineHeight: '28px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
  '3xl': ['30px', { lineHeight: '36px' }],
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

export const tokens = {
  colors,
  spacing,
  fontSize,
  borderRadius,
  boxShadow,
} as const;

export type Tokens = typeof tokens;
