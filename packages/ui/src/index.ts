// Cross-platform UI: re-exports design tokens + (future) NativeWind primitives.
//
// Tokens come from @nvy/design-tokens (single source of truth, also imported
// by apps/native/tailwind.config.ts and future apps/web/tailwind.config.ts).
// Component primitives (Button, PhoneInput, etc.) land in subsequent PRs as
// Phase 4 pages drive their need (TDD-style emergence per CLAUDE.md).
export {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  boxShadow,
  tokens,
  type Tokens,
} from '@nvy/design-tokens';
