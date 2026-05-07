/**
 * Integration tests for my-profile business flow (spec my-profile T8).
 *
 * Strategy: pure-function integration — exercise `decideAuthRoute` through
 * realistic state sequences that mimic cold-start / tab-switch / logout flows,
 * without importing @nvy/auth (which pulls in expo-secure-store / react-native,
 * incompatible with vitest/happy-dom).
 *
 * Scope (per tasks.md T8):
 *   - SC-007: already-onboarded cold-start → no redirect loop
 *   - CL-003: navigating away then back preserves routing noop (tabs area)
 *   - SC-010: logout state change → routing sends to login
 *   - SC-003: activeTab invariant tested separately in profile.test.tsx (T6)
 *
 * T9 (Playwright) covers: full umount tree, sticky scroll, cross-device real backend.
 */

import { describe, expect, it } from 'vitest';
import { decideAuthRoute, type AuthGateInput } from '../../../lib/auth/auth-gate-decision';

// Simulate realistic app states as AuthGate would compute them.

const alreadyOnboarded = (flags: Partial<AuthGateInput> = {}): AuthGateInput => ({
  isAuthenticated: true,
  displayName: '小明',
  inAuthGroup: false,
  inOnboarding: false,
  ...flags,
});

const justLoggedOut = (flags: Partial<AuthGateInput> = {}): AuthGateInput => ({
  isAuthenticated: false,
  displayName: null,
  inAuthGroup: false,
  inOnboarding: false,
  ...flags,
});

describe('SC-007: cold-start already-onboarded user (no redirect loop)', () => {
  it('in (tabs) area → noop', () => {
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
  });

  it('in (tabs)/profile specifically → noop (profile is the landing tab)', () => {
    // No special inTabsProfile flag — any non-auth, non-onboarding route = noop.
    expect(decideAuthRoute(alreadyOnboarded({ inAuthGroup: false, inOnboarding: false }))).toEqual({
      kind: 'noop',
    });
  });
});

describe('CL-003: already-onboarded user navigating across tabs never gets redirected', () => {
  it('(tabs)/profile → (tabs)/index → still noop (no forced redirect back)', () => {
    // First visit: profile tab
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
    // Navigate to home tab (still in non-auth, non-onboarding area)
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
  });

  it('(tabs)/search → (tabs)/pkm → (tabs)/profile → all noop', () => {
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
  });
});

describe('SC-010: logout state change → routing sends to login', () => {
  it('immediately after logout, routing sends to /(auth)/login', () => {
    // Before logout
    expect(decideAuthRoute(alreadyOnboarded())).toEqual({ kind: 'noop' });
    // After logout (isAuthenticated=false, displayName=null)
    expect(decideAuthRoute(justLoggedOut())).toEqual({
      kind: 'replace',
      target: '/(auth)/login',
    });
  });

  it('logout from onboarding → still sends to login (not back to onboarding)', () => {
    expect(decideAuthRoute(justLoggedOut({ inOnboarding: true }))).toEqual({
      kind: 'replace',
      target: '/(auth)/login',
    });
  });
});

describe('AuthGate → (tabs)/profile routing correctness', () => {
  it('newly-logged-in user (no displayName yet) → goes to onboarding', () => {
    expect(
      decideAuthRoute({
        isAuthenticated: true,
        displayName: null,
        inAuthGroup: false,
        inOnboarding: false,
      }),
    ).toEqual({ kind: 'replace', target: '/(app)/onboarding' });
  });

  it('onboarding completes (displayName set) → AuthGate sends to (tabs)/profile if still in onboarding', () => {
    expect(
      decideAuthRoute({
        isAuthenticated: true,
        displayName: '小明',
        inAuthGroup: false,
        inOnboarding: true,
      }),
    ).toEqual({ kind: 'replace', target: '/(app)/(tabs)/profile' });
  });
});
