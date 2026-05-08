// High-level auth use cases consumed by UI code.
//
// Each helper wraps a typed @nvy/api-client call, then writes the result back
// to the Zustand store. UI code should never call api-client directly for
// auth flows — use these so token persistence stays in one place.

import {
  ApiClientError,
  getAccountAuthApi,
  getAccountDeletionApi,
  getAccountProfileApi,
  getAuthApi,
  getCancelDeletionApi,
  getDeviceManagementApi,
  ResponseError,
  setDeviceGetter,
  setDeviceNameGetter,
  setDeviceTypeGetter,
  setTokenGetter,
  setTokenRefresher,
} from '@nvy/api-client';

import { useDeviceStore } from './device-store';
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
//
// 末尾 await loadProfile() 拉 displayName 写入 store，使 AuthGate 三态决策
// 在同一异步流内拿到一致 state（FR-004）。loadProfile 失败被 swallow，store
// 保持 displayName === null，AuthGate fallback 到 /(app)/onboarding（FR-001）。
//
// 反枚举不变性（SC-003）：本函数体不读取 response.displayName — displayName
// 仅由 loadProfile 经独立 GET /me 写入，phoneSmsAuth 响应不暴露该字段。
export async function phoneSmsAuth(phone: string, code: string): Promise<LoginResult> {
  const response = await getAccountAuthApi().phoneSmsAuth({
    phoneSmsAuthRequest: { phone, code },
  });
  const session = assertSession(response);
  useAuthStore.getState().setSession(session);
  await loadProfile().catch(() => {
    /* swallow: AuthGate fallback to /(app)/onboarding when displayName stays null */
  });
  return session;
}

// Reads the authenticated user's profile and writes displayName + phone to
// the store. 401 from /me means the refresh middleware exhausted retries —
// re-thrown so callers can drop session / redirect to login. Network errors
// also re-thrown (callers like phoneSmsAuth swallow to keep login flow
// resilient).
//
// phone (per account-settings-shell spec / plan 决策 1): server returns the
// caller's E.164 raw phone in /me; we mirror it into the store so the 账号
// 与安全 page can render maskPhone() without a roundtrip. Absent on response
// → null (only ANONYMIZED rows lack phone, gated upstream by FR-009).
export async function loadProfile(): Promise<void> {
  const response = await getAccountProfileApi().getMe();
  useAuthStore.getState().setDisplayName(response.displayName ?? null);
  useAuthStore.getState().setPhone(response.phone ?? null);
}

