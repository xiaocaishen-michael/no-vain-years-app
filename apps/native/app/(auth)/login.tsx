import { Text, View } from 'react-native';

// Placeholder login screen — replaced by Phase 4 SDD-driven implementation
// (`apps/native/spec/login/`). Lives now so the auth guard in app/_layout.tsx
// has a target to redirect unauthenticated traffic to.
export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface gap-md">
      <Text className="text-3xl font-semibold text-text">登录</Text>
      <Text className="text-sm text-muted">Phase 4 SDD pending</Text>
    </View>
  );
}
