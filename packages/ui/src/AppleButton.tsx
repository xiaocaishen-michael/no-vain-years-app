import { Pressable, Text, View } from 'react-native';

export interface AppleButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

// Apple OAuth circle button (per mockup v2 specs/auth/login/design/source-v2/LoginScreen.tsx ~L260).
// **iOS-only** conditional render 在 caller 层（login.tsx）用 Platform.OS === 'ios' 判;
// 本组件本身跨端可渲染 (per ADR-0016 决策 4 + plan.md 反模式).
//
// M1.2 仅 placeholder（caller 端 onPress 弹 toast "Coming in M1.3"）；M1.3 接 Apple
// Sign-in 时使用 expo-apple-authentication 的内置 button 或本地 SVG asset 替换文字。
export function AppleButton({ onPress, disabled }: AppleButtonProps) {
  return (
    <View className="items-center gap-1.5">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Apple 登录（即将上线）"
        accessibilityState={{ disabled: !!disabled }}
        className={`w-12 h-12 rounded-full items-center justify-center bg-ink ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {/* Unicode  (U+F8FF) — Apple logo private-use code point;
            iOS / macOS 系统字体可渲染，其他平台 fallback 为空 □; M1.3 接真实 Sign-in 时换 SVG asset */}
        <Text className="text-white text-xl font-bold"></Text>
      </Pressable>
      <Text className="text-[11px] text-ink-subtle">Apple</Text>
    </View>
  );
}
