// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
//
// Per ADR-0017 类 1 (标准 UI) 边界: bare RN components, zero packages/ui
// imports, zero hex/px/font literals. T7 surface = page registration + the
// first effect (read phone param + clear it from the URL per FR-013 + FR-022).
// State machine + cooldown wiring lands in T8; submit + setSession + redirect
// in T9.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { maskPhone } from '../../lib/format/phone';

const COPY = {
  description: '请通过手机号验证码撤销注销，恢复账号',
  phonePlaceholder: '请输入手机号（如 +86138...）',
  sendCode: '发送验证码',
  resendCooldown: (s: number) => `${s}s 后可重发`,
  codePlaceholder: '请输入 6 位验证码',
  submit: '撤销注销',
  submitting: 'submitting...',
} as const;

export default function CancelDeletionScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [phoneReadOnly, setPhoneReadOnly] = useState(false);
  const [code] = useState('');
  const [hasSentCode] = useState(false);
  const [cooldown] = useState(0);
  const [isSubmitting] = useState(false);

  // FR-013 + FR-022: read phone from query param on mount, then clear the
  // param via router.setParams so the URL no longer contains the phone (avoids
  // leaking via browser history / share URL on web bundle). One-shot —
  // intentionally empty deps array.
  useEffect(() => {
    if (params.phone !== undefined && params.phone.length > 0) {
      setPhone(decodeURIComponent(params.phone));
      setPhoneReadOnly(true);
      router.setParams({ phone: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <Text>{COPY.description}</Text>
      <TextInput
        accessibilityLabel="phone-input"
        value={phoneReadOnly ? maskPhone(phone) : phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!phoneReadOnly}
        placeholder={COPY.phonePlaceholder}
      />
      <Pressable
        accessibilityLabel="send-code"
        accessibilityState={{ disabled: phone.length === 0 || cooldown > 0 }}
        style={{ opacity: phone.length === 0 || cooldown > 0 ? 0.5 : 1 }}
      >
        <Text>{cooldown > 0 ? COPY.resendCooldown(cooldown) : COPY.sendCode}</Text>
      </Pressable>
      <TextInput
        accessibilityLabel="code-input"
        value={code}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
        editable={hasSentCode && !isSubmitting}
        placeholder={COPY.codePlaceholder}
      />
      <Pressable
        accessibilityLabel="submit"
        accessibilityState={{
          disabled: !hasSentCode || code.length !== 6 || isSubmitting,
          busy: isSubmitting,
        }}
        style={{ opacity: !hasSentCode || code.length !== 6 || isSubmitting ? 0.5 : 1 }}
      >
        <Text>{isSubmitting ? COPY.submitting : COPY.submit}</Text>
      </Pressable>
    </View>
  );
}
