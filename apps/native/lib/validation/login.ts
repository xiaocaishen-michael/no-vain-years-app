import { ApiClientError, FetchError, ResponseError } from '@nvy/api-client';
import { z } from 'zod';

export const PHONE_REGEX = /^\+861[3-9]\d{9}$/;

export const loginPasswordSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'INVALID_PHONE_FORMAT'),
  password: z.string().min(1, 'PASSWORD_REQUIRED'),
});

export const loginSmsSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'INVALID_PHONE_FORMAT'),
  smsCode: z.string().regex(/^\d{6}$/, 'INVALID_SMS_CODE_FORMAT'),
});

export type LoginPasswordValues = z.infer<typeof loginPasswordSchema>;
export type LoginSmsValues = z.infer<typeof loginSmsSchema>;

export type ApiErrorKind = 'invalid' | 'rate_limit' | 'network' | 'unknown';

export interface MappedApiError {
  kind: ApiErrorKind;
  toast: string;
}

const TOAST = {
  invalid: '手机号或验证码/密码错误',
  rate_limit: '请求过于频繁，请稍后再试',
  network: '网络异常，请检查网络后重试',
  unknown: '登录失败，请稍后再试',
} as const satisfies Record<ApiErrorKind, string>;

// Per spec FR-006 + SC-002: all 401 paths must collapse to one identical
// {kind, toast} pair regardless of upstream sub-code (防枚举字节级一致).
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
