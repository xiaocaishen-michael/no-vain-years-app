import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

// Placeholder home page. Replaced by features/account flows in Phase 4.
//
// Smoke uses NativeWind className: validates withNativeWind metro wrapper +
// jsxImportSource: 'nativewind' babel preset + tailwind.config.ts content
// scanning are all wired correctly. Real components in packages/ui will
// emerge when Phase 4 login page drives their need.
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface gap-md">
      <Text className="text-3xl font-semibold text-text">no-vain-years</Text>
      <Text className="text-sm text-muted">NativeWind primitives mounted</Text>
      <StatusBar style="auto" />
    </View>
  );
}
