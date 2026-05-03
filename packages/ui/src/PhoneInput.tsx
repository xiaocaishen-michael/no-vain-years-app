import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '@nvy/design-tokens';

export interface PhoneInputProps {
  value: string;
  onChangeText: (s: string) => void;
  disabled?: boolean;
}

// +86 prefix is static (per D7 — M1.2 大陆唯一，不渲染下拉 chevron)。
export function PhoneInput({ value, onChangeText, disabled }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={`flex-row items-center h-12 border-b ${
        focused ? 'border-brand-500' : 'border-line'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-center pr-2">
        <Text className="text-base font-medium text-ink">+86</Text>
      </View>
      <View className="w-px h-4 bg-line mr-3" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        placeholder="请输入手机号"
        placeholderTextColor={colors.ink.subtle}
        keyboardType="phone-pad"
        accessibilityLabel="手机号"
        className="flex-1 text-base text-ink font-sans tracking-wide"
      />
    </View>
  );
}
