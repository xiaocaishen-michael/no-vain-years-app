import '../global.css';

import { registerAuthInterceptor, useAuthStore } from '@nvy/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useNavigationContainerRef, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { decideAuthRoute } from '../lib/auth/auth-gate-decision';

// Wire the api-client → auth-store bridge once at module load. Idempotent.
// Keeps the typed APIs and the 401-retry interceptor reading from this store.
registerAuthInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Splash placeholder shown while zustand persist rehydrates / nav container
// mounts. Bare RN per ADR-0017 occupy-UI 4 boundaries — visual treatment
// (logo / animation / brand colors) deferred to mockup PHASE 2.
function SplashPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>加载中...</Text>
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const navRef = useNavigationContainerRef();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const displayName = useAuthStore((s) => s.displayName);
  const [navReady, setNavReady] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  // Wait for the navigation container to actually mount before issuing any
  // router.replace — Expo Router asserts navigationRef.isReady() and throws
  // "Attempted to navigate before mounting the Root Layout component"
  // otherwise. `useNavigationContainerRef` + `state` listener is the
  // canonical way to subscribe to readiness.
  useEffect(() => {
    if (navRef.isReady()) {
      setNavReady(true);
      return;
    }
    const unsubscribe = navRef.addListener('state', () => {
      if (navRef.isReady()) setNavReady(true);
    });
    return unsubscribe;
  }, [navRef]);

  // Subscribe to persist rehydration. SC-007 demands that AuthGate render a
  // splash (not jump routes) while displayName / refreshToken are still being
  // pulled out of localStorage / Keychain — otherwise the user sees a flash
  // of /(auth)/login between cold boot and rehydrate.
  useEffect(() => {
    setHasHydrated(useAuthStore.persist.hasHydrated());
    return useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!navReady || !hasHydrated) return;
    const decision = decideAuthRoute({
      isAuthenticated,
      displayName,
      inAuthGroup: segments[0] === '(auth)',
      inOnboarding: segments.includes('onboarding'),
    });
    if (decision.kind === 'replace') {
      router.replace(decision.target as Parameters<typeof router.replace>[0]);
    }
  }, [navReady, hasHydrated, isAuthenticated, displayName, segments, router]);

  if (!hasHydrated) return <SplashPlaceholder />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthGate>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
