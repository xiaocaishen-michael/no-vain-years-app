// Companion to cancel-deletion.tsx — error mapping for the cancel-deletion
// flow.
//
// Per FR-020 反枚举: cancel-deletion endpoints (sendCancelDeletionCode +
// cancel) MUST collapse all 4xx error responses to a single user-visible
// message ("凭证或验证码无效") regardless of underlying server code (phone
// not registered / account already anonymized / invalid SMS / etc). The
// invariant is enforced server-side per spec D; this file mirrors the
// invariant client-side so a future server drift cannot leak account state
// through differential UI feedback.

import { ApiClientError, FetchError, ResponseError } from '@nvy/api-client';

export type CancelDeletionErrorKind = 'rate_limit' | 'invalid_credentials' | 'network' | 'unknown';

export interface MappedCancelDeletionError {
  kind: CancelDeletionErrorKind;
}

export function mapCancelDeletionError(e: unknown): MappedCancelDeletionError {
  if (e instanceof ResponseError) {
    const status = e.response.status;
    if (status === 429) return { kind: 'rate_limit' };
    if (status >= 500) return { kind: 'network' };
    // 401 / 403 / 404 / 400 — all collapse to invalid_credentials per FR-020.
    if (status >= 400) return { kind: 'invalid_credentials' };
    return { kind: 'unknown' };
  }
  if (e instanceof FetchError) {
    return { kind: 'network' };
  }
  if (e instanceof ApiClientError) {
    if (e.status === 429) return { kind: 'rate_limit' };
    if (e.status >= 500) return { kind: 'network' };
    if (e.status >= 400) return { kind: 'invalid_credentials' };
    return { kind: 'unknown' };
  }
  return { kind: 'unknown' };
}
