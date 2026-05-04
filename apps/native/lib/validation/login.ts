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

export type ApiErrorKind = 'invalid' | 'rate_limit' | 'network' | 'unknown';

export interface MappedApiError {
  kind: ApiErrorKind;
  toast: string;
}

const TOAST = {
  invalid: '手机号或验证码错误',
  rate_limit: '请求过于频繁，请稍后再试',
  network: '网络异常，请检查网络后重试',
  unknown: '登录失败，请稍后再试',
} as const satisfies Record<ApiErrorKind, string>;

// Per spec FR-006 + SC-002 (per ADR-0016 server unified endpoint 4 分支字节级一致):
// all 401 paths must collapse to one identical {kind, toast} pair regardless of
// upstream sub-code (反枚举字节级一致 — server 已保证响应一致, client 不区分).
export function mapApiError(error: unknown): MappedApiError {
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
