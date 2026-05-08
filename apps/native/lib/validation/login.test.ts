import { vi, describe, expect, it } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { ApiClientError, FetchError, ResponseError } from '@nvy/api-client';

import {
  FROZEN_ACCOUNT_CODE,
  mapApiError,
  phoneSmsAuthSchema,
  PHONE_REGEX,
  readErrorCode,
} from './login';

describe('PHONE_REGEX', () => {
  it.each([
    ['+8613800138000', true],
    ['+8615912345678', true],
    ['8613800138000', false], // 缺 +
    ['+8612800138000', false], // 1 后非 3-9
    ['+8613800138', false], // 不足 11 位
    ['+861380013800012', false], // 超过 11 位
    ['+1612800138000', false], // 非 +86
    ['', false],
  ])('%s → %s', (input, expected) => {
    expect(PHONE_REGEX.test(input)).toBe(expected);
  });
});

describe('phoneSmsAuthSchema', () => {
  it('accepts legal phone + 6-digit code', () => {
    const result = phoneSmsAuthSchema.safeParse({
      phone: '+8613800138000',
      smsCode: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone', () => {
    const result = phoneSmsAuthSchema.safeParse({
      phone: '13800138000',
      smsCode: '123456',
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ['12345', '5 位'],
    ['1234567', '7 位'],
    ['12a456', '含字母'],
    ['', '空'],
  ])('rejects sms code %s (%s)', (smsCode) => {
    const result = phoneSmsAuthSchema.safeParse({
      phone: '+8613800138000',
      smsCode,
    });
    expect(result.success).toBe(false);
  });
});

describe('mapApiError', () => {
  // Helpers — minimal ResponseError fixture (status only matters)
  const makeResponseError = (status: number) =>
    new ResponseError(new Response(null, { status }), `HTTP ${status}`);

  it('401 → invalid (per ADR-0016: 文案删 "密码" 字样)', () => {
    expect(mapApiError(makeResponseError(401))).toEqual({
      kind: 'invalid',
      toast: '手机号或验证码错误',
    });
  });

  it('400 → invalid (form bypass safety net)', () => {
    expect(mapApiError(makeResponseError(400))).toEqual({
      kind: 'invalid',
      toast: '手机号或验证码错误',
    });
  });

  it('429 → rate_limit', () => {
    expect(mapApiError(makeResponseError(429))).toEqual({
      kind: 'rate_limit',
      toast: '请求过于频繁，请稍后再试',
    });
  });

  it('500 → network', () => {
    expect(mapApiError(makeResponseError(500))).toEqual({
      kind: 'network',
      toast: '网络异常，请检查网络后重试',
    });
  });

  it('502 → network', () => {
    expect(mapApiError(makeResponseError(502))).toEqual({
      kind: 'network',
      toast: '网络异常，请检查网络后重试',
    });
  });

  it('TypeError → network (fetch failure / DNS / CORS)', () => {
    expect(mapApiError(new TypeError('Failed to fetch'))).toEqual({
      kind: 'network',
      toast: '网络异常，请检查网络后重试',
    });
  });

  it('FetchError → network (OpenAPI runtime wraps TypeError on connection refused)', () => {
    expect(mapApiError(new FetchError(new TypeError('Failed to fetch'), 'fetch failed'))).toEqual({
      kind: 'network',
      toast: '网络异常，请检查网络后重试',
    });
  });

  it('ApiClientError → unknown', () => {
    expect(mapApiError(new ApiClientError(500, { code: 'BOOM', message: 'boom' }))).toEqual({
      kind: 'unknown',
      toast: '登录失败，请稍后再试',
    });
  });

  it('plain Error → unknown', () => {
    expect(mapApiError(new Error('mystery'))).toEqual({
      kind: 'unknown',
      toast: '登录失败，请稍后再试',
    });
  });

  it('null / undefined → unknown', () => {
    expect(mapApiError(null)).toEqual({
      kind: 'unknown',
      toast: '登录失败，请稍后再试',
    });
    expect(mapApiError(undefined)).toEqual({
      kind: 'unknown',
      toast: '登录失败，请稍后再试',
    });
  });

  // SC-002 反枚举字节级一致（per ADR-0016: server 4 分支字节级一致, client 不区分子码）
  it('all 401 errors collapse to identical {kind, toast} (anti-enumeration)', () => {
    const a = mapApiError(makeResponseError(401)); // 已注册号 + 错码
    const b = mapApiError(makeResponseError(401)); // 未注册号 + 任意码
    expect(a).toEqual(b);
  });

  // spec C T5 / FR-010 — frozen-account detection via body code (spec D 403 +
  // ACCOUNT_IN_FREEZE_PERIOD)
  describe('frozen account detection (spec C T5)', () => {
    it('US4-1: bodyCode === ACCOUNT_IN_FREEZE_PERIOD → kind: frozen', () => {
      expect(mapApiError(makeResponseError(403), FROZEN_ACCOUNT_CODE)).toEqual({
        kind: 'frozen',
        toast: '账号处于注销冻结期，可撤销注销恢复账号',
      });
    });

    it('ApiClientError.code === ACCOUNT_IN_FREEZE_PERIOD → kind: frozen (sync path)', () => {
      const e = new ApiClientError(403, { code: FROZEN_ACCOUNT_CODE, message: 'frozen' });
      expect(mapApiError(e)).toEqual({
        kind: 'frozen',
        toast: '账号处于注销冻结期，可撤销注销恢复账号',
      });
    });

    it('US4-5 反例 — 其他错误码 / 401 / 429 / 5xx 不触发 frozen', () => {
      // bodyCode 不存在 → 走 status-based mapping
      expect(mapApiError(makeResponseError(401)).kind).toBe('invalid');
      expect(mapApiError(makeResponseError(429)).kind).toBe('rate_limit');
      expect(mapApiError(makeResponseError(500)).kind).toBe('network');
      // bodyCode 是其他业务码 → 不触发 frozen,反枚举仍生效
      expect(mapApiError(makeResponseError(401), 'INVALID_CREDENTIALS').kind).toBe('invalid');
    });

    it('FROZEN_ACCOUNT_CODE 字面量与 server PRD 一致', () => {
      expect(FROZEN_ACCOUNT_CODE).toBe('ACCOUNT_IN_FREEZE_PERIOD');
    });
  });
});

describe('readErrorCode (spec C T5)', () => {
  it('extracts body.code from ResponseError', async () => {
    const response = new Response(JSON.stringify({ code: FROZEN_ACCOUNT_CODE }), { status: 403 });
    const error = new ResponseError(response, 'frozen');
    expect(await readErrorCode(error)).toBe(FROZEN_ACCOUNT_CODE);
  });

  it('returns null for non-JSON body', async () => {
    const response = new Response('not json', { status: 403 });
    const error = new ResponseError(response, 'broken');
    expect(await readErrorCode(error)).toBeNull();
  });

  it('returns null for body without code field', async () => {
    const response = new Response(JSON.stringify({ message: 'no code' }), { status: 403 });
    const error = new ResponseError(response, 'no code');
    expect(await readErrorCode(error)).toBeNull();
  });

  it('returns null for non-ResponseError input', async () => {
    expect(await readErrorCode(new Error('plain'))).toBeNull();
    expect(await readErrorCode(null)).toBeNull();
    expect(await readErrorCode(undefined)).toBeNull();
  });
});
