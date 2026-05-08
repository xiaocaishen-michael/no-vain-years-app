import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { ApiClientError, ResponseError } from '@nvy/api-client';

import { deviceErrorCopy, mapDeviceError } from './device-errors';

describe('deviceErrorCopy', () => {
  it('session_expired copy', () => {
    expect(deviceErrorCopy('session_expired')).toBe('会话已失效，请重新登录');
  });
  it('frozen copy', () => {
    expect(deviceErrorCopy('frozen')).toBe('账号已冻结，请联系客服');
  });
  it('not_found copy', () => {
    expect(deviceErrorCopy('not_found')).toBe('该设备不存在或已被移除');
  });
  it('cannot_remove_current copy', () => {
    expect(deviceErrorCopy('cannot_remove_current')).toBe('当前设备请通过『退出登录』移除');
  });
  it('rate_limit copy', () => {
    expect(deviceErrorCopy('rate_limit')).toBe('操作太频繁，请稍后再试');
  });
  it('network copy', () => {
    expect(deviceErrorCopy('network')).toBe('网络错误，请重试');
  });
  it('unknown copy', () => {
    expect(deviceErrorCopy('unknown')).toBe('发生未知错误');
  });
});

describe('mapDeviceError — ApiClientError wrapper', () => {
  it('401 → session_expired', () => {
    expect(mapDeviceError(new ApiClientError(401, { code: 'UNAUTHORIZED' }))).toBe(
      'session_expired',
    );
  });
  it('403 ACCOUNT_IN_FREEZE_PERIOD → frozen', () => {
    expect(mapDeviceError(new ApiClientError(403, { code: 'ACCOUNT_IN_FREEZE_PERIOD' }))).toBe(
      'frozen',
    );
  });
  it('404 DEVICE_NOT_FOUND → not_found', () => {
    expect(mapDeviceError(new ApiClientError(404, { code: 'DEVICE_NOT_FOUND' }))).toBe('not_found');
  });
  it('409 CANNOT_REMOVE_CURRENT_DEVICE → cannot_remove_current', () => {
    expect(mapDeviceError(new ApiClientError(409, { code: 'CANNOT_REMOVE_CURRENT_DEVICE' }))).toBe(
      'cannot_remove_current',
    );
  });
  it('429 RATE_LIMITED → rate_limit', () => {
    expect(mapDeviceError(new ApiClientError(429, { code: 'RATE_LIMITED' }))).toBe('rate_limit');
  });
  it('500 → network', () => {
    expect(mapDeviceError(new ApiClientError(500, { code: 'INTERNAL_SERVER_ERROR' }))).toBe(
      'network',
    );
  });
  it('unknown code → unknown', () => {
    expect(mapDeviceError(new ApiClientError(400, { code: 'SOMETHING_ELSE' }))).toBe('unknown');
  });
});

describe('mapDeviceError — ResponseError wrapper', () => {
  function makeResponseError(status: number): ResponseError {
    return new ResponseError(new Response(null, { status }));
  }

  it('401 ResponseError → session_expired', () => {
    expect(mapDeviceError(makeResponseError(401))).toBe('session_expired');
  });
  it('404 ResponseError → not_found', () => {
    expect(mapDeviceError(makeResponseError(404))).toBe('not_found');
  });
  it('500 ResponseError → network', () => {
    expect(mapDeviceError(makeResponseError(500))).toBe('network');
  });
});

describe('mapDeviceError — network / unknown', () => {
  it('TypeError (network error) → network', () => {
    expect(mapDeviceError(new TypeError('Failed to fetch'))).toBe('network');
  });
  it('non-Error value → unknown', () => {
    expect(mapDeviceError('some string')).toBe('unknown');
  });
});