// Updates displayName via PATCH /me. Server returns the canonical profile;
// store is written only on 2xx — 400 / 429 / network errors propagate to the
// caller (the onboarding form maps them to user-visible toasts).
export async function updateDisplayName(name: string): Promise<void> {
  const response = await getAccountProfileApi().patchMe({
    updateDisplayNameRequest: { displayName: name },
  });
  useAuthStore.getState().setDisplayName(response.displayName ?? null);
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

// -----------------------------------------------------------------------------
// Account deletion / cancellation (spec C — delete-account + cancel-deletion UI)
// -----------------------------------------------------------------------------

// Fires the SMS code for the authenticated 注销账号 flow. Server scope:
// caller's own active session — Bearer auto-injected by client interceptor.
// No store mutation.
export async function requestDeleteAccountSmsCode(): Promise<void> {
  await getAccountDeletionApi().sendCode1();
}

// Submits the deletion confirmation code. Server transitions the account to
// FROZEN and revokes all tokens; on SUCCESS we clear the local session
// (server's revoke is authoritative). On ERROR we INTENTIONALLY KEEP the
// session so handleSubmit's catch can render mapDeletionError → setErrorMsg
// ("验证码错误" / "操作太频繁") and the user can retry — clearing here would
// trigger AuthGate to /(auth)/login before the React render cycle that paints
// the error,leaving the UI silent (the bug behavior surfaced during dev:
// user enters wrong code → 401 INVALID_DELETION_CODE → finally clearSession
// → AuthGate kicks to login → user sees no error,thinks click did nothing).
//
// Token-expiry 401 (not business INVALID_DELETION_CODE) is handled separately
// by the api-client 401 middleware (single-flight refresh + retry once); if
// refresh ALSO fails refreshTokenFlow's own catch already clears the session
// for us. So this function is safe to keep token on every other error path.
export async function deleteAccount(code: string): Promise<void> {
  await getAccountDeletionApi()._delete({
    deleteAccountRequest: { code },
  });
  useAuthStore.getState().clearSession();
}

// Anonymous endpoint: sends SMS code to the supplied phone for cancel-deletion.
// No Bearer token needed — caller is unauthenticated (FROZEN account, in
// freeze period). Server reverse-enumerates errors so all failure modes look
// the same to the client.
export async function requestCancelDeletionSmsCode(phone: string): Promise<void> {
  await getCancelDeletionApi().sendCode({
    sendCancelDeletionCodeRequest: { phone },
  });
}

// Anonymous endpoint: submits the cancel-deletion confirmation. On success
// server flips the account back to ACTIVE and returns a fresh LoginResponse.
// We mirror phoneSmsAuth's setSession + loadProfile chain so the UI lands on
// the home screen with displayName + phone in the store (per FR-019).
export async function cancelDeletion(phone: string, code: string): Promise<LoginResult> {
  const response = await getCancelDeletionApi().cancel({
    cancelDeletionRequest: { phone, code },
  });
  const session = assertSession(response);
  useAuthStore.getState().setSession(session);
  await loadProfile().catch(() => {
    /* swallow: AuthGate fallback handles displayName === null */
  });
  return session;
}

// Wires the api-client interceptors against this store. Call once at app boot
// (root _layout). Idempotent — safe to call from React mount.
export function registerAuthInterceptor(): void {
  setTokenGetter(() => useAuthStore.getState().accessToken);
  setTokenRefresher(async () => {
    await refreshTokenFlow();
  });
  setDeviceGetter(() => useDeviceStore.getState().deviceId);
  setDeviceNameGetter(() => useDeviceStore.getState().deviceName);
  setDeviceTypeGetter(() => useDeviceStore.getState().deviceType);
}

// -----------------------------------------------------------------------------
// Device management wrappers (spec M1.X — device-management UI)
// -----------------------------------------------------------------------------

export interface DeviceItem {
  id: number;
  deviceId: string | null;
  deviceName: string | null;
  deviceType: 'PHONE' | 'TABLET' | 'DESKTOP' | 'WEB' | 'UNKNOWN';
  location: string | null;
  loginMethod: 'PHONE_SMS' | 'GOOGLE' | 'APPLE' | 'WECHAT';
  lastActiveAt: string; // ISO-8601
  isCurrent: boolean;
}

export interface DeviceListResult {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  items: DeviceItem[];
}

export async function listDevices(page: number, size: number): Promise<DeviceListResult> {
  const response = await getDeviceManagementApi().list({ page, size });
  return {
    page: response.page ?? page,
    size: response.size ?? size,
    totalElements: response.totalElements ?? 0,
    totalPages: response.totalPages ?? 0,
    items: (response.items ?? []).map((item) => ({
      id: item.id!,
      deviceId: item.deviceId ?? null,
      deviceName: item.deviceName ?? null,
      deviceType: (item.deviceType as DeviceItem['deviceType']) ?? 'UNKNOWN',
      location: item.location ?? null,
      loginMethod: (item.loginMethod as DeviceItem['loginMethod']) ?? 'PHONE_SMS',
      lastActiveAt: item.lastActiveAt?.toISOString() ?? '',
      isCurrent: item.isCurrent ?? false,
    })),
  };
}

export async function revokeDevice(recordId: number): Promise<void> {
  await getDeviceManagementApi().revoke({ recordId });
}

export { ApiClientError, ResponseError };
