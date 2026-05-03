import { Text, View } from 'react-native';

// Brand "不" wordmark in a brand-500 rounded square.
// See apps/native/spec/login/design/source/assets/logo-mark.svg for the full
// SVG variant (used in marketing assets, not in-app).
export function LogoMark() {
  return (
    <View className="w-11 h-11 rounded-xl bg-brand-500 items-center justify-center">
      <Text className="text-white text-xl font-bold">不</Text>
    </View>
  );
}
