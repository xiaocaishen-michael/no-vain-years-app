import '../global.css';

import { registerAuthInterceptor, useAuthStore } from '@nvy/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useNavigationContainerRef, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const navRef = useNavigationContainerRef();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [navReady, setNavReady] = useState(false);

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

  useEffect(() => {
    if (!navReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [navReady, isAuthenticated, segments, router]);

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
