import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export interface WechatButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

// WeChat OAuth circle button (per mockup v2 specs/auth/phone-sms-auth/design/source-v2/LoginScreen.tsx ~L237).
// 微信品牌绿 #07C160 是 ad-hoc 任意值（per design/handoff.md § 4），仅本组件使用。
// M1.2 仅 placeholder（caller 端 onPress 弹 toast "Coming in M1.3"）；M1.3 接真实 OAuth 时替换 onPress。
//
// SVG glyph paste 1:1 from mockup — two overlapping speech bubbles, classic WeChat.
function WechatGlyph() {
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28">
      <Path
        d="M11 5C5.9 5 2 8.5 2 12.7c0 2.4 1.4 4.5 3.5 5.9l-.6 2.6 3.1-1.6c.94.18 1.93.28 2.95.28.32 0 .64-.01.95-.04C11.7 19.55 11.5 18.7 11.5 17.8c0-3.7 3.6-6.7 8-6.7.45 0 .9.03 1.34.09C20.05 7.45 16 5 11 5Z"
        fill="#fff"
      />
      <Circle cx={8.2} cy={11.2} r={1.05} fill="#07C160" />
      <Circle cx={13.8} cy={11.2} r={1.05} fill="#07C160" />
      <Path
        d="M27 18.5c0-3.05-3.13-5.5-7-5.5s-7 2.45-7 5.5c0 3.05 3.13 5.5 7 5.5.7 0 1.36-.08 2-.23l2.5 1.4-.55-2.1c1.85-1 3.05-2.55 3.05-4.57Z"
        fill="#fff"
      />
      <Circle cx={17.5} cy={18.2} r={0.9} fill="#07C160" />
      <Circle cx={22.5} cy={18.2} r={0.9} fill="#07C160" />
    </Svg>
  );
}

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
        <WechatGlyph />
      </Pressable>
      <Text className="text-[11px] text-ink-subtle">微信</Text>
    </View>
  );
}
