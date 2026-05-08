// Device identity (Zustand) + persistent device_id.
//
// Per device-management spec FR-006:
// - deviceId: UUID v4 generated once on first launch, persisted across restarts.
// - deviceName / deviceType: probed from expo-device on native; null/'WEB' on web.
//
// Storage: same secure-store / localStorage adapter as auth store (per app
// CLAUDE.md § 一 Storage 安全纪律 — device_id is treated as sensitive).

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { sessionStorage } from './storage';

export type DeviceType = 'PHONE' | 'TABLET' | 'DESKTOP' | 'WEB' | 'UNKNOWN';

export interface DeviceState {
  deviceId: string | null;
  deviceName: string | null;
  deviceType: DeviceType | null;
  hasHydrated: boolean;
  initialize: () => Promise<void>;
}

function resolveDeviceType(): DeviceType {
  if (Platform.OS === 'web') return 'WEB';
  if (Device.deviceType === Device.DeviceType.TABLET) return 'TABLET';
  if (Device.deviceType === Device.DeviceType.PHONE) return 'PHONE';
  if (Device.deviceType === Device.DeviceType.DESKTOP) return 'DESKTOP';
  return 'UNKNOWN';
}

// crypto.randomUUID is available in modern RN (Hermes 0.74+) and all
// browsers we target. Fallback retained for older runtimes (RFC 4122 v4).
function generateUuidV4(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // RFC 4122 v4 fallback — uses Math.random; cryptographically weaker but
  // device_id is not a security-critical secret.
  const hex = '0123456789abcdef';
  const seq = Array.from({ length: 36 }, (_, i) => {
    if (i === 8 || i === 13 || i === 18 || i === 23) return '-';
    if (i === 14) return '4';
    if (i === 19) return hex[8 + Math.floor(Math.random() * 4)] ?? '8';
    return hex[Math.floor(Math.random() * 16)] ?? '0';
  });
  return seq.join('');
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      deviceId: null,
      deviceName: null,
      deviceType: null,
      hasHydrated: false,
      initialize: async () => {
        if (get().deviceId !== null) return;
        set({
          deviceId: generateUuidV4(),
          deviceName: Platform.OS === 'web' ? null : (Device.deviceName ?? null),
          deviceType: resolveDeviceType(),
        });
      },
    }),
    {
      name: 'nvy.device_id',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        deviceId: state.deviceId,
        deviceName: state.deviceName,
        deviceType: state.deviceType,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    },
  ),
);
