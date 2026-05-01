// Auth state (Zustand) + token persistence.
//
// Persist policy:
// - refreshToken + accountId → persistent storage (Keychain/Keystore on native,
//   localStorage on web). Survives app restarts.
// - accessToken → in-memory only. Re-derived from refreshToken on cold start
//   via /auth/refresh-token endpoint (Phase 4 wires it up).
//
// Per CLAUDE.md § 一 Storage 安全纪律 — refresh tokens are sensitive and
// MUST NOT land in MMKV / AsyncStorage.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { sessionStorage } from './storage';

export interface Session {
  accountId: number;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  accountId: number | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (session: Session) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accountId: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setSession: ({ accountId, accessToken, refreshToken }) =>
        set({ accountId, accessToken, refreshToken, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearSession: () =>
        set({
          accountId: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'nvy-auth',
      storage: createJSONStorage(() => sessionStorage),
      // accessToken intentionally omitted — refreshed on cold start.
      partialize: (state) => ({
        accountId: state.accountId,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.refreshToken && state.accountId !== null) {
          state.isAuthenticated = true;
        }
      },
    },
  ),
);
