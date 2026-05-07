// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
//
// Per ADR-0017 类 1 (标准 UI) 边界: bare RN components, zero packages/ui
// imports, zero hex/px/font literals. State machine wired in T3 (this
// commit); submission + clearSession + redirect lands in T4.
//
// State machine (per plan.md):
//   IDLE → CHECKBOX_HALF → CHECKBOX_FULL → CODE_SENDING → CODE_SENT
//        → CODE_TYPING → CODE_READY → SUBMITTING → SUCCESS / SUBMIT_ERROR
//
// 60s cooldown after send-code success: setInterval ticks the countdown
// from 60 → 0 then re-enables the send button. Error path leaves cooldown
// untouched (server-side rate limit is authoritative; client doesn't bypass).

import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { requestDeleteAccountSmsCode } from '@nvy/auth';

import { mapDeletionError } from './delete-account-errors';

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

const COOLDOWN_SECONDS = 60;

function errorCopy(kind: 'rate_limit' | 'invalid_code' | 'network' | 'unknown'): string {
  switch (kind) {
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
  const [hasSentCode, setHasSentCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Synchronous guard for double-tap before isSendingCode state propagates.
  const sendingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // Promise chain rather than async/await: vitest's spy infrastructure
  // tracks rejected promises returned by mocks even when the consumer catches
  // them via async/await wrapping. Direct .then/.catch attaches the handler to
  // the original promise, which the rejection tracker recognizes.
  const handleSendCode = () => {
    if (sendingRef.current) return; // synchronous race guard
    sendingRef.current = true;
    setIsSendingCode(true);
    setErrorMsg(null);
    requestDeleteAccountSmsCode()
      .then(() => {
        setHasSentCode(true);
        startCooldown();
      })
      .catch((e: unknown) => {
        const mapped = mapDeletionError(e);
        setErrorMsg(errorCopy(mapped.kind));
        // Per US3 acceptance 1: on 429 the server already counted the
        // request, kick the cooldown locally too to prevent further hammering.
        if (mapped.kind === 'rate_limit') {
          startCooldown();
        }
      })
      .finally(() => {
        sendingRef.current = false;
        setIsSendingCode(false);
      });
  };

  const bothChecked = checkbox1 && checkbox2;
  const canSendCode = bothChecked && cooldown === 0 && !isSendingCode && !isSubmitting;
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
        onPress={handleSendCode}
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
      {errorMsg !== null && <Text accessibilityLabel="error-row">{errorMsg}</Text>}
    </View>
  );
}
