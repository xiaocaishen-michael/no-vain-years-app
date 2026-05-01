import { tamaguiConfig } from '@nvy/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

// Single QueryClient for the whole app. Query / mutation defaults are
// intentionally minimal — feature modules tune retry/staleTime per use case.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
