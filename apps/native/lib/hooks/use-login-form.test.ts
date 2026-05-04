import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  phoneSmsAuth: vi.fn(),
  requestSmsCode: vi.fn(),
}));

vi.mock('@nvy/auth', () => ({
  phoneSmsAuth: mocks.phoneSmsAuth,
}));

vi.mock('@nvy/api-client', () => {
  class ResponseError extends Error {
    public readonly response: Response;
    constructor(response: Response, message?: string) {
      super(message);
      this.name = 'ResponseError';
      this.response = response;
    }
  }
  class ApiClientError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly details: unknown;
    public readonly traceId: string | undefined;
    constructor(status: number, body: { code?: string; message?: string }) {
      super(body.message ?? `HTTP ${status}`);
      this.name = 'ApiClientError';
      this.status = status;
      this.code = body.code ?? 'UNKNOWN_ERROR';
      this.details = undefined;
      this.traceId = undefined;
    }
  }
  class FetchError extends Error {
    public override readonly cause: Error;
    constructor(cause: Error, message?: string) {
      super(message);
      this.name = 'FetchError';
      this.cause = cause;
    }
  }
  return {
    getAccountSmsCodeApi: () => ({ requestSmsCode: mocks.requestSmsCode }),
    ResponseError,
    ApiClientError,
    FetchError,
  };
});

import { ResponseError } from '@nvy/api-client';

import { useLoginForm } from './use-login-form';

describe('useLoginForm', () => {
  beforeEach(() => {
    mocks.phoneSmsAuth.mockReset();
    mocks.requestSmsCode.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts at idle (per ADR-0016: 单 form, 无 tab)', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.state).toBe('idle');
      expect(result.current.errorToast).toBeNull();
      expect(result.current.errorScope).toBeNull();
      expect(result.current.smsCountdown).toBe(0);
    });
  });

  describe('requestSms (state machine: idle → requesting_sms → sms_sent)', () => {
    it('happy path: state advances + 60s countdown starts', async () => {
      vi.useFakeTimers();
      mocks.requestSmsCode.mockResolvedValue(undefined);
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });

      expect(mocks.requestSmsCode).toHaveBeenCalledWith({
        requestSmsCodeRequest: { phone: '+8613800138000' },
      });
      expect(result.current.state).toBe('sms_sent');
      expect(result.current.smsCountdown).toBe(60);

      // Advance 30s — countdown should be ~30
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      expect(result.current.smsCountdown).toBe(30);

      // Advance to end — countdown back to 0; state stays sms_sent (until submit)
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      expect(result.current.smsCountdown).toBe(0);
    });

    it('noop while countdown > 0; does not re-call API', async () => {
      vi.useFakeTimers();
      mocks.requestSmsCode.mockResolvedValue(undefined);
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });
      expect(mocks.requestSmsCode).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });
      expect(mocks.requestSmsCode).toHaveBeenCalledTimes(1);
    });

    it('on API error, state goes to error with errorScope=sms (per FR-015)', async () => {
      mocks.requestSmsCode.mockRejectedValue(
        new ResponseError(new Response(null, { status: 429 })),
      );
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorScope).toBe('sms');
      expect(result.current.errorToast).toBe('请求过于频繁，请稍后再试');
      expect(result.current.smsCountdown).toBe(0);
    });
  });

  describe('submit (state machine: sms_sent → submitting → success | error)', () => {
    it('happy path: idle → submitting → success', async () => {
      mocks.phoneSmsAuth.mockResolvedValue({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
      });
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submit('+8613800138000', '123456');
      });

      expect(mocks.phoneSmsAuth).toHaveBeenCalledWith('+8613800138000', '123456');
      expect(result.current.state).toBe('success');
      expect(result.current.errorToast).toBeNull();
    });

    it('401 → error with errorScope=submit (per FR-015) + 文案删 "密码"', async () => {
      mocks.phoneSmsAuth.mockRejectedValue(new ResponseError(new Response(null, { status: 401 })));
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submit('+8613800138000', '999999');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorScope).toBe('submit');
      expect(result.current.errorToast).toBe('手机号或验证码错误');
    });

    it('429 → error + rate_limit toast', async () => {
      mocks.phoneSmsAuth.mockRejectedValue(new ResponseError(new Response(null, { status: 429 })));
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submit('+8613800138000', '123456');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorToast).toBe('请求过于频繁，请稍后再试');
    });

    it('network error (TypeError) → error + network toast', async () => {
      mocks.phoneSmsAuth.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submit('+8613800138000', '123456');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorToast).toBe('网络异常，请检查网络后重试');
    });

    // SC-002 反枚举字节级一致 (per ADR-0016: server 4 分支字节级一致, client 不区分子码)
    it('two 401 calls produce identical visible state (SC-002)', async () => {
      mocks.phoneSmsAuth.mockRejectedValue(new ResponseError(new Response(null, { status: 401 })));

      const a = renderHook(() => useLoginForm());
      await act(async () => {
        await a.result.current.submit('+8613800138000', '999999');
      });
      const aSnapshot = {
        state: a.result.current.state,
        errorToast: a.result.current.errorToast,
      };

      const b = renderHook(() => useLoginForm());
      await act(async () => {
        await b.result.current.submit('+8613900139000', '111111');
      });
      const bSnapshot = {
        state: b.result.current.state,
        errorToast: b.result.current.errorToast,
      };

      expect(aSnapshot).toEqual(bSnapshot);
    });
  });

  describe('clearError', () => {
    it('clears errorToast + errorScope and returns error state to idle', async () => {
      mocks.phoneSmsAuth.mockRejectedValue(new ResponseError(new Response(null, { status: 401 })));
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submit('+8613800138000', '999999');
      });
      expect(result.current.state).toBe('error');
      expect(result.current.errorScope).toBe('submit');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.errorToast).toBeNull();
      expect(result.current.errorScope).toBeNull();
      expect(result.current.state).toBe('idle');
    });
  });

  describe('showPlaceholderToast (per ADR-0016 决策 4 + spec FR-007/9)', () => {
    it.each([
      ['wechat', '微信登录 - Coming in M1.3'],
      ['google', 'Google 登录 - Coming in M1.3'],
      ['apple', 'Apple 登录 - Coming in M1.3'],
      ['help', '帮助中心 - Coming in M1.3'],
    ] as const)('%s → toast = %s', (feature, expected) => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.showPlaceholderToast(feature);
      });

      expect(result.current.errorToast).toBe(expected);
    });

    it('does NOT call any auth / sms API', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.showPlaceholderToast('wechat');
      });

      expect(mocks.phoneSmsAuth).not.toHaveBeenCalled();
      expect(mocks.requestSmsCode).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('does not throw or warn on timer tick after unmount', async () => {
      vi.useFakeTimers();
      mocks.requestSmsCode.mockResolvedValue(undefined);
      const { result, unmount } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });
      expect(result.current.smsCountdown).toBe(60);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      unmount();
      vi.advanceTimersByTime(60_000);

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
