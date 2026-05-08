import { Stack } from 'expo-router';

export default function AccountSecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: '账号与安全' }} />
      <Stack.Screen name="phone" options={{ title: '手机号' }} />
      <Stack.Screen name="delete-account" options={{ title: '注销账号' }} />
      {/* login-management 是嵌套 stack（含 index + [id]），由其自身 _layout 提供 header — 关掉外层 header 防双层重叠。 */}
      <Stack.Screen name="login-management" options={{ headerShown: false }} />
    </Stack>
  );
}
