// HTTP client for @nvy/api-client.
//
// Two surfaces:
// 1. Typed APIs from generated/ (preferred) — `getAuthApi()` / `getAccountSmsCodeApi()`
// 2. Low-level helpers (`apiFetch` / `apiJson`) — for paths not covered by the OpenAPI spec.
//
// Both share the same Configuration: base URL from env, Authorization header
// pulled from a registered token getter, and a 401 middleware that
// single-flights a refresh-token call before retrying once.
//
// Token getter / refresher are registered by @nvy/auth at app boot. We
// deliberately don't import @nvy/auth here — auth already imports api-client
// (for typed APIs in usecases.ts), so the dependency must flow one way.

import { Platform } from 'react-native';

import { AccountAuthControllerApi } from './generated/apis/AccountAuthControllerApi';
import { AccountDeletionControllerApi } from './generated/apis/AccountDeletionControllerApi';
import { AccountProfileControllerApi } from './generated/apis/AccountProfileControllerApi';
import { AccountSmsCodeControllerApi } from './generated/apis/AccountSmsCodeControllerApi';
import { AuthControllerApi } from './generated/apis/AuthControllerApi';
import { CancelDeletionControllerApi } from './generated/apis/CancelDeletionControllerApi';
import { DeviceManagementControllerApi } from './generated/apis/DeviceManagementControllerApi';
import { Configuration, type Middleware, type ResponseContext } from './generated/runtime';

export const DEFAULT_BASE_URL = 'https://api.xiaocaishen.me';

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;
  public readonly traceId: string | undefined;

  constructor(status: number, body: ApiErrorBody) {
    const message = body.message ?? `HTTP ${status}`;
    super(message);
    this.name = 'ApiClientError';
    this.code = body.code ?? 'UNKNOWN_ERROR';
    this.status = status;
    this.details = body.details;
    this.traceId = body.traceId;
  }
}

function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL;
}

// -----------------------------------------------------------------------------
// Token plumbing — registered by @nvy/auth at app boot
// -----------------------------------------------------------------------------

type TokenGetter = () => string | null;
type TokenRefresher = () => Promise<void>;
type StringGetter = () => string | null;

let tokenGetter: TokenGetter = () => null;
let tokenRefresher: TokenRefresher | null = null;
let inflightRefresh: Promise<void> | null = null;

// -----------------------------------------------------------------------------
// Device plumbing — registered by @nvy/auth via registerAuthInterceptor
// -----------------------------------------------------------------------------

let deviceGetter: StringGetter = () => null;
let deviceNameGetter: StringGetter = () => null;
let deviceTypeGetter: StringGetter = () => null;

export function setDeviceGetter(fn: StringGetter): void {
  deviceGetter = fn;
}
export function setDeviceNameGetter(fn: StringGetter): void {
  deviceNameGetter = fn;
}
export function setDeviceTypeGetter(fn: StringGetter): void {
  deviceTypeGetter = fn;
}

export function setTokenGetter(fn: TokenGetter): void {
  tokenGetter = fn;
}

export function setTokenRefresher(fn: TokenRefresher | null): void {
  tokenRefresher = fn;
}

async function refreshOnce(): Promise<void> {
  if (tokenRefresher === null) {
    throw new Error('No token refresher registered');
  }
  if (inflightRefresh !== null) {
    return inflightRefresh;
  }
  inflightRefresh = tokenRefresher().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

// -----------------------------------------------------------------------------
// 401 → refresh → retry middleware
// -----------------------------------------------------------------------------
//
// On 401 we single-flight a refresh and retry the original request once.
// The retry is tagged with `x-nvy-retry` so a second 401 doesn't loop. If the
// refresher fails, the original 401 propagates so the UI can redirect to login
// (the refresher is responsible for clearing the auth store on terminal failures).

const REFRESH_PATH = '/api/v1/auth/refresh-token';
const RETRY_HEADER = 'x-nvy-retry';

const authMiddleware: Middleware = {
  async pre(context) {
    const headers = new Headers(context.init.headers);
    const token = tokenGetter();
    if (token !== null && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return { url: context.url, init: { ...context.init, headers } };
  },
  async post(context: ResponseContext) {
    const { response, url, init, fetch: contextFetch } = context;
    if (response.status !== 401) return;
    if (url.endsWith(REFRESH_PATH)) return;
    const headers = new Headers(init.headers);
    if (headers.has(RETRY_HEADER)) return;
    if (tokenRefresher === null) return;

    try {
      await refreshOnce();
    } catch {
      return;
    }

    const newToken = tokenGetter();
    if (newToken === null) return;
    headers.set('Authorization', `Bearer ${newToken}`);
    headers.set(RETRY_HEADER, '1');
    return contextFetch(url, { ...init, headers });
  },
};

// -----------------------------------------------------------------------------
// Device header middleware — runs after authMiddleware
// -----------------------------------------------------------------------------

const deviceMiddleware: Middleware = {
  async pre(context) {
    const headers = new Headers(context.init.headers);
    const deviceId = deviceGetter();
    if (deviceId !== null) headers.set('X-Device-Id', deviceId);
    // Always invoke deviceNameGetter / deviceTypeGetter so Metro retains the
    // module-level `let` declarations even when its web dead-code-elim removes
    // the non-web header branch below — otherwise the exported setters write
    // to an undeclared identifier and prod web bundle throws ReferenceError
    // (撞过 2026-05-10 CF Pages 部署 deploy:1).
    const deviceName = deviceNameGetter();
    const deviceType = deviceTypeGetter();
    if (Platform.OS !== 'web') {
      if (deviceName !== null) headers.set('X-Device-Name', deviceName);
      if (deviceType !== null) headers.set('X-Device-Type', deviceType);
    }
    return { url: context.url, init: { ...context.init, headers } };
  },
};

// Typed API factories
// -----------------------------------------------------------------------------

let cachedConfig: Configuration | null = null;

function getConfig(): Configuration {
  if (cachedConfig === null) {
    cachedConfig = new Configuration({
      basePath: getBaseUrl(),
      middleware: [authMiddleware, deviceMiddleware],
    });
  }
  return cachedConfig;
}

export function getAuthApi(): AuthControllerApi {
  return new AuthControllerApi(getConfig());
}

export function getAccountSmsCodeApi(): AccountSmsCodeControllerApi {
  return new AccountSmsCodeControllerApi(getConfig());
}

export function getAccountAuthApi(): AccountAuthControllerApi {
  return new AccountAuthControllerApi(getConfig());
}

export function getAccountProfileApi(): AccountProfileControllerApi {
  return new AccountProfileControllerApi(getConfig());
}

export function getAccountDeletionApi(): AccountDeletionControllerApi {
  return new AccountDeletionControllerApi(getConfig());
}

export function getCancelDeletionApi(): CancelDeletionControllerApi {
  return new CancelDeletionControllerApi(getConfig());
}

export function getDeviceManagementApi(): DeviceManagementControllerApi {
  return new DeviceManagementControllerApi(getConfig());
}

export function resetClientForTests(): void {
  cachedConfig = null;
  tokenGetter = () => null;
  tokenRefresher = null;
  inflightRefresh = null;
  deviceGetter = () => null;
  deviceNameGetter = () => null;
  deviceTypeGetter = () => null;
}

// -----------------------------------------------------------------------------
// Low-level fetch helpers (escape hatches for paths not in the OpenAPI spec)
// -----------------------------------------------------------------------------

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = tokenGetter();
  const headers = new Headers(init?.headers);
  if (token !== null && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getBaseUrl()}${path}`, { ...init, headers });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiClientError(response.status, body);
  }
  return response.json() as Promise<T>;
}
