import { Redirect } from 'expo-router';

import { useAuthStore } from '@nvy/auth';

// Root index — explicit fallback so accessing `/` doesn't render an empty
// Stack while AuthGate's effect is still pending. Sends user to login or home
// based on auth state; AuthGate in _layout.tsx handles subsequent transitions.
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />;
}
