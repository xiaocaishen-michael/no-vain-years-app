import { describe, expect, it, vi } from 'vitest';

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
  return { ResponseError, FetchError, ApiClientError };
});

import { ApiClientError, FetchError, ResponseError } from '@nvy/api-client';

import { mapDeletionError } from '../delete-account-errors';

describe('mapDeletionError (spec C T3 / FR-009 — error mapping covering US3 acceptance 1-3)', () => {
  it('429 → rate_limit', () => {
    const e = new ResponseError(new Response(null, { status: 429 }));
    expect(mapDeletionError(e).kind).toBe('rate_limit');
  });

  it('401 → invalid_code (per US3 acceptance 2 — submit-side INVALID_DELETION_CODE)', () => {
    const e = new ResponseError(new Response(null, { status: 401 }));
    expect(mapDeletionError(e).kind).toBe('invalid_code');
  });

  it('5xx → network', () => {
    const e = new ResponseError(new Response(null, { status: 503 }));
    expect(mapDeletionError(e).kind).toBe('network');
  });

  it('FetchError → network', () => {
    const e = new FetchError(new Error('socket'));
    expect(mapDeletionError(e).kind).toBe('network');
  });

  it('ApiClientError 429 → rate_limit', () => {
    const e = new ApiClientError(429, { code: 'RATE_LIMITED' });
    expect(mapDeletionError(e).kind).toBe('rate_limit');
  });

  it('ApiClientError 5xx → network', () => {
    const e = new ApiClientError(500, { code: 'INTERNAL_ERROR' });
    expect(mapDeletionError(e).kind).toBe('network');
  });

  it('unknown error → unknown', () => {
    const e = new Error('???');
    expect(mapDeletionError(e).kind).toBe('unknown');
  });

  it('non-Error value → unknown', () => {
    expect(mapDeletionError('string').kind).toBe('unknown');
    expect(mapDeletionError(null).kind).toBe('unknown');
    expect(mapDeletionError(undefined).kind).toBe('unknown');
  });
});
