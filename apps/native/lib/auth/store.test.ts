import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Force web path in storage.ts so persist uses happy-dom's localStorage.
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import { useAuthStore } from '@nvy/auth';

const PERSIST_KEY = 'nvy-auth';

// Wait for zustand/persist async flush (storage adapter is async).
async function flushPersist(): Promise<void> {
  // Two microtask + macrotask boundaries cover createJSONStorage promise chain.
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  await Promise.resolve();
}

describe('useAuthStore — displayName field (T1 / FR-002)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({
      accountId: null,
      accessToken: null,
      refreshToken: null,
      displayName: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('initial displayName === null', () => {
    expect(useAuthStore.getState().displayName).toBeNull();
  });

  it('setDisplayName("小明") writes to state', () => {
    useAuthStore.getState().setDisplayName('小明');
    expect(useAuthStore.getState().displayName).toBe('小明');
  });

  it('setDisplayName(null) clears state', () => {
    useAuthStore.getState().setDisplayName('小明');
    useAuthStore.getState().setDisplayName(null);
    expect(useAuthStore.getState().displayName).toBeNull();
  });

  it('clearSession synchronously clears displayName along with tokens', () => {
    useAuthStore.getState().setSession({
      accountId: 1,
      accessToken: 'a',
      refreshToken: 'r',
    });
    useAuthStore.getState().setDisplayName('小明');
    expect(useAuthStore.getState().displayName).toBe('小明');

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.accountId).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.displayName).toBeNull();
  });

  it('persist whitelist includes displayName (serialized to localStorage)', async () => {
    useAuthStore.getState().setSession({
      accountId: 1,
      accessToken: 'a',
      refreshToken: 'r',
    });
    useAuthStore.getState().setDisplayName('小明');
    await flushPersist();

    const raw = window.localStorage.getItem(PERSIST_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { state: { displayName?: string | null } };
    expect(parsed.state.displayName).toBe('小明');
  });
});
