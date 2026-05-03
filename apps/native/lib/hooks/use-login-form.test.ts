import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loginByPassword: vi.fn(),
  loginByPhoneSms: vi.fn(),
  requestSmsCode: vi.fn(),
}));

vi.mock('@nvy/auth', () => ({
  loginByPassword: mocks.loginByPassword,
  loginByPhoneSms: mocks.loginByPhoneSms,
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
    getAccountRegisterApi: () => ({ requestSmsCode: mocks.requestSmsCode }),
    ResponseError,
    ApiClientError,
    FetchError,
  };
});

import { ResponseError } from '@nvy/api-client';

import { useLoginForm } from './use-login-form';

describe('useLoginForm', () => {
  beforeEach(() => {
    mocks.loginByPassword.mockReset();
    mocks.loginByPhoneSms.mockReset();
    mocks.requestSmsCode.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('defaults to password tab + idle (FR-001 + Open Question 4)', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.tab).toBe('password');
      expect(result.current.state).toBe('idle');
      expect(result.current.errorToast).toBeNull();
      expect(result.current.smsCountdown).toBe(0);
    });
  });

  describe('submitPassword', () => {
    it('happy path: idle → submitting → success; loginByPassword called', async () => {
      mocks.loginByPassword.mockResolvedValue({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
      });
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitPassword('+8613800138000', 'pw');
      });

      expect(mocks.loginByPassword).toHaveBeenCalledWith('+8613800138000', 'pw');
      expect(result.current.state).toBe('success');
      expect(result.current.errorToast).toBeNull();
    });

    it('401 → error + invalid toast', async () => {
      mocks.loginByPassword.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitPassword('+8613800138000', 'wrong');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorToast).toBe('手机号或验证码/密码错误');
    });

    it('429 → error + rate_limit toast', async () => {
      mocks.loginByPassword.mockRejectedValue(
        new ResponseError(new Response(null, { status: 429 })),
      );
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitPassword('+8613800138000', 'pw');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorToast).toBe('请求过于频繁，请稍后再试');
    });

    it('network error (TypeError) → error + network toast', async () => {
      mocks.loginByPassword.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitPassword('+8613800138000', 'pw');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorToast).toBe('网络异常，请检查网络后重试');
    });
  });

  describe('submitSms', () => {
    it('happy path: state advances to success', async () => {
      mocks.loginByPhoneSms.mockResolvedValue({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
      });
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitSms('+8613800138000', '123456');
      });

      expect(mocks.loginByPhoneSms).toHaveBeenCalledWith('+8613800138000', '123456');
      expect(result.current.state).toBe('success');
    });

    // SC-002 防枚举字节级一致：已注册号+错码 vs 未注册号+任意码
    it('401 from submitPassword and submitSms produce identical visible state (SC-002)', async () => {
      mocks.loginByPassword.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );
      mocks.loginByPhoneSms.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );

      const passwordHook = renderHook(() => useLoginForm());
      await act(async () => {
        await passwordHook.result.current.submitPassword('+8613800138000', 'wrong');
      });
      const passwordSnapshot = {
        state: passwordHook.result.current.state,
        errorToast: passwordHook.result.current.errorToast,
      };

      const smsHook = renderHook(() => useLoginForm());
      await act(async () => {
        await smsHook.result.current.submitSms('+8613900139000', '999999');
      });
      const smsSnapshot = {
        state: smsHook.result.current.state,
        errorToast: smsHook.result.current.errorToast,
      };

      expect(passwordSnapshot).toEqual(smsSnapshot);
    });
  });

  describe('setTab', () => {
    it('switching tab clears errorToast and returns error state to idle', async () => {
      mocks.loginByPassword.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitPassword('+8613800138000', 'wrong');
      });
      expect(result.current.state).toBe('error');

      act(() => {
        result.current.setTab('sms');
      });

      expect(result.current.tab).toBe('sms');
      expect(result.current.errorToast).toBeNull();
      expect(result.current.state).toBe('idle');
    });

    it('switching tab during idle does not change state', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.setTab('sms');
      });

      expect(result.current.tab).toBe('sms');
      expect(result.current.state).toBe('idle');
    });
  });

  describe('requestSms', () => {
    it('calls API with purpose LOGIN and starts 60s countdown', async () => {
      vi.useFakeTimers();
      mocks.requestSmsCode.mockResolvedValue(undefined);
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });

      expect(mocks.requestSmsCode).toHaveBeenCalledWith({
        requestSmsCodeRequest: { phone: '+8613800138000', purpose: 'LOGIN' },
      });
      expect(result.current.smsCountdown).toBe(60);

      // Advance 30s — countdown should be ~30
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      expect(result.current.smsCountdown).toBe(30);

      // Advance to end — countdown back to 0
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

      // Try again while countdown > 0
      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });
      expect(mocks.requestSmsCode).toHaveBeenCalledTimes(1);
    });

    it('on API error, state goes to error and toast is set', async () => {
      mocks.requestSmsCode.mockRejectedValue(
        new ResponseError(new Response(null, { status: 429 })),
      );
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.requestSms('+8613800138000');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorToast).toBe('请求过于频繁，请稍后再试');
      expect(result.current.smsCountdown).toBe(0); // not started on failure
    });
  });

  describe('showPlaceholderToast', () => {
    it.each([
      ['wechat', '微信登录 - Coming in M1.3'],
      ['weibo', '微博登录 - Coming in M1.3'],
      ['google', 'Google 登录 - Coming in M1.3'],
      ['forgot-password', '密码重置 - Coming in M1.3'],
    ] as const)('%s → toast = %s', (feature, expected) => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.showPlaceholderToast(feature);
      });

      expect(result.current.errorToast).toBe(expected);
    });

    it('does NOT call any login / sms API', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.showPlaceholderToast('wechat');
      });

      expect(mocks.loginByPassword).not.toHaveBeenCalled();
      expect(mocks.loginByPhoneSms).not.toHaveBeenCalled();
      expect(mocks.requestSmsCode).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('clears errorToast and returns error state to idle', async () => {
      mocks.loginByPassword.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitPassword('+8613800138000', 'wrong');
      });
      expect(result.current.state).toBe('error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.errorToast).toBeNull();
      expect(result.current.state).toBe('idle');
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

      // Spy on console.error — React warns on state-update-after-unmount
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      unmount();
      vi.advanceTimersByTime(60_000);

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
