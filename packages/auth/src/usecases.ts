// High-level auth use cases consumed by UI code.
//
// Each helper wraps a typed @nvy/api-client call, then writes the result back
// to the Zustand store. UI code should never call api-client directly for
// auth flows — use these so token persistence stays in one place.

import {
  ApiClientError,
  getAccountAuthApi,
  getAuthApi,
  ResponseError,
  setTokenGetter,
  setTokenRefresher,
} from '@nvy/api-client';

import { useAuthStore } from './store';

export interface LoginResult {
  accountId: number;
  accessToken: string;
  refreshToken: string;
}

function assertSession(value: {
  accountId?: number;
  accessToken?: string;
  refreshToken?: string;
}): LoginResult {
  if (
    value.accountId === undefined ||
    value.accessToken === undefined ||
    value.refreshToken === undefined
  ) {
    throw new Error('Server returned incomplete session');
  }
  return {
    accountId: value.accountId,
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
  };
}

// Unified phone-SMS auth wrapper (per ADR-0016 client-facing API).
// Server unified endpoint POST /api/v1/accounts/phone-sms-auth: client 视角
// 不区分 login / register, server 内部按 phone 状态自动分支
// (已注册→login / 未注册→自动创建+login / FROZEN/ANONYMIZED→反枚举吞).
export async function phoneSmsAuth(phone: string, code: string): Promise<LoginResult> {
  const response = await getAccountAuthApi().phoneSmsAuth({
    phoneSmsAuthRequest: { phone, code },
  });
  const session = assertSession(response);
  useAuthStore.getState().setSession(session);
  return session;
}

// Refreshes the access token using the persisted refresh token. Rotates the
// refresh token (server-side policy). On any failure we clear the session so
// the UI surfaces a logged-out state — the 401 middleware in api-client relies
// on that for clean redirect behavior.
export async function refreshTokenFlow(): Promise<LoginResult> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (refreshToken === null) {
    throw new Error('No refresh token in store');
  }
  try {
    const response = await getAuthApi().refreshToken({
      refreshTokenRequest: { refreshToken },
    });
    const session = assertSession(response);
    useAuthStore.getState().setSession(session);
    return session;
  } catch (err) {
    useAuthStore.getState().clearSession();
    throw err;
  }
}

export async function logoutAll(): Promise<void> {
  try {
    await getAuthApi().logoutAll();
  } finally {
    // Whether the server revoke succeeds or not, we drop local state so the
    // UI returns to logged-out. A failed call leaves zombie tokens server-side
    // but they expire on their own; cleanup happens at next login.
    useAuthStore.getState().clearSession();
  }
}

// Local-only logout — clears tokens without calling the server. Use when the
// user wants to "log out of this device only".
export function logoutLocal(): void {
  useAuthStore.getState().clearSession();
}

// Wires the api-client interceptors against this store. Call once at app boot
// (root _layout). Idempotent — safe to call from React mount.
export function registerAuthInterceptor(): void {
  setTokenGetter(() => useAuthStore.getState().accessToken);
  setTokenRefresher(async () => {
    await refreshTokenFlow();
  });
}

export { ApiClientError, ResponseError };
