import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: '登录' }} />
      <Stack.Screen name="cancel-deletion" options={{ title: '撤销注销' }} />
    </Stack>
  );
}
