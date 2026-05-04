import type { Config } from 'tailwindcss';
import nativewindPreset from 'nativewind/preset';
import { tokens } from '@nvy/design-tokens';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  // NativeWind v4 web 默认 darkMode='media'（CSS @media），但 RN Web
  // 的 StatusBar style="auto" / Appearance API 会 setColorScheme，与 media
  // 类型冲突抛 "Cannot manually set color scheme" 运行时错。改为 class-based
  // 后由我们决定是否加 `.dark`，不加即常亮模式（M1.2 不做 dark mode）。
  darkMode: 'class',
  // nativewind/preset has empty upstream types (declared as `unknown` in
  // nativewind-env.d.ts); cast for tailwind Config compatibility.
  presets: [nativewindPreset as Config],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      fontFamily: tokens.fontFamily,
      boxShadow: tokens.boxShadow,
    },
  },
};

export default config;
