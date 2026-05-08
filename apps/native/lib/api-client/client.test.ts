import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted; use vi.hoisted to share mutable state with it.
const platformMock = vi.hoisted(() => ({ OS: 'ios' as string }));
vi.mock('react-native', () => ({ Platform: platformMock }));

import {
  getAccountProfileApi,
  resetClientForTests,
  setDeviceGetter,
  setDeviceNameGetter,
  setDeviceTypeGetter,
} from '@nvy/api-client';

const PROFILE_BODY = JSON.stringify({ displayName: 'test', phone: null });

function mockOkFetch(): { capturedHeaders: Headers } {
  const capturedHeaders = new Headers();
  vi.spyOn(global, 'fetch').mockImplementation((_url, init) => {
    const h = new Headers(init?.headers);
    h.forEach((v, k) => capturedHeaders.set(k, v));
    return Promise.resolve(new Response(PROFILE_BODY, { status: 200 }));
  });
  return { capturedHeaders };
}

describe('deviceMiddleware — X-Device-Id', () => {
  beforeEach(() => {
    platformMock.OS = 'ios';
    resetClientForTests();
  });
  afterEach(() => vi.restoreAllMocks());

  it('should_inject_X-Device-Id_when_getter_returns_value', async () => {
    const { capturedHeaders } = mockOkFetch();
    setDeviceGetter(() => 'test-uuid-1234');
    await getAccountProfileApi().getMe();
    expect(capturedHeaders.get('x-device-id')).toBe('test-uuid-1234');
  });

  it('should_omit_X-Device-Id_when_getter_returns_null', async () => {
    const { capturedHeaders } = mockOkFetch();
    // deviceGetter defaults to () => null after reset
    await getAccountProfileApi().getMe();
    expect(capturedHeaders.get('x-device-id')).toBeNull();
  });
});

describe('deviceMiddleware — X-Device-Name / X-Device-Type', () => {
  beforeEach(() => resetClientForTests());
  afterEach(() => vi.restoreAllMocks());

  it('should_inject_X-Device-Name_and_Type_on_native', async () => {
    platformMock.OS = 'ios';
    const { capturedHeaders } = mockOkFetch();
    setDeviceGetter(() => 'uuid');
    setDeviceNameGetter(() => 'iPhone 15');
    setDeviceTypeGetter(() => 'PHONE');
    await getAccountProfileApi().getMe();
    expect(capturedHeaders.get('x-device-name')).toBe('iPhone 15');
    expect(capturedHeaders.get('x-device-type')).toBe('PHONE');
  });

  it('should_omit_X-Device-Name_on_web', async () => {
    platformMock.OS = 'web';
    resetClientForTests(); // recreate config with updated Platform
    const { capturedHeaders } = mockOkFetch();
    setDeviceGetter(() => 'uuid');
    setDeviceNameGetter(() => 'Web Browser');
    setDeviceTypeGetter(() => 'WEB');
    await getAccountProfileApi().getMe();
    expect(capturedHeaders.get('x-device-name')).toBeNull();
    expect(capturedHeaders.get('x-device-type')).toBeNull();
  });
});

describe('deviceMiddleware — runs after authMiddleware', () => {
  beforeEach(() => resetClientForTests());
  afterEach(() => vi.restoreAllMocks());

  it('should_have_both_authorization_and_device_headers', async () => {
    platformMock.OS = 'ios';
    resetClientForTests();
    const { capturedHeaders } = mockOkFetch();
    // Wire token getter so authMiddleware sets Authorization
    const { setTokenGetter } = await import('@nvy/api-client');
    setTokenGetter(() => 'bearer-token');
    setDeviceGetter(() => 'device-uuid');
    await getAccountProfileApi().getMe();
    expect(capturedHeaders.get('authorization')).toBe('Bearer bearer-token');
    expect(capturedHeaders.get('x-device-id')).toBe('device-uuid');
  });
});
