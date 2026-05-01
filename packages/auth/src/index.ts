// Public surface of @nvy/auth.
//
// Phase 3 (this PR): exports the Zustand store + session types only.
// Phase 4 will add high-level use case helpers (loginByPassword,
// loginByPhoneSms, refreshToken, logoutAll) wired to @nvy/api-client.
export type { AuthState, Session } from './store';
export { useAuthStore } from './store';
