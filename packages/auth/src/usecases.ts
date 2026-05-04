// High-level auth use cases consumed by UI code.
//
// Each helper wraps a typed @nvy/api-client call, then writes the result back
// to the Zustand store. UI code should never call api-client directly for
// auth flows — use these so token persistence stays in one place.

import {
  ApiClientError,
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

// Unified phone-SMS auth wrapper (per ADR-0016 client-facing API):
// client 视角不区分 login / register; server unified endpoint 落地后内部分支
// (已注册→login / 未注册→自动创建+login).
//
// PHASE 1 (per ADR-0017): 过渡期内部仍调既有 loginByPhoneSms endpoint
// (已注册号 happy / 未注册号反枚举 401, 不支持自动注册). server unified
// endpoint 落地后, 改本函数一行: getAuthApi().loginByPhoneSms(...) →
// getAccountAuthApi().phoneSmsAuth(...) + 请求体 key 名调整. 调用方代码 0 改动.
export async function phoneSmsAuth(phone: string, code: string): Promise<LoginResult> {
  const response = await getAuthApi().loginByPhoneSms({
    loginByPhoneSmsRequest: { phone, code },
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
