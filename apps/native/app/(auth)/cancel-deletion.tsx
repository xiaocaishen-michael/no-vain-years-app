// PHASE 2 — mockup translation (per spec C T14 / design/handoff.md § 2).
// Visual contrast vs delete-account: brand primary submit ("撤销注销" =
// recover) sits opposite the destructive err-tone submit on delete-account.
// Top accent bar uses brand-soft + brand-500 left rule to signal "recovery".
//
// 反枚举 (per FR-020 / SC-008): all 4xx errors collapse to one canonical
// invalid-credentials string via mapCancelDeletionError → kind
// 'invalid_credentials'. PHASE 2 visual layer DOES NOT introduce per-status
// icons or copy variants. Static grep (freeze-flow.test.tsx) keeps this
// invariant by counting occurrences of the canonical string == 1.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { cancelDeletion, requestCancelDeletionSmsCode } from '@nvy/auth';

import { maskPhone } from '../../lib/format/phone';
import { mapCancelDeletionError } from './cancel-deletion-errors';

const COPY = {
  recoverHeading: '恢复账号',
  description: '请通过手机号验证码撤销注销，恢复账号',
  phonePrefilledHint: '已从冻结期提示自动填入，不可修改',
  phoneEditableHint: '请输入注销时使用的手机号',
  phonePrefilledLabel: 'PHONE · 已绑定（不可修改）',
  phoneEditableLabel: 'PHONE · 请输入手机号',
  phonePlaceholder: '请输入手机号（如 +86 138...）',
  sendCode: '发送验证码',
  resendCooldown: (s: number) => `${s}s 后可重发`,
  smsLabel: 'SMS · 6 位验证码',
  submit: '撤销注销',
  submitting: '正在撤销...',
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

function RecoverBanner() {
  return (
    <View className="rounded-md border-l-2 border-brand-500 bg-brand-soft px-md py-sm gap-xs">
      <Text className="font-semibold text-brand-700 text-sm">{COPY.recoverHeading}</Text>
      <Text className="text-ink leading-relaxed text-sm">{COPY.description}</Text>
    </View>
  );
}

function SectionLabel({ num, children }: { num: string; children: string }) {
  return (
    <View className="flex-row items-center gap-sm">
      <Text className="font-mono font-semibold text-ink-subtle tracking-widest text-xs">{num}</Text>
      <Text className="font-mono text-ink-muted tracking-wider text-xs">{children}</Text>
    </View>
  );
}

function PhoneInputBlock({
  readOnly,
  value,
  onChangeText,
}: {
  readOnly: boolean;
  value: string;
  onChangeText: (t: string) => void;
}) {
  // Single TextInput in both modes (readOnly toggles `editable`) so a11y
  // selectors stay consistent across PHASE 1 / PHASE 2 and prefilled vs deep-link.
  const containerCls = readOnly
    ? 'flex-row items-center gap-sm rounded-md border border-line bg-surface-sunken px-md'
    : 'flex-row items-center rounded-md border border-line-strong bg-surface px-md';
  const displayValue = readOnly ? maskPhone(value) : value;
  return (
    <View className={containerCls} style={{ height: 48 }}>
      {readOnly ? <Text className="font-bold text-ink-muted text-sm">🔒</Text> : null}
      <TextInput
        accessibilityLabel="phone-input"
        value={displayValue}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!readOnly}
        placeholder={COPY.phonePlaceholder}
        className={`flex-1 font-mono text-base ${readOnly ? 'font-semibold text-ink' : 'text-ink'}`}
      />
    </View>
  );
}

function SendCodeRow({
  state,
  cooldown,
  onPress,
}: {
  state: 'default' | 'disabled' | 'cooldown';
  cooldown: number;
  onPress: () => void;
}) {
  const isDisabled = state === 'disabled';
  const isCooldown = state === 'cooldown';
  const text = isCooldown ? COPY.resendCooldown(cooldown) : COPY.sendCode;
  const labelTone = isDisabled ? 'text-ink-subtle' : 'text-ink-muted';
  const ctaTone = isDisabled ? 'text-ink-subtle' : isCooldown ? 'text-ink-muted' : 'text-brand-500';
  const containerBg =
    isCooldown || isDisabled ? 'bg-surface-alt border-line' : 'bg-surface border-brand-100';
  return (
    <Pressable
      accessibilityLabel="send-code"
      accessibilityRole="button"
      accessibilityState={{ disabled: state !== 'default' }}
      onPress={onPress}
      className={`flex-row items-center justify-between rounded-md border px-md ${containerBg}`}
      style={{ height: 48 }}
    >
      <Text className={`font-medium font-mono text-sm ${labelTone}`}>{COPY.smsLabel}</Text>
      <Text className={`font-medium text-sm ${ctaTone}`}>{text}</Text>
    </Pressable>
  );
}

