// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
//
// Per ADR-0017 类 1 (标准 UI) 边界: bare RN components, zero packages/ui
// imports, zero hex/px/font literals. State machine + cooldown + error
// mapping wired in T8 (this commit); submission + setSession + redirect
// lands in T9.
//
// State machine (per plan.md cancel-deletion form):
//   READING_PARAMS → PHONE_PREFILLED / PHONE_EMPTY → PHONE_TYPING (deep link
//   path) → PHONE_READY → CODE_SENDING → CODE_SENT → CODE_TYPING → CODE_READY
//
// 反枚举: all 4xx error responses (cancel-deletion endpoint) collapse to a
// single message via mapCancelDeletionError → kind 'invalid_credentials'.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { cancelDeletion, requestCancelDeletionSmsCode } from '@nvy/auth';

import { maskPhone } from '../../lib/format/phone';
import { mapCancelDeletionError } from './cancel-deletion-errors';

const COPY = {
  description: '请通过手机号验证码撤销注销，恢复账号',
  phonePlaceholder: '请输入手机号（如 +86138...）',
  sendCode: '发送验证码',
  resendCooldown: (s: number) => `${s}s 后可重发`,
  codePlaceholder: '请输入 6 位验证码',
  submit: '撤销注销',
  submitting: 'submitting...',
  errorRateLimit: '操作太频繁，请稍后再试',
  errorInvalidCredentials: '凭证或验证码无效',
  errorNetwork: '网络错误，请重试',
  errorUnknown: '发生未知错误',
} as const;

const COOLDOWN_SECONDS = 60;

function errorCopy(kind: 'rate_limit' | 'invalid_credentials' | 'network' | 'unknown'): string {
  switch (kind) {
    case 'rate_limit':
      return COPY.errorRateLimit;
    case 'invalid_credentials':
      return COPY.errorInvalidCredentials;
    case 'network':
      return COPY.errorNetwork;
    case 'unknown':
      return COPY.errorUnknown;
  }
}

export default function CancelDeletionScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [phoneReadOnly, setPhoneReadOnly] = useState(false);
  const [code, setCode] = useState('');
  const [hasSentCode, setHasSentCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef = useRef(false);
  const submittingRef = useRef(false);

  // FR-013 + FR-022: read phone from query param on mount, then clear the
  // param via router.setParams so the URL no longer contains the phone.
  useEffect(() => {
    if (params.phone !== undefined && params.phone.length > 0) {
      setPhone(decodeURIComponent(params.phone));
      setPhoneReadOnly(true);
      router.setParams({ phone: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
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

  const handleSendCode = () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSendingCode(true);
    setErrorMsg(null);
    requestCancelDeletionSmsCode(phone)
      .then(() => {
        setHasSentCode(true);
        startCooldown();
      })
      .catch((e: unknown) => {
        const mapped = mapCancelDeletionError(e);
        setErrorMsg(errorCopy(mapped.kind));
        if (mapped.kind === 'rate_limit') {
          startCooldown();
        }
      })
      .finally(() => {
        sendingRef.current = false;
        setIsSendingCode(false);
      });
  };

  const handleSubmit = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);
    cancelDeletion(phone, code)
      .then(() => {
        // cancelDeletion() wrapper already setSession + loadProfile;
        // AuthGate detects isAuthenticated change and routes home, but we
        // explicitly replace too so the cancel-deletion screen unmounts
        // immediately rather than briefly flashing as auth flips.
        router.replace('/(app)/(tabs)');
      })
      .catch((e: unknown) => {
        const mapped = mapCancelDeletionError(e);
        setErrorMsg(errorCopy(mapped.kind));
      })
      .finally(() => {
        submittingRef.current = false;
        setIsSubmitting(false);
      });
  };

  const canSendCode = phone.length > 0 && cooldown === 0 && !isSendingCode && !isSubmitting;
  const canSubmit = hasSentCode && code.length === 6 && !isSubmitting;

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
        onPress={handleSubmit}
        accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
        style={{ opacity: canSubmit ? 1 : 0.5 }}
      >
        <Text>{isSubmitting ? COPY.submitting : COPY.submit}</Text>
      </Pressable>
      {errorMsg !== null && <Text accessibilityLabel="error-row">{errorMsg}</Text>}
    </View>
  );
}
