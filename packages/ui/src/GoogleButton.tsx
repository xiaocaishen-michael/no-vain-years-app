import { Image, Pressable } from 'react-native';

export interface GoogleButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

// Google "G" mark via remote SVG. M1.2 仅 placeholder（press 弹 toast "Coming in M1.3"）；
// M1.3 接真实 OAuth 时可换成本地 asset 或 expo-auth-session 的内置 icon。
const GOOGLE_G_URL = 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg';

export function GoogleButton({ onPress, disabled }: GoogleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Google 登录"
      accessibilityState={{ disabled: !!disabled }}
      className={`w-12 h-12 rounded-full border border-line bg-surface items-center justify-center ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <Image
        source={{ uri: GOOGLE_G_URL }}
        className="w-5 h-5"
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}
