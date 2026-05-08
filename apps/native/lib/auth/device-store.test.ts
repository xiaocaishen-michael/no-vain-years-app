import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Force web path so persist uses happy-dom localStorage (no native SecureStore).
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));
vi.mock('expo-device', () => ({
  deviceName: 'Test iPhone',
  DeviceType: { PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 },
  deviceType: 1, // PHONE
}));

import { useDeviceStore } from '@nvy/auth';

const PERSIST_KEY = 'nvy.device_id';

async function flushPersist(): Promise<void> {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  await Promise.resolve();
}

function clearStore(): void {
  window.localStorage.clear();
  useDeviceStore.setState({
    deviceId: null,
    deviceName: null,
    deviceType: null,
    hasHydrated: false,
  });
}

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('useDeviceStore — UUID generation', () => {
  beforeEach(clearStore);
  afterEach(() => window.localStorage.clear());

  it('should_generate_uuid_v4_on_first_initialize_when_not_persisted', async () => {
    await useDeviceStore.getState().initialize();
    const { deviceId } = useDeviceStore.getState();
    expect(deviceId).toMatch(UUID_V4_PATTERN);
  });

  it('should_persist_device_id_to_localStorage_on_initialize', async () => {
    await useDeviceStore.getState().initialize();
    await flushPersist();
    const raw = window.localStorage.getItem(PERSIST_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? '{}') as { state?: { deviceId?: string } };
    expect(parsed.state?.deviceId).toMatch(UUID_V4_PATTERN);
  });

  it('should_be_idempotent_when_initialize_called_twice', async () => {
    await useDeviceStore.getState().initialize();
    const firstId = useDeviceStore.getState().deviceId;
    await useDeviceStore.getState().initialize();
    expect(useDeviceStore.getState().deviceId).toBe(firstId);
  });
});

describe('useDeviceStore — web platform', () => {
  beforeEach(clearStore);
  afterEach(() => window.localStorage.clear());

  it('should_set_deviceName_null_on_web', async () => {
    await useDeviceStore.getState().initialize();
    expect(useDeviceStore.getState().deviceName).toBeNull();
  });

  it('should_set_deviceType_WEB_on_web', async () => {
    await useDeviceStore.getState().initialize();
    expect(useDeviceStore.getState().deviceType).toBe('WEB');
  });
});
