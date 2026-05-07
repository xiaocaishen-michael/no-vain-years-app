import { Stack } from 'expo-router';

export default function LegalLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="personal-info" options={{ title: '《个人信息收集与使用清单》' }} />
      <Stack.Screen name="third-party" options={{ title: '《第三方共享清单》' }} />
    </Stack>
  );
}
