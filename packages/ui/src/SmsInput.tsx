import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@nvy/design-tokens';
import { ErrorRow } from './ErrorRow';
import { Spinner } from './Spinner';

export interface SmsInputProps {
  value: string;
  onChangeText: (s: string) => void;
  errorText?: string | null;
  /** null = idle (button shows "获取验证码")；> 0 = ticking (按钮 disabled + 倒计时文案) */
  countdown: number | null;
  disabled?: boolean;
  onSend?: () => void;
}

export function SmsInput({
  value,
  onChangeText,
  errorText,
  countdown,
  disabled,
  onSend,
}: SmsInputProps) {
  const [focused, setFocused] = useState(false);
  const ticking = countdown !== null && countdown > 0;
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
          placeholder="请输入 6 位验证码"
          placeholderTextColor={colors.ink.subtle}
          maxLength={6}
          keyboardType="number-pad"
          accessibilityLabel="验证码"
          className="flex-1 text-base text-ink font-sans tracking-widest"
        />
        <Pressable
          disabled={ticking || disabled}
          onPress={onSend}
          className="flex-row items-center gap-2 pl-2"
          accessibilityRole="button"
          accessibilityLabel={ticking ? `${countdown ?? 0}秒后可重新发送` : '获取验证码'}
        >
          {ticking ? (
            <>
              <Spinner size={11} tone="muted" />
              <Text className="text-sm text-ink-subtle font-medium font-mono">
                {countdown}s 后重发
              </Text>
            </>
          ) : (
            <Text className="text-sm text-brand-500 font-medium">获取验证码</Text>
          )}
        </Pressable>
      </View>
      {errorText ? <ErrorRow text={errorText} /> : null}
    </View>
  );
}
