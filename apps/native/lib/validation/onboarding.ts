import { z } from 'zod';

import { mapApiError, type ApiErrorKind, type MappedApiError } from './login';

// Mirrors server FR-005 (account-profile spec):
// - Trim leading/trailing whitespace.
// - 1 ≤ Unicode codepoint count ≤ 32 (Array.from counts surrogate-paired
//   emoji as a single codepoint; '<value>'.length would treat them as 2).
// - Forbid control / zero-width / line-separator characters that are visually
//   absent or break rendering.
//
// Built via fromCharCode + RegExp constructor — the literal characters
// (especially U+2028 / U+2029) are line terminators in JS source and would
// crash the parser if embedded in a regex literal.
const FORBIDDEN_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0000, 0x001f], // C0 controls
  [0x007f, 0x009f], // DEL + C1 controls
  [0x200b, 0x200f], // zero-width spaces / directional marks
  [0x2028, 0x2029], // line / paragraph separators
  [0xfeff, 0xfeff], // BOM / ZWNBSP
];
const FORBIDDEN_RE = new RegExp(
  '[' +
    FORBIDDEN_RANGES.map(([lo, hi]) =>
      lo === hi ? String.fromCharCode(lo) : String.fromCharCode(lo) + '-' + String.fromCharCode(hi),
    ).join('') +
    ']',
  'u',
);

export const displayNameSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(1, '昵称至少 1 字符')
      .refine((s) => Array.from(s).length <= 32, '昵称最长 32 字符')
      .refine((s) => !FORBIDDEN_RE.test(s), '昵称含不可见字符'),
  );

// Toast text differs from login (FR-007). Delegates kind classification to
// login.mapApiError to keep the error → kind decision tree single-sourced;
// only the user-visible string differs.
const ONBOARDING_TOAST: Record<ApiErrorKind, string> = {
  invalid: '昵称不合法，请重试',
  rate_limit: '请求过于频繁，请稍后再试',
  network: '网络异常，请重试',
  // 'frozen' won't reach onboarding (caller is post-login authenticated; FROZEN
  // accounts are blocked at login per spec C). Map to generic fallback in case
  // server adds the code elsewhere.
  frozen: '账号处于注销冻结期',
  unknown: '提交失败，请稍后重试',
};

export function mapOnboardingApiError(error: unknown): MappedApiError {
  const base = mapApiError(error);
  return { kind: base.kind, toast: ONBOARDING_TOAST[base.kind] };
}
