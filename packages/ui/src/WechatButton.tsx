import { Pressable, Text, View } from 'react-native';

export interface WechatButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

// WeChat OAuth circle button (per mockup v2 spec/login/design/source-v2/LoginScreen.tsx ~L237).
// 微信品牌绿 #07C160 是 ad-hoc 任意值（per design/handoff.md § 4），仅本组件使用。
// M1.2 仅 placeholder（caller 端 onPress 弹 toast "Coming in M1.3"）；M1.3 接真实 OAuth 时换 glyph。
export function WechatButton({ onPress, disabled }: WechatButtonProps) {
  return (
    <View className="items-center gap-1.5">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="微信登录（即将上线）"
        accessibilityState={{ disabled: !!disabled }}
        className={`w-12 h-12 rounded-full items-center justify-center bg-[#07C160] ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <Text className="text-white text-xl font-bold">微</Text>
      </Pressable>
      <Text className="text-[11px] text-ink-subtle">微信</Text>
    </View>
  );
}
