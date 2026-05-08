// PHASE 2 — mockup translation (per spec C T13 / design/handoff.md § 2).
// Visual system: NativeWind className + design-tokens (brand / err / warn /
// surface / line / ink). Hex/px literals are confined to layout-only numeric
// style (height/width on cells & button) per handoff.md § 5.1 gotcha #3.
//
// State machine (unchanged from PHASE 1 T3):
//   IDLE → CHECKBOX_HALF → CHECKBOX_FULL → CODE_SENDING → CODE_SENT
//        → CODE_TYPING → CODE_READY → SUBMITTING → SUCCESS / SUBMIT_ERROR

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { deleteAccount, requestDeleteAccountSmsCode } from '@nvy/auth';

import { mapDeletionError } from './delete-account-errors';

const COPY = {
  warning1: '注销后账号进入 15 天冻结期，期间可登录撤销恢复',
  warning2: '冻结期满后账号数据将永久匿名化，不可恢复',
  warning1Tag: '可撤销',
  warning2Tag: '不可逆',
  checkbox1: '我已知晓 15 天冻结期可撤销',
  checkbox2: '我已知晓期满后数据匿名化不可逆',
  sendCode: '发送验证码',
  resendCooldown: (s: number) => `${s}s 后可重发`,
  smsLabel: 'SMS · 6 位验证码',
  submit: '确认注销',
  submitting: '正在注销...',
  submitFootnote: '点击「确认注销」即表示同意进入 15 天冻结期',
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

function SectionLabel({ num, children }: { num: string; children: string }) {
  return (
    <View className="flex-row items-center gap-sm">
      <Text className="font-mono font-semibold text-ink-subtle tracking-widest text-xs">{num}</Text>
      <Text className="font-mono text-ink-muted tracking-wider text-xs">{children}</Text>
    </View>
  );
}

function WarningBlock() {
  return (
    <View className="rounded-md bg-err-soft px-md py-md gap-sm">
      <View className="flex-row items-start gap-sm">
        <View className="rounded-full bg-warn mt-1.5" style={{ width: 6, height: 6 }} />
        <View className="flex-1 flex-row flex-wrap items-baseline gap-sm">
          <Text className="font-semibold text-warn text-sm">{COPY.warning1Tag}</Text>
          <Text className="text-ink leading-relaxed text-sm">{COPY.warning1}</Text>
        </View>
      </View>
      <View className="flex-row items-start gap-sm">
        <View className="rounded-full bg-err mt-1.5" style={{ width: 6, height: 6 }} />
        <View className="flex-1 flex-row flex-wrap items-baseline gap-sm">
          <Text className="font-semibold text-err text-sm">{COPY.warning2Tag}</Text>
          <Text className="text-ink leading-relaxed text-sm">{COPY.warning2}</Text>
        </View>
      </View>
    </View>
  );
}

function CheckboxRow({
  checked,
  label,
  ariaLabel,
  onPress,
}: {
  checked: boolean;
  label: string;
  ariaLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={ariaLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-sm py-sm"
    >
      <View
        className={
          checked
            ? 'rounded-xs bg-brand-500 items-center justify-center'
            : 'rounded-xs border border-line-strong bg-surface'
        }
        style={{ width: 18, height: 18 }}
      >
        {checked ? <Text className="font-bold text-surface text-xs">✓</Text> : null}
      </View>
      <Text className="flex-1 text-ink text-sm">{label}</Text>
    </Pressable>
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
  // Single hidden TextInput for keyboard + a11y; 6 visible cells render value.
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
    ? 'bg-err shadow-cta items-center justify-center rounded-md'
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

export default function DeleteAccountScreen() {
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(false);
  const [code, setCode] = useState('');
  const [hasSentCode, setHasSentCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef = useRef(false);
  const submittingRef = useRef(false);

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

  const handleSendCode = () => {
    if (sendingRef.current) return;
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
    deleteAccount(code)
      .then(() => {
        router.replace('/(auth)/login');
      })
      .catch((e: unknown) => {
        const mapped = mapDeletionError(e);
        setErrorMsg(errorCopy(mapped.kind));
      })
      .finally(() => {
        submittingRef.current = false;
        setIsSubmitting(false);
      });
  };

  const bothChecked = checkbox1 && checkbox2;
  const canSendCode = bothChecked && cooldown === 0 && !isSendingCode && !isSubmitting;
  const canSubmit = hasSentCode && code.length === 6 && !isSubmitting;

  let sendCodeState: 'default' | 'disabled' | 'cooldown';
  if (cooldown > 0) {
    sendCodeState = 'cooldown';
  } else if (canSendCode) {
    sendCodeState = 'default';
  } else {
    sendCodeState = 'disabled';
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="px-md pt-md pb-xl gap-md">
        <SectionLabel num="01">RISK · 风险告知</SectionLabel>
        <WarningBlock />

        <SectionLabel num="02">CONFIRM · 双重知晓确认</SectionLabel>
        <View className="rounded-md border border-line-soft bg-surface-alt px-sm">
          <CheckboxRow
            checked={checkbox1}
            label={COPY.checkbox1}
            ariaLabel="checkbox-1"
            onPress={() => setCheckbox1((v) => !v)}
          />
          <View className="bg-line-soft" style={{ height: 1, marginLeft: 26 }} />
          <CheckboxRow
            checked={checkbox2}
            label={COPY.checkbox2}
            ariaLabel="checkbox-2"
            onPress={() => setCheckbox2((v) => !v)}
          />
        </View>

        <SectionLabel num="03">VERIFY · 短信验证</SectionLabel>
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
        <Text className="text-center text-ink-subtle text-xs">{COPY.submitFootnote}</Text>
      </View>
    </View>
  );
}
