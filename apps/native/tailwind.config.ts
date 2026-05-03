import type { Config } from 'tailwindcss';
import nativewindPreset from 'nativewind/preset';
import { tokens } from '@nvy/design-tokens';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
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
