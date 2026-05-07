// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
//
// Per ADR-0017 类 1 (标准 UI) 边界: bare RN components, zero packages/ui
// imports, zero hex/px/font literals. State machine + cooldown wiring lands
// in T3; submission + clearSession + redirect lands in T4. T2 surface = IDLE
// state only — both Pressables disabled, code input disabled, no handlers
// fire any side effects.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { MappedDeletionError } from './delete-account-errors';

const COPY = {
  warning1: '注销后账号进入 15 天冻结期，期间可登录撤销恢复',
  warning2: '冻结期满后账号数据将永久匿名化，不可恢复',
  checkbox1: '我已知晓 15 天冻结期可撤销',
  checkbox2: '我已知晓期满后数据匿名化不可逆',
  sendCode: '发送验证码',
  resendCooldown: (s: number) => `${s}s 后可重发`,
  codePlaceholder: '请输入 6 位验证码',
  submit: '确认注销',
  submitting: 'submitting...',
  errorRateLimit: '操作太频繁，请稍后再试',
  errorInvalidCode: '验证码错误',
  errorNetwork: '网络错误，请重试',
  errorUnknown: '发生未知错误',
} as const;

export function errorCopy(mapped: MappedDeletionError): string {
  switch (mapped.kind) {
    case 'rate_limit':
      return COPY.errorRateLimit;
    case 'invalid_code':
      return COPY.errorInvalidCode;
    case 'network':
      return COPY.errorNetwork;
    case 'unknown':
      return COPY.errorUnknown;
  }
}

export default function DeleteAccountScreen() {
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(false);
  const [code, setCode] = useState('');
  const [hasSentCode] = useState(false);
  const [cooldown] = useState(0);
  const [isSubmitting] = useState(false);
  const [errorMsg] = useState<string | null>(null);

  const bothChecked = checkbox1 && checkbox2;
  const canSendCode = bothChecked && cooldown === 0 && !isSubmitting;
  const canSubmit = hasSentCode && code.length === 6 && !isSubmitting;

  return (
    <View>
      <Text>{COPY.warning1}</Text>
      <Text>{COPY.warning2}</Text>
      <Pressable
        onPress={() => setCheckbox1((v) => !v)}
        accessibilityLabel="checkbox-1"
        accessibilityState={{ checked: checkbox1 }}
      >
        <Text>
          {checkbox1 ? '☑ ' : '☐ '}
          {COPY.checkbox1}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setCheckbox2((v) => !v)}
        accessibilityLabel="checkbox-2"
        accessibilityState={{ checked: checkbox2 }}
      >
        <Text>
          {checkbox2 ? '☑ ' : '☐ '}
          {COPY.checkbox2}
        </Text>
      </Pressable>
      <Pressable
        accessibilityLabel="send-code"
        accessibilityState={{ disabled: !canSendCode }}
        style={{ opacity: canSendCode ? 1 : 0.5 }}
      >
        <Text>{cooldown > 0 ? COPY.resendCooldown(cooldown) : COPY.sendCode}</Text>
      </Pressable>
      <TextInput
        accessibilityLabel="code-input"
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
        editable={hasSentCode && !isSubmitting}
        placeholder={COPY.codePlaceholder}
      />
      <Pressable
        accessibilityLabel="submit"
        accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
        style={{ opacity: canSubmit ? 1 : 0.5 }}
      >
        <Text>{isSubmitting ? COPY.submitting : COPY.submit}</Text>
      </Pressable>
      {errorMsg !== null && <Text>{errorMsg}</Text>}
    </View>
  );
}
