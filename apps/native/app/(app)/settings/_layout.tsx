// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: '设置' }} />
      <Stack.Screen name="account-security" options={{ headerShown: false }} />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
    </Stack>
  );
}
