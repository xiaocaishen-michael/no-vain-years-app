import { Pressable, Text, View } from 'react-native';

export interface GoogleButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

// Google OAuth circle button (per mockup v2 spec/login/design/source-v2/LoginScreen.tsx ~L257).
// M1.2 仅 placeholder（caller 端 onPress 弹 toast "Coming in M1.3"）；M1.3 接真实 OAuth 时
// 用 SVG asset 或 expo-auth-session 内置 icon 替换单字 "G"。
export function GoogleButton({ onPress, disabled }: GoogleButtonProps) {
  return (
    <View className="items-center gap-1.5">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Google 登录（即将上线）"
        accessibilityState={{ disabled: !!disabled }}
        className={`w-12 h-12 rounded-full items-center justify-center bg-surface border border-line ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <Text className="text-ink text-xl font-bold">G</Text>
      </Pressable>
      <Text className="text-[11px] text-ink-subtle">Google</Text>
    </View>
  );
}
