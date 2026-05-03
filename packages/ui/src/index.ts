// Cross-platform UI: re-exports design tokens + NativeWind component primitives.
//
// Tokens come from @nvy/design-tokens (single source of truth, also imported
// by apps/native/tailwind.config.ts and future apps/web/tailwind.config.ts).
// Component primitives emerge as Phase 4 pages drive their need (per CLAUDE.md).
export {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  boxShadow,
  tokens,
  type Tokens,
} from '@nvy/design-tokens';

export { Spinner, type SpinnerProps, type SpinnerTone } from './Spinner';
export { SuccessCheck } from './SuccessCheck';
export { ErrorRow, type ErrorRowProps } from './ErrorRow';
export { LogoMark } from './LogoMark';
