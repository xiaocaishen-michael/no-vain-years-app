import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  patchMe: vi.fn(),
  phoneSmsAuthApi: vi.fn(),
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
    getAccountAuthApi: () => ({ phoneSmsAuth: mocks.phoneSmsAuthApi }),
    getAccountProfileApi: () => ({ getMe: mocks.getMe, patchMe: mocks.patchMe }),
    getAuthApi: () => ({ refreshToken: vi.fn(), logoutAll: vi.fn() }),
    setTokenGetter: vi.fn(),
    setTokenRefresher: vi.fn(),
    ResponseError,
    FetchError,
    ApiClientError,
  };
});

import { ResponseError, FetchError } from '@nvy/api-client';
import { loadProfile, phoneSmsAuth, updateDisplayName, useAuthStore } from '@nvy/auth';

describe('auth usecases — loadProfile / updateDisplayName / phoneSmsAuth chaining (T2 / FR-003 / FR-004)', () => {
  beforeEach(() => {
    mocks.getMe.mockReset();
    mocks.patchMe.mockReset();
    mocks.phoneSmsAuthApi.mockReset();
    useAuthStore.setState({
      accountId: null,
      accessToken: null,
      refreshToken: null,
      displayName: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('loadProfile', () => {
    it('happy: writes response.displayName to store', async () => {
      mocks.getMe.mockResolvedValue({
        accountId: 1,
        displayName: '小明',
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });
      await loadProfile();
      expect(useAuthStore.getState().displayName).toBe('小明');
    });

    it('null displayName from server → store.displayName === null', async () => {
      mocks.getMe.mockResolvedValue({
        accountId: 1,
        displayName: null,
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });
      await loadProfile();
      expect(useAuthStore.getState().displayName).toBeNull();
    });

    it('401 re-thrown (refresh middleware exhausted) — does not pollute store', async () => {
      useAuthStore.setState({ displayName: '老张' });
      mocks.getMe.mockRejectedValue(new ResponseError(new Response(null, { status: 401 })));
      await expect(loadProfile()).rejects.toBeInstanceOf(ResponseError);
      expect(useAuthStore.getState().displayName).toBe('老张');
    });

    it('network error re-thrown — does not pollute store', async () => {
      useAuthStore.setState({ displayName: '老张' });
      mocks.getMe.mockRejectedValue(new FetchError(new Error('socket')));
      await expect(loadProfile()).rejects.toBeInstanceOf(FetchError);
      expect(useAuthStore.getState().displayName).toBe('老张');
    });
  });

  describe('updateDisplayName', () => {
    it('happy: PATCH succeeds → store.displayName updated from response', async () => {
      mocks.patchMe.mockResolvedValue({
        accountId: 1,
        displayName: '小明',
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });
      await updateDisplayName('小明');
      expect(mocks.patchMe).toHaveBeenCalledWith({
        updateDisplayNameRequest: { displayName: '小明' },
      });
      expect(useAuthStore.getState().displayName).toBe('小明');
    });

    it('400 INVALID_DISPLAY_NAME re-thrown — store unchanged', async () => {
      mocks.patchMe.mockRejectedValue(new ResponseError(new Response(null, { status: 400 })));
      await expect(updateDisplayName('坏值')).rejects.toBeInstanceOf(ResponseError);
      expect(useAuthStore.getState().displayName).toBeNull();
    });

    it('429 re-thrown — store unchanged', async () => {
      mocks.patchMe.mockRejectedValue(new ResponseError(new Response(null, { status: 429 })));
      await expect(updateDisplayName('小明')).rejects.toBeInstanceOf(ResponseError);
      expect(useAuthStore.getState().displayName).toBeNull();
    });
  });

  describe('phoneSmsAuth → loadProfile chaining (FR-004)', () => {
    it('happy: phoneSmsAuth success + getMe success → both session and displayName written', async () => {
      mocks.phoneSmsAuthApi.mockResolvedValue({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
      });
      mocks.getMe.mockResolvedValue({
        accountId: 1,
        displayName: '小明',
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });

      await phoneSmsAuth('+8613800138000', '123456');

      const state = useAuthStore.getState();
      expect(state.accountId).toBe(1);
      expect(state.accessToken).toBe('a');
      expect(state.refreshToken).toBe('r');
      expect(state.isAuthenticated).toBe(true);
      expect(state.displayName).toBe('小明');
    });

    it('phoneSmsAuth success + getMe failure → session set, loadProfile error swallowed (AuthGate fallback)', async () => {
      mocks.phoneSmsAuthApi.mockResolvedValue({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
      });
      mocks.getMe.mockRejectedValue(new FetchError(new Error('socket')));

      // Should NOT throw — error is swallowed so the login flow completes.
      await expect(phoneSmsAuth('+8613800138000', '123456')).resolves.toMatchObject({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      // displayName still null → AuthGate routes to /(app)/onboarding (FR-001).
      expect(state.displayName).toBeNull();
    });
  });
});
