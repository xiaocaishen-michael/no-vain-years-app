// Companion to delete-account.tsx — error mapping for the deletion flow.
//
// Maps SDK errors (ResponseError / FetchError / ApiClientError / unknown) to
// user-visible toast strings. Single source of truth for the strings is the
// COPY constant in delete-account.tsx; this file just decides which COPY key
// applies. State machine wiring + cooldown/race guards land in T3 / T4.

import { ApiClientError, FetchError, ResponseError } from '@nvy/api-client';

export type DeletionErrorKind = 'rate_limit' | 'invalid_code' | 'network' | 'unknown';

export interface MappedDeletionError {
  kind: DeletionErrorKind;
}

export function mapDeletionError(e: unknown): MappedDeletionError {
  if (e instanceof ResponseError) {
    const status = e.response.status;
    if (status === 429) return { kind: 'rate_limit' };
    if (status === 401) return { kind: 'invalid_code' };
    if (status >= 500) return { kind: 'network' };
    return { kind: 'unknown' };
  }
  if (e instanceof FetchError) {
    return { kind: 'network' };
  }
  if (e instanceof ApiClientError) {
    if (e.status === 429) return { kind: 'rate_limit' };
    if (e.status === 401) return { kind: 'invalid_code' };
    if (e.status >= 500) return { kind: 'network' };
    return { kind: 'unknown' };
  }
  return { kind: 'unknown' };
}
