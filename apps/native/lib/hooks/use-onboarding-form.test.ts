import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  updateDisplayName: vi.fn(),
}));

vi.mock('@nvy/auth', async () => {
  const actual = await vi.importActual<typeof import('@nvy/auth')>('@nvy/auth');
  return {
    ...actual,
    updateDisplayName: mocks.updateDisplayName,
  };
});

vi.mock('@nvy/api-client', () => {
  class ResponseError extends Error {
    public readonly response: Response;
    constructor(response: Response, message?: string) {
      super(message);
      this.name = 'ResponseError';
      this.response = response;
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
  class ApiClientError extends Error {
    public readonly status: number;
    public readonly code: string;
    constructor(status: number, body: { code?: string; message?: string }) {
      super(body.message ?? `HTTP ${status}`);
      this.name = 'ApiClientError';
      this.status = status;
      this.code = body.code ?? 'UNKNOWN_ERROR';
    }
  }
  return {
    getAccountAuthApi: () => ({ phoneSmsAuth: vi.fn() }),
    getAccountProfileApi: () => ({ getMe: vi.fn(), patchMe: vi.fn() }),
    getAuthApi: () => ({ refreshToken: vi.fn(), logoutAll: vi.fn() }),
    setTokenGetter: vi.fn(),
    setTokenRefresher: vi.fn(),
    ResponseError,
    FetchError,
    ApiClientError,
  };
});

import { ResponseError, FetchError } from '@nvy/api-client';

import { useOnboardingForm } from './use-onboarding-form';

describe('useOnboardingForm (T4 / spec FR-008 + FR-007)', () => {
  beforeEach(() => {
    mocks.updateDisplayName.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initial state: idle, empty displayName, no errorMessage, not submittable', () => {
    const { result } = renderHook(() => useOnboardingForm());
    expect(result.current.status).toBe('idle');
    expect(result.current.displayName).toBe('');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isSubmittable).toBe(false);
  });

  it('legal input + submit happy: idle → submitting → success', async () => {
    mocks.updateDisplayName.mockResolvedValue(undefined);
    const { result } = renderHook(() => useOnboardingForm());

    act(() => {
      result.current.setDisplayName('小明');
    });
    expect(result.current.isSubmittable).toBe(true);

    await act(async () => {
      await result.current.submit();
    });

    expect(mocks.updateDisplayName).toHaveBeenCalledWith('小明');
    expect(result.current.status).toBe('success');
    expect(result.current.errorMessage).toBeNull();
  });

  it('submit while form invalid → noop (updateDisplayName not called, status stays idle)', async () => {
    const { result } = renderHook(() => useOnboardingForm());

    act(() => {
      result.current.setDisplayName('   '); // whitespace-only → schema rejects
    });
    expect(result.current.isSubmittable).toBe(false);

    await act(async () => {
      await result.current.submit();
    });

    expect(mocks.updateDisplayName).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('submit 400 → status error + errorMessage 昵称不合法', async () => {
    mocks.updateDisplayName.mockRejectedValue(
      new ResponseError(new Response(null, { status: 400 })),
    );
    const { result } = renderHook(() => useOnboardingForm());

    act(() => {
      result.current.setDisplayName('小明');
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('昵称不合法，请重试');
  });

  it('submit 429 → status error + rate_limit toast', async () => {
    mocks.updateDisplayName.mockRejectedValue(
      new ResponseError(new Response(null, { status: 429 })),
    );
    const { result } = renderHook(() => useOnboardingForm());

    act(() => {
      result.current.setDisplayName('小明');
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('请求过于频繁，请稍后再试');
  });

  it('submit network error → status error + network toast', async () => {
    mocks.updateDisplayName.mockRejectedValue(new FetchError(new Error('socket')));
    const { result } = renderHook(() => useOnboardingForm());

    act(() => {
      result.current.setDisplayName('小明');
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('网络异常，请重试');
  });

  it('after error, changing input clears errorMessage and returns to idle', async () => {
    mocks.updateDisplayName.mockRejectedValue(
      new ResponseError(new Response(null, { status: 400 })),
    );
    const { result } = renderHook(() => useOnboardingForm());

    act(() => {
      result.current.setDisplayName('坏值');
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).not.toBeNull();

    act(() => {
      result.current.setDisplayName('新值');
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
  });
});
