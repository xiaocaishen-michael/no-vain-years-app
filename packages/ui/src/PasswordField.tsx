import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@nvy/design-tokens';
import { ErrorRow } from './ErrorRow';

export interface PasswordFieldProps {
  value: string;
  onChangeText: (s: string) => void;
  errorText?: string | null;
  disabled?: boolean;
}

export function PasswordField({ value, onChangeText, errorText, disabled }: PasswordFieldProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const borderTone = errorText ? 'border-err' : focused ? 'border-brand-500' : 'border-line';

  return (
    <View>
      <View
        className={`flex-row items-center h-12 border-b ${borderTone} ${disabled ? 'opacity-60' : ''}`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          secureTextEntry={!show}
          placeholder="请输入密码"
          placeholderTextColor={colors.ink.subtle}
          accessibilityLabel="密码"
          className="flex-1 text-base text-ink font-sans"
        />
        <Pressable
          onPress={() => setShow((s) => !s)}
          className="px-1 py-1"
          accessibilityRole="button"
          accessibilityLabel={show ? '隐藏密码' : '显示密码'}
        >
          <Text className="text-sm text-ink-subtle">{show ? '隐藏' : '显示'}</Text>
        </Pressable>
      </View>
      {errorText ? <ErrorRow text={errorText} /> : null}
    </View>
  );
}
