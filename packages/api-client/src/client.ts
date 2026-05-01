// Thin fetch wrapper used by @nvy/api-client consumers.
//
// Responsibilities:
// 1. Resolve base URL from EXPO_PUBLIC_API_BASE_URL (or default to prod).
// 2. Inject Authorization: Bearer <accessToken> from @nvy/auth store.
// 3. Encode JSON Content-Type when a body is present.
// 4. Surface server `application/problem+json` errors as ApiClientError.
//
// 401 → refresh-token + retry is intentionally NOT implemented here yet —
// it lands in Phase 4 alongside the refresh-token use case so we don't ship
// half-wired interceptors.

import { useAuthStore } from '@nvy/auth';

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

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init?.headers);
  if (token !== null) {
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
