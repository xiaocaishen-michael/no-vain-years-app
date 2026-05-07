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

import { mapCancelDeletionError } from '../cancel-deletion-errors';

describe('mapCancelDeletionError (spec C T8 / FR-020 反枚举)', () => {
  it('429 → rate_limit', () => {
    const e = new ResponseError(new Response(null, { status: 429 }));
    expect(mapCancelDeletionError(e).kind).toBe('rate_limit');
  });

  it('5xx → network', () => {
    expect(
      mapCancelDeletionError(new ResponseError(new Response(null, { status: 500 }))).kind,
    ).toBe('network');
    expect(
      mapCancelDeletionError(new ResponseError(new Response(null, { status: 503 }))).kind,
    ).toBe('network');
  });

  it('FR-020 反枚举 — 401 / 403 / 404 / 400 全部 collapse 到 invalid_credentials', () => {
    expect(
      mapCancelDeletionError(new ResponseError(new Response(null, { status: 401 }))).kind,
    ).toBe('invalid_credentials');
    expect(
      mapCancelDeletionError(new ResponseError(new Response(null, { status: 403 }))).kind,
    ).toBe('invalid_credentials');
    expect(
      mapCancelDeletionError(new ResponseError(new Response(null, { status: 404 }))).kind,
    ).toBe('invalid_credentials');
    expect(
      mapCancelDeletionError(new ResponseError(new Response(null, { status: 400 }))).kind,
    ).toBe('invalid_credentials');
  });

  it('FetchError → network', () => {
    expect(mapCancelDeletionError(new FetchError(new Error('socket'))).kind).toBe('network');
  });

  it('ApiClientError 4xx → invalid_credentials (反枚举)', () => {
    expect(
      mapCancelDeletionError(new ApiClientError(401, { code: 'PHONE_NOT_REGISTERED' })).kind,
    ).toBe('invalid_credentials');
    expect(
      mapCancelDeletionError(new ApiClientError(403, { code: 'ACCOUNT_ANONYMIZED' })).kind,
    ).toBe('invalid_credentials');
    expect(mapCancelDeletionError(new ApiClientError(404, { code: 'ANY_CODE' })).kind).toBe(
      'invalid_credentials',
    );
  });

  it('ApiClientError 429 → rate_limit; 5xx → network', () => {
    expect(mapCancelDeletionError(new ApiClientError(429, { code: 'RL' })).kind).toBe('rate_limit');
    expect(mapCancelDeletionError(new ApiClientError(503, { code: 'X' })).kind).toBe('network');
  });

  it('non-Error / null / undefined → unknown', () => {
    expect(mapCancelDeletionError('string').kind).toBe('unknown');
    expect(mapCancelDeletionError(null).kind).toBe('unknown');
    expect(mapCancelDeletionError(undefined).kind).toBe('unknown');
    expect(mapCancelDeletionError(new Error('plain')).kind).toBe('unknown');
  });
});