function CodeInput({
  value,
  onChangeText,
  disabled,
  tone,
}: {
  value: string;
  onChangeText: (t: string) => void;
  disabled: boolean;
  tone: 'brand' | 'err';
}) {
  return (
    <View className="relative">
      <TextInput
        accessibilityLabel="code-input"
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
        editable={!disabled}
        className="absolute inset-0 z-10 opacity-0"
      />
      <View className="flex-row gap-sm pointer-events-none">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ch = value[i] ?? '';
          const isFocused = !disabled && i === value.length;
          const isFilled = ch !== '';
          const cellBg = disabled ? 'bg-surface-sunken' : 'bg-surface';
          let cellBorder: string;
          if (tone === 'err') {
            cellBorder = 'border-err';
          } else if (isFocused) {
            cellBorder = 'border-brand-500';
          } else if (isFilled) {
            cellBorder = 'border-ink';
          } else if (disabled) {
            cellBorder = 'border-line';
          } else {
            cellBorder = 'border-line-strong';
          }
          const charTone = disabled ? 'text-ink-subtle' : 'text-ink';
          return (
            <View
              key={`cell-${String(i)}`}
              className={`flex-1 rounded-sm border-2 items-center justify-center ${cellBg} ${cellBorder}`}
              style={{ height: 48 }}
            >
              <Text className={`font-mono font-semibold text-lg ${charTone}`}>{ch}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ErrorRow({ msg }: { msg: string }) {
  return (
    <View
      className="flex-row items-center gap-sm rounded-sm bg-err-soft px-sm py-sm"
      accessibilityRole="alert"
    >
      <Text className="font-bold text-err text-sm">!</Text>
      <Text accessibilityLabel="error-row" className="flex-1 font-medium text-err text-sm">
        {msg}
      </Text>
    </View>
  );
}

function SubmitButton({
  disabled,
  busy,
  onPress,
}: {
  disabled: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const enabled = !disabled;
  const containerCls = enabled
    ? 'bg-brand-500 shadow-cta items-center justify-center rounded-md'
    : 'bg-surface-sunken items-center justify-center rounded-md';
  const labelTone = enabled ? 'text-surface' : 'text-ink-subtle';
  return (
    <Pressable
      accessibilityLabel="submit"
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      onPress={onPress}
      className={containerCls}
      style={{ height: 52 }}
    >
      <Text className={`font-semibold tracking-wide text-base ${labelTone}`}>
        {busy ? COPY.submitting : COPY.submit}
      </Text>
    </Pressable>
  );
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

  let sendCodeState: 'default' | 'disabled' | 'cooldown';
  if (cooldown > 0) {
    sendCodeState = 'cooldown';
  } else if (canSendCode) {
    sendCodeState = 'default';
  } else {
    sendCodeState = 'disabled';
  }

  const phoneHint = phoneReadOnly ? COPY.phonePrefilledHint : COPY.phoneEditableHint;
  const phoneLabel = phoneReadOnly ? COPY.phonePrefilledLabel : COPY.phoneEditableLabel;

  return (
    <View className="flex-1 bg-surface">
      <View className="px-md pt-md pb-xl gap-md">
        <RecoverBanner />

        <SectionLabel num="01">{phoneLabel}</SectionLabel>
        <PhoneInputBlock readOnly={phoneReadOnly} value={phone} onChangeText={setPhone} />
        <Text className="text-ink-subtle text-xs">{phoneHint}</Text>

        <SectionLabel num="02">VERIFY · 短信验证</SectionLabel>
        <View className="gap-sm">
          <SendCodeRow state={sendCodeState} cooldown={cooldown} onPress={handleSendCode} />
          <CodeInput
            value={code}
            onChangeText={setCode}
            disabled={!hasSentCode || isSubmitting}
            tone={errorMsg !== null ? 'err' : 'brand'}
          />
        </View>

        {errorMsg !== null && <ErrorRow msg={errorMsg} />}

        <SubmitButton disabled={!canSubmit} busy={isSubmitting} onPress={handleSubmit} />
      </View>
    </View>
  );
}
