import { ApiClientError, FetchError, ResponseError } from '@nvy/api-client';
import { z } from 'zod';

export const PHONE_REGEX = /^\+861[3-9]\d{9}$/;

// Per ADR-0016: 单 schema 取代 loginPasswordSchema + loginSmsSchema
// (双 tab + password 路径已废, M1.3 phase 1 用于 unified phone-SMS auth).
export const phoneSmsAuthSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'INVALID_PHONE_FORMAT'),
  smsCode: z.string().regex(/^\d{6}$/, 'INVALID_SMS_CODE_FORMAT'),
});

export type PhoneSmsAuthValues = z.infer<typeof phoneSmsAuthSchema>;

export type ApiErrorKind = 'invalid' | 'rate_limit' | 'network' | 'frozen' | 'unknown';

export interface MappedApiError {
  kind: ApiErrorKind;
  toast: string;
}

const TOAST = {
  invalid: '手机号或验证码错误',
  rate_limit: '请求过于频繁，请稍后再试',
  network: '网络异常，请检查网络后重试',
  frozen: '账号处于注销冻结期，可撤销注销恢复账号',
  unknown: '登录失败，请稍后再试',
} as const satisfies Record<ApiErrorKind, string>;

// Spec D server returns 403 + body.code === 'ACCOUNT_IN_FREEZE_PERIOD' when the
// authenticating account is FROZEN. The login flow consumes this as a signal to
// show the freeze-period modal (spec C T6) — not the standard ErrorRow.
export const FROZEN_ACCOUNT_CODE = 'ACCOUNT_IN_FREEZE_PERIOD';

// Per spec FR-006 + SC-002 (per ADR-0016 server unified endpoint 4 分支字节级一致):
// all 401 paths must collapse to one identical {kind, toast} pair regardless of
// upstream sub-code (反枚举字节级一致 — server 已保证响应一致, client 不区分).
//
// `bodyCode` is the optional body.code extracted from a 4xx response body; the
// caller reads it before calling mapApiError (the body read is async so we
// keep this fn sync by lifting the read up). Only ACCOUNT_IN_FREEZE_PERIOD is
// observed today (per spec C T5); other codes still funnel through generic
// status-based mapping to preserve the反枚举 invariant.
export function mapApiError(error: unknown, bodyCode?: string | null): MappedApiError {
  if (bodyCode === FROZEN_ACCOUNT_CODE) {
    return { kind: 'frozen', toast: TOAST.frozen };
  }
  if (error instanceof ApiClientError && error.code === FROZEN_ACCOUNT_CODE) {
    return { kind: 'frozen', toast: TOAST.frozen };
  }
  if (error instanceof ResponseError) {
    const status = error.response.status;
    if (status === 401 || status === 400) {
      return { kind: 'invalid', toast: TOAST.invalid };
    }
    if (status === 429) {
      return { kind: 'rate_limit', toast: TOAST.rate_limit };
    }
    if (status >= 500) {
      return { kind: 'network', toast: TOAST.network };
    }
    return { kind: 'unknown', toast: TOAST.unknown };
  }
  if (error instanceof FetchError || error instanceof TypeError) {
    return { kind: 'network', toast: TOAST.network };
  }
  if (error instanceof ApiClientError) {
    return { kind: 'unknown', toast: TOAST.unknown };
  }
  return { kind: 'unknown', toast: TOAST.unknown };
}

// Async helper: peeks the response body of a ResponseError to extract `code`.
// Use this from async catch blocks before calling mapApiError so the
// frozen-account signal reaches the sync mapper. Returns null on any failure
// (non-JSON body, body already consumed, etc.) — caller falls back to
// status-based mapping.
export async function readErrorCode(error: unknown): Promise<string | null> {
  if (!(error instanceof ResponseError)) return null;
  try {
    const body = (await error.response.clone().json()) as { code?: string };
    return body.code ?? null;
  } catch {
    return null;
  }
}
