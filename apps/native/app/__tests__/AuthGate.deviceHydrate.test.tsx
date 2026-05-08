import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../global.css', () => ({}));

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  return {
    Text: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('span', null, children),
    View: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', null, children),
  };
});

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  authHasHydrated: true,
  deviceHasHydrated: false,
}));

vi.mock('@nvy/auth', () => {
  const useAuthStore = Object.assign(
    vi.fn((selector: (s: { isAuthenticated: boolean; displayName: string | null }) => unknown) =>
      selector({ isAuthenticated: false, displayName: null }),
    ),
    {
      persist: {
        hasHydrated: () => mocks.authHasHydrated,
        onFinishHydration: vi.fn(() => () => {}),
      },
    },
  );

  const useDeviceStore = Object.assign(
    vi.fn((selector: (s: { hasHydrated: boolean; deviceId: string | null }) => unknown) =>
      selector({ hasHydrated: mocks.deviceHasHydrated, deviceId: null }),
    ),
    {
      getState: () => ({ initialize: mocks.initialize }),
    },
  );

  return {
    registerAuthInterceptor: vi.fn(),
    useAuthStore,
    useDeviceStore,
  };
});

vi.mock('expo-router', () => ({
  Stack: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useNavigationContainerRef: () => ({
    isReady: () => true,
    addListener: vi.fn(() => vi.fn()),
  }),
  useRouter: () => ({ replace: vi.fn() }),
  useSegments: () => [],
}));

vi.mock('@tanstack/react-query', () => {
  class QueryClient {
    constructor(_options?: unknown) {}
  }
  return {
    QueryClient,
    QueryClientProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

vi.mock('../../lib/auth/auth-gate-decision', () => ({
  decideAuthRoute: () => ({ kind: 'noop' }),
}));

import RootLayout from '../_layout';

describe('AuthGate — device hydration (T8)', () => {
  beforeEach(() => {
    mocks.initialize.mockReset();
    mocks.initialize.mockResolvedValue(undefined);
    mocks.authHasHydrated = true;
    mocks.deviceHasHydrated = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('should_show_splash_until_device_hydrated', async () => {
    // auth hydrated, device NOT hydrated → must show splash
    mocks.deviceHasHydrated = false;

    await act(async () => {
      render(React.createElement(RootLayout));
    });

    expect(screen.getByText('加载中...')).toBeTruthy();
  });

  it('should_call_initialize_once_on_mount', async () => {
    mocks.deviceHasHydrated = true;

    await act(async () => {
      render(React.createElement(RootLayout));
    });

    expect(mocks.initialize).toHaveBeenCalledOnce();
  });

  it('should_not_show_splash_when_both_hydrated', async () => {
    mocks.deviceHasHydrated = true;

    await act(async () => {
      render(React.createElement(RootLayout));
    });

    expect(screen.queryByText('加载中...')).toBeNull();
  });
});
