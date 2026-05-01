// Tamagui design system config + tokens for @nvy/ui.
//
// Initial setup uses Tamagui's default v3 config (full color / space / size
// scales out of the box). Project-specific customization (brand colors,
// custom fonts, radius scale tweaks) layered on top in subsequent PRs as
// design intent crystallizes (per docs/ui-ux-workflow.md M1.1 前置投入).
//
// Imported by:
// - apps/native/app/_layout.tsx (TamaguiProvider config)
// - apps/native/babel.config.js (compiler config path)
// - all packages/ui/src/* components (token references)

import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

export const tamaguiConfig = createTamagui(defaultConfig);

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}
