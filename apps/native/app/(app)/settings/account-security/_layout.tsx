// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Stack } from 'expo-router';

export default function AccountSecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: '账号与安全' }} />
      <Stack.Screen name="phone" options={{ title: '手机号' }} />
      {/* delete-account 由 spec C 落地 — 本 spec 不预占位 */}
    </Stack>
  );
}
