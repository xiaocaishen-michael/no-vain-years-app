import { vi, describe, expect, it } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { FetchError, ResponseError } from '@nvy/api-client';

import { displayNameSchema, mapOnboardingApiError } from './onboarding';

// Build invisibles from char codes — keeps source ASCII-only and resilient
// to prettier / git binary-detection drift.
const BEL = String.fromCharCode(0x0007);
const DEL = String.fromCharCode(0x007f);
const ZWSP = String.fromCharCode(0x200b);
const BOM = String.fromCharCode(0xfeff);
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

describe('displayNameSchema (T3 / spec FR-005, mirrors server FR-005)', () => {
  it('empty string rejected', () => {
    expect(displayNameSchema.safeParse('').success).toBe(false);
  });

  it('whitespace-only rejected (trim → empty)', () => {
    expect(displayNameSchema.safeParse('   ').success).toBe(false);
  });

  it('rejects 33 ASCII chars (> 32 codepoint cap)', () => {
    expect(displayNameSchema.safeParse('a'.repeat(33)).success).toBe(false);
  });

  it('accepts 32 CJK chars (codepoint count, not utf16 length)', () => {
    expect(displayNameSchema.safeParse('字'.repeat(32)).success).toBe(true);
  });

  it('rejects 33 CJK chars (> 32 codepoint cap)', () => {
    expect(displayNameSchema.safeParse('字'.repeat(33)).success).toBe(false);
  });

  it('accepts emoji-only (each emoji counts as 1 codepoint)', () => {
    expect(displayNameSchema.safeParse('🎉🌸').success).toBe(true);
  });

  it('rejects control character (BEL U+0007)', () => {
    expect(displayNameSchema.safeParse(`xxx${BEL}yyy`).success).toBe(false);
  });

  it('rejects DEL (U+007F)', () => {
    expect(displayNameSchema.safeParse(`xxx${DEL}yyy`).success).toBe(false);
  });

  it('rejects zero-width space (U+200B)', () => {
    expect(displayNameSchema.safeParse(`xxx${ZWSP}yyy`).success).toBe(false);
  });

  it('rejects BOM / ZWNBSP (U+FEFF)', () => {
    expect(displayNameSchema.safeParse(`xxx${BOM}yyy`).success).toBe(false);
  });

  it('rejects line separator (U+2028)', () => {
    expect(displayNameSchema.safeParse(`xxx${LS}yyy`).success).toBe(false);
  });

  it('rejects paragraph separator (U+2029)', () => {
    expect(displayNameSchema.safeParse(`xxx${PS}yyy`).success).toBe(false);
  });

  it('trims leading/trailing whitespace', () => {
    const result = displayNameSchema.safeParse('  小明  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('小明');
  });

  it('accepts mixed CJK + ascii + emoji legal value', () => {
    const result = displayNameSchema.safeParse('小明_2026🎉');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('小明_2026🎉');
  });
});

describe('mapOnboardingApiError (T3 / spec FR-007)', () => {
  it('400 → kind invalid + onboarding toast', () => {
    const err = new ResponseError(new Response(null, { status: 400 }));
    expect(mapOnboardingApiError(err)).toEqual({
      kind: 'invalid',
      toast: '昵称不合法，请重试',
    });
  });

  it('429 → kind rate_limit + onboarding toast', () => {
    const err = new ResponseError(new Response(null, { status: 429 }));
    expect(mapOnboardingApiError(err)).toEqual({
      kind: 'rate_limit',
      toast: '请求过于频繁，请稍后再试',
    });
  });

  it('500 → kind network + onboarding toast', () => {
    const err = new ResponseError(new Response(null, { status: 500 }));
    expect(mapOnboardingApiError(err)).toEqual({
      kind: 'network',
      toast: '网络异常，请重试',
    });
  });

  it('FetchError → kind network + onboarding toast', () => {
    const err = new FetchError(new Error('socket'));
    expect(mapOnboardingApiError(err)).toEqual({
      kind: 'network',
      toast: '网络异常，请重试',
    });
  });

  it('TypeError (raw fetch failure) → kind network', () => {
    const err = new TypeError('Failed to fetch');
    expect(mapOnboardingApiError(err)).toEqual({
      kind: 'network',
      toast: '网络异常，请重试',
    });
  });

  it('unknown error class → kind unknown + onboarding toast', () => {
    expect(mapOnboardingApiError(new Error('weird'))).toEqual({
      kind: 'unknown',
      toast: '提交失败，请稍后重试',
    });
  });
});
