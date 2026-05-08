import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));
vi.mock('expo-device', () => ({
  deviceName: null,
  DeviceType: { PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 },
  deviceType: null,
}));

const mocks = vi.hoisted(() => ({
  listApi: vi.fn(),
  revokeApi: vi.fn(),
}));

vi.mock('@nvy/api-client', () => {
  class ResponseError extends Error {
    public readonly response: Response;
    constructor(response: Response, message?: string) {
      super(message);
      this.name = 'ResponseError';
      this.response = response;
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
  return {
    getAccountAuthApi: () => ({ phoneSmsAuth: vi.fn() }),
    getAccountProfileApi: () => ({ getMe: vi.fn(), patchMe: vi.fn() }),
    getAuthApi: () => ({ refreshToken: vi.fn(), logoutAll: vi.fn() }),
    getAccountDeletionApi: () => ({ sendCode1: vi.fn(), _delete: vi.fn() }),
    getCancelDeletionApi: () => ({ sendCode: vi.fn(), cancel: vi.fn() }),
    getDeviceManagementApi: () => ({ list: mocks.listApi, revoke: mocks.revokeApi }),
    setTokenGetter: vi.fn(),
    setTokenRefresher: vi.fn(),
    setDeviceGetter: vi.fn(),
    setDeviceNameGetter: vi.fn(),
    setDeviceTypeGetter: vi.fn(),
    ResponseError,
    ApiClientError,
  };
});

import { ResponseError } from '@nvy/api-client';
import { listDevices, revokeDevice, useAuthStore } from '@nvy/auth';

const LAST_ACTIVE = new Date('2026-05-08T10:00:00Z');
const LAST_ACTIVE_ISO = '2026-05-08T10:00:00.000Z';

function makeDeviceItemResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    deviceId: 'uuid-abc-1234',
    deviceName: 'iPhone 15',
    deviceType: 'PHONE',
    location: '上海',
    loginMethod: 'PHONE_SMS',
    lastActiveAt: LAST_ACTIVE,
    isCurrent: true,
    ...overrides,
  };
}

describe('listDevices wrapper (T4)', () => {
  beforeEach(() => {
    mocks.listApi.mockReset();
    mocks.revokeApi.mockReset();
    useAuthStore.setState({
      accountId: null,
      accessToken: null,
      refreshToken: null,
      displayName: null,
      phone: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should_return_DeviceListResult_on_200', async () => {
    mocks.listApi.mockResolvedValue({
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
      items: [
        makeDeviceItemResponse({ isCurrent: true }),
        makeDeviceItemResponse({ id: 2, isCurrent: false }),
      ],
    });

    const result = await listDevices(0, 10);

    expect(mocks.listApi).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect(result.page).toBe(0);
    expect(result.size).toBe(10);
    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(2);

    const first = result.items[0]!;
    expect(first.id).toBe(1);
    expect(first.deviceId).toBe('uuid-abc-1234');
    expect(first.deviceName).toBe('iPhone 15');
    expect(first.deviceType).toBe('PHONE');
    expect(first.location).toBe('上海');
    expect(first.loginMethod).toBe('PHONE_SMS');
    expect(first.lastActiveAt).toBe(LAST_ACTIVE_ISO);
    expect(first.isCurrent).toBe(true);
  });

  it('should_handle_empty_items', async () => {
    mocks.listApi.mockResolvedValue({
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      items: [],
    });

    const result = await listDevices(0, 10);

    expect(result.totalElements).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('should_handle_null_optional_fields_in_item', async () => {
    mocks.listApi.mockResolvedValue({
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      items: [
        makeDeviceItemResponse({ deviceId: undefined, deviceName: undefined, location: undefined }),
      ],
    });

    const result = await listDevices(0, 10);
    const item = result.items[0]!;

    expect(item.deviceId).toBeNull();
    expect(item.deviceName).toBeNull();
    expect(item.location).toBeNull();
  });

  it('should_throw_when_api_returns_401', async () => {
    mocks.listApi.mockRejectedValue(new ResponseError(new Response(null, { status: 401 })));
    await expect(listDevices(0, 10)).rejects.toBeInstanceOf(ResponseError);
  });

  it('should_throw_when_api_returns_429', async () => {
    mocks.listApi.mockRejectedValue(new ResponseError(new Response(null, { status: 429 })));
    await expect(listDevices(0, 10)).rejects.toBeInstanceOf(ResponseError);
  });
});

describe('revokeDevice wrapper (T4)', () => {
  beforeEach(() => {
    mocks.listApi.mockReset();
    mocks.revokeApi.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should_complete_silently_on_200', async () => {
    mocks.revokeApi.mockResolvedValue(undefined);
    await expect(revokeDevice(42)).resolves.toBeUndefined();
    expect(mocks.revokeApi).toHaveBeenCalledWith({ recordId: 42 });
  });

  it('should_throw_when_api_returns_404_DEVICE_NOT_FOUND', async () => {
    mocks.revokeApi.mockRejectedValue(new ResponseError(new Response(null, { status: 404 })));
    await expect(revokeDevice(42)).rejects.toBeInstanceOf(ResponseError);
  });

  it('should_throw_when_api_returns_409_CANNOT_REMOVE_CURRENT', async () => {
    mocks.revokeApi.mockRejectedValue(new ResponseError(new Response(null, { status: 409 })));
    await expect(revokeDevice(42)).rejects.toBeInstanceOf(ResponseError);
  });

  it('should_throw_when_api_returns_429_RATE_LIMITED', async () => {
    mocks.revokeApi.mockRejectedValue(new ResponseError(new Response(null, { status: 429 })));
    await expect(revokeDevice(42)).rejects.toBeInstanceOf(ResponseError);
  });
});
