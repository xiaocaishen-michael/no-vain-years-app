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
  sendDeletionCode: vi.fn(),
  deleteAccountApi: vi.fn(),
  sendCancelDeletionCode: vi.fn(),
  cancelDeletionApi: vi.fn(),
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
    getAccountDeletionApi: () => ({
      sendCode1: mocks.sendDeletionCode,
      _delete: mocks.deleteAccountApi,
    }),
    getCancelDeletionApi: () => ({
      sendCode: mocks.sendCancelDeletionCode,
      cancel: mocks.cancelDeletionApi,
    }),
    setTokenGetter: vi.fn(),
    setTokenRefresher: vi.fn(),
    ResponseError,
    FetchError,
    ApiClientError,
  };
});

import { ResponseError, FetchError } from '@nvy/api-client';
import {
  cancelDeletion,
  deleteAccount,
  loadProfile,
  phoneSmsAuth,
  requestCancelDeletionSmsCode,
  requestDeleteAccountSmsCode,
  updateDisplayName,
  useAuthStore,
} from '@nvy/auth';

describe('auth usecases — loadProfile / updateDisplayName / phoneSmsAuth chaining (T2 / FR-003 / FR-004)', () => {
  beforeEach(() => {
    mocks.getMe.mockReset();
    mocks.patchMe.mockReset();
    mocks.phoneSmsAuthApi.mockReset();
    mocks.sendDeletionCode.mockReset();
    mocks.deleteAccountApi.mockReset();
    mocks.sendCancelDeletionCode.mockReset();
    mocks.cancelDeletionApi.mockReset();
    useAuthStore.setState({
      accountId: null,
      accessToken: null,
      refreshToken: null,
      displayName: null,
      phone: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('loadProfile', () => {
    it('happy: writes response.displayName + phone to store', async () => {
      mocks.getMe.mockResolvedValue({
        accountId: 1,
        phone: '+8613800138000',
        displayName: '小明',
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });
      await loadProfile();
      expect(useAuthStore.getState().displayName).toBe('小明');
      expect(useAuthStore.getState().phone).toBe('+8613800138000');
    });

    it('null displayName from server → store.displayName === null; phone still written', async () => {
      mocks.getMe.mockResolvedValue({
        accountId: 1,
        phone: '+8613800138000',
        displayName: null,
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });
      await loadProfile();
      expect(useAuthStore.getState().displayName).toBeNull();
      expect(useAuthStore.getState().phone).toBe('+8613800138000');
    });

    it('absent phone from server → store.phone === null (per T2 + plan 决策 1)', async () => {
      mocks.getMe.mockResolvedValue({
        accountId: 1,
        displayName: '小明',
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });
      await loadProfile();
      expect(useAuthStore.getState().phone).toBeNull();
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

  // -------------------------------------------------------------------------
  // spec C T1 — delete-account / cancel-deletion wrappers
  // -------------------------------------------------------------------------

  describe('requestDeleteAccountSmsCode (spec C T1 / FR-004 wrapper path)', () => {
    it('happy: SDK resolves void → wrapper resolves void', async () => {
      mocks.sendDeletionCode.mockResolvedValue(undefined);
      await expect(requestDeleteAccountSmsCode()).resolves.toBeUndefined();
      expect(mocks.sendDeletionCode).toHaveBeenCalledTimes(1);
    });

    it('429 re-thrown — store unchanged', async () => {
      useAuthStore.setState({ accessToken: 'a', isAuthenticated: true });
      mocks.sendDeletionCode.mockRejectedValue(
        new ResponseError(new Response(null, { status: 429 })),
      );
      await expect(requestDeleteAccountSmsCode()).rejects.toBeInstanceOf(ResponseError);
      expect(useAuthStore.getState().accessToken).toBe('a');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('deleteAccount (spec C T1 / FR-008 / decision 1 finally clearSession)', () => {
    it('happy: SDK resolves → clearSession called → store cleared', async () => {
      useAuthStore.setState({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
        displayName: '小明',
        phone: '+8613800138000',
        isAuthenticated: true,
      });
      mocks.deleteAccountApi.mockResolvedValue(undefined);

      await expect(deleteAccount('123456')).resolves.toBeUndefined();

      expect(mocks.deleteAccountApi).toHaveBeenCalledWith({
        deleteAccountRequest: { code: '123456' },
      });
      const state = useAuthStore.getState();
      expect(state.accountId).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('error path: SDK rejects → clearSession STILL called (per plan finally block)', async () => {
      useAuthStore.setState({
        accountId: 1,
        accessToken: 'a',
        refreshToken: 'r',
        displayName: '小明',
        phone: '+8613800138000',
        isAuthenticated: true,
      });
      mocks.deleteAccountApi.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );

      await expect(deleteAccount('123456')).rejects.toBeInstanceOf(ResponseError);

      // finally block guarantees clearSession runs even on error.
      const state = useAuthStore.getState();
      expect(state.accountId).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('429 also clears session (server has not yet anonymized — but UI loses confidence)', async () => {
      useAuthStore.setState({ accessToken: 'a', isAuthenticated: true });
      mocks.deleteAccountApi.mockRejectedValue(
        new ResponseError(new Response(null, { status: 429 })),
      );
      await expect(deleteAccount('123456')).rejects.toBeInstanceOf(ResponseError);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('requestCancelDeletionSmsCode (spec C T1 / FR-006 anonymous path)', () => {
    it('happy: SDK resolves void → wrapper resolves void', async () => {
      mocks.sendCancelDeletionCode.mockResolvedValue(undefined);
      await expect(requestCancelDeletionSmsCode('+8613800138000')).resolves.toBeUndefined();
      expect(mocks.sendCancelDeletionCode).toHaveBeenCalledWith({
        sendCancelDeletionCodeRequest: { phone: '+8613800138000' },
      });
    });

    it('429 re-thrown — store unchanged (anonymous endpoint, no auth state)', async () => {
      mocks.sendCancelDeletionCode.mockRejectedValue(
        new ResponseError(new Response(null, { status: 429 })),
      );
      await expect(requestCancelDeletionSmsCode('+8613800138000')).rejects.toBeInstanceOf(
        ResponseError,
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('cancelDeletion (spec C T1 / FR-019 setSession + loadProfile chaining)', () => {
    it('happy: cancel succeeds + getMe succeeds → both session and profile written', async () => {
      mocks.cancelDeletionApi.mockResolvedValue({
        accountId: 7,
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      mocks.getMe.mockResolvedValue({
        accountId: 7,
        phone: '+8613800138000',
        displayName: '小明',
        status: 'ACTIVE',
        createdAt: '2026-05-05T00:00:00Z',
      });

      await cancelDeletion('+8613800138000', '123456');

      expect(mocks.cancelDeletionApi).toHaveBeenCalledWith({
        cancelDeletionRequest: { phone: '+8613800138000', code: '123456' },
      });
      const state = useAuthStore.getState();
      expect(state.accountId).toBe(7);
      expect(state.accessToken).toBe('access');
      expect(state.refreshToken).toBe('refresh');
      expect(state.isAuthenticated).toBe(true);
      expect(state.displayName).toBe('小明');
      expect(state.phone).toBe('+8613800138000');
    });

    it('cancel throws on incomplete session response → store unchanged', async () => {
      mocks.cancelDeletionApi.mockResolvedValue({ accountId: 7 });
      await expect(cancelDeletion('+8613800138000', '123456')).rejects.toThrow(
        /incomplete session/i,
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('cancel rejects (401 reverse-enum) → store unchanged, error propagates', async () => {
      mocks.cancelDeletionApi.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );
      await expect(cancelDeletion('+8613800138000', '123456')).rejects.toBeInstanceOf(
        ResponseError,
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
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
        phone: '+8613800138000',
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
      expect(state.phone).toBe('+8613800138000');
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
