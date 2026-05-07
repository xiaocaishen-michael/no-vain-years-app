// Login page (M1.3 phase 2 — UI 完成 per ADR-0017 + mockup v2 落地).
// Source: apps/native/spec/login/design/source-v2/LoginScreen.tsx
//         apps/native/spec/login/design/handoff.md (翻译期决策)
//
// State machine: idle → requesting_sms → sms_sent → submitting → success | error
// (errorScope: 'sms' | 'submit' | null — drives which input shows red border + ErrorRow)

import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppleButton,
  ErrorRow,
  GoogleButton,
  LogoMark,
  PhoneInput,
  PrimaryButton,
  SmsInput,
  Spinner,
  SuccessCheck,
  WechatButton,
} from '@nvy/ui';

import { PHONE_REGEX, phoneSmsAuthSchema } from '../../lib/validation/login';
import { useLoginForm } from '../../lib/hooks/use-login-form';

// Per spec FR-002: PhoneInput 仅显示数字部分；提交前拼 +86 prefix.
const toE164 = (rawDigits: string): string => `+86${rawDigits.replace(/\s+/g, '')}`;

// spec C T6 — freeze-period intercept modal (PHASE 1 PLACEHOLDER per ADR-0017
// 类 1 边界: bare RN, no @nvy/ui). Visuals (padding/colors/elevation) pending
// mockup; behavior is fully wired against US4 acceptance scenarios + FR-011.
const FREEZE_COPY = {
  description: '账号处于注销冻结期，可撤销注销恢复账号',
  cancelDelete: '撤销',
  keep: '保持',
} as const;

function SuccessOverlay() {
  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <View className="flex-row items-center h-11 px-1" />
      <View className="flex-1 items-center justify-center gap-4 pb-20">
        <SuccessCheck />
        <Text className="text-xl font-semibold text-ink mt-2">登录成功</Text>
        <View className="flex-row items-center gap-2">
          <Spinner size={12} tone="muted" />
          <Text className="text-sm text-ink-muted">正在进入今日时间线…</Text>
        </View>
      </View>
      {/* Skeleton of the next screen peeking from the bottom */}
      <View className="absolute left-4 right-4 bottom-2 h-24 rounded-2xl bg-surface-alt p-3.5 opacity-60">
        <View className="h-2.5 w-1/3 rounded-sm bg-line mb-2.5" />
        <View className="h-2.5 w-3/4 rounded-sm bg-line mb-2.5" />
        <View className="h-2.5 w-1/2 rounded-sm bg-line" />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const {
    state,
    errorToast,
    errorScope,
    smsCountdown,
    showFrozenModal,
    clearFrozenModal,
    requestSms,
    submit,
    showPlaceholderToast,
    clearError,
  } = useLoginForm();

  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');

  const requesting = state === 'requesting_sms';
  const submitting = state === 'submitting';
  const isLoading = requesting || submitting;
  const isError = state === 'error';
  const isSuccess = state === 'success';

  const phoneE164 = useMemo(() => toE164(phone), [phone]);
  const phoneValid = useMemo(() => PHONE_REGEX.test(phoneE164), [phoneE164]);
  const formValid = useMemo(
    () => phoneSmsAuthSchema.safeParse({ phone: phoneE164, smsCode }).success,
    [phoneE164, smsCode],
  );

  const handleSubmit = () => {
    if (!formValid || isLoading) return;
    void submit(phoneE164, smsCode);
  };

  const handleSendSms = () => {
    if (!phoneValid || smsCountdown > 0 || isLoading) return;
    void requestSms(phoneE164);
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
  };

  // spec C T6 — freeze modal handlers
  const handleCancelDelete = () => {
    clearFrozenModal();
    router.push(`/(auth)/cancel-deletion?phone=${encodeURIComponent(phoneE164)}`);
  };

  // [保持] / Android back / scrim tap → clear modal + reset form (per plan.md
  // 决策 5 — keep is form-clearing so user re-enters fresh credentials).
  const handleKeepLogin = () => {
    clearFrozenModal();
    setPhone('');
    setSmsCode('');
  };

  const onPhoneChange = (next: string) => {
    setPhone(next);
    if (errorToast) clearError();
  };
  const onSmsChange = (next: string) => {
    setSmsCode(next);
    if (errorToast) clearError();
  };

  if (isSuccess) {
    return <SuccessOverlay />;
  }

  // Per FR-015 + plan.md UI 段：errorScope decides where the red border + ErrorRow render.
  const phoneErrored = isError && errorScope === 'sms';
  const smsErrored = isError && errorScope === 'submit';
  const errorMessage = isError ? errorToast : null;
  const placeholderBanner = !isError && errorToast ? errorToast : null;

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      {/* TopBar — close button (per FR-008 mockup v2 落地) */}
      <View className="flex-row items-center h-11 px-1">
        <Pressable
          onPress={handleClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="关闭"
        >
          <Text className="text-2xl text-ink leading-none">×</Text>
        </Pressable>
      </View>

      {/* Header (centered) */}
      <View className="mt-3 items-center gap-2">
        <LogoMark />
        <Text className="text-3xl font-bold text-ink mt-3.5 tracking-tight text-center">
          欢迎回来
        </Text>
        <Text className="text-sm text-ink-muted text-center">把这一段日子，过得不虚此生。</Text>
      </View>

      {/* Form (per FR-001 单 form, no tab) */}
      <View className="mt-9 gap-3">
        <PhoneInput
          value={phone}
          onChangeText={onPhoneChange}
          disabled={isLoading}
          errored={phoneErrored}
        />
        <SmsInput
          value={smsCode}
          onChangeText={onSmsChange}
          requesting={requesting}
          countdown={smsCountdown > 0 ? smsCountdown : null}
          disabled={submitting}
          errored={smsErrored}
          onSend={handleSendSms}
        />
        {errorMessage ? <ErrorRow text={errorMessage} /> : null}
      </View>

      {/* CTA — "登录" per spec FR-001 (NOT mockup's "登录 / 注册"，drift fix per handoff § 5.2) */}
      <View className="mt-7">
        <PrimaryButton
          label={submitting ? '登录中…' : '登录'}
          loading={submitting}
          disabled={!formValid}
          onPress={handleSubmit}
        />
      </View>

      {/* Placeholder banner (transient feedback for "Coming in M1.3" 等 idle 文案) */}
      {placeholderBanner ? (
        <View className="mt-4 self-center px-4 py-2 bg-brand-soft rounded-md">
          <Text className="text-sm text-brand-500" accessibilityRole="alert">
            {placeholderBanner}
          </Text>
        </View>
      ) : null}

      <View className="flex-1" />

      {/* OAuth divider */}
      <View className="mt-6 flex-row items-center gap-3">
        <View className="flex-1 h-px bg-line-soft" />
        <Text className="text-[11px] text-ink-subtle">其他登录方式</Text>
        <View className="flex-1 h-px bg-line-soft" />
      </View>

      {/* OAuth row — 微信 / Google 全平台 + Apple iOS-only (per FR-007 + handoff § 5.3) */}
      <View className="mt-4 flex-row justify-center gap-10">
        <WechatButton onPress={() => showPlaceholderToast('wechat')} disabled={isLoading} />
        <GoogleButton onPress={() => showPlaceholderToast('google')} disabled={isLoading} />
        {Platform.OS === 'ios' ? (
          <AppleButton onPress={() => showPlaceholderToast('apple')} disabled={isLoading} />
        ) : null}
      </View>

      {/* Help link (per FR-009, M1.3 实施) */}
      <View className="items-center mt-5">
        <Pressable
          onPress={() => showPlaceholderToast('help')}
          hitSlop={6}
          accessibilityRole="link"
          accessibilityLabel="登录遇到问题（即将上线）"
        >
          <Text className="text-xs text-ink-muted">登录遇到问题</Text>
        </Pressable>
      </View>

      {/* Implicit consent — "与" 字补齐 (per handoff § 5.2 drift 4) */}
      <Text className="text-center text-[11px] text-ink-subtle mt-3">
        登录即表示同意 <Text className="text-brand-500">《服务条款》</Text> 与{' '}
        <Text className="text-brand-500">《隐私政策》</Text>
      </Text>

      {/* PHASE 1 PLACEHOLDER — spec C T6 freeze-period modal; visuals pending mockup. */}
      <Modal
        accessibilityLabel="freeze-modal"
        visible={showFrozenModal}
        transparent
        animationType="fade"
        onRequestClose={handleKeepLogin}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-lg">
          <View className="w-full bg-surface rounded-xl p-lg gap-4">
            <Text className="text-base text-ink">{FREEZE_COPY.description}</Text>
            <View className="flex-row justify-end gap-3">
              <Pressable
                onPress={handleKeepLogin}
                accessibilityRole="button"
                accessibilityLabel="freeze-keep"
                hitSlop={6}
              >
                <Text className="text-sm text-ink-muted">{FREEZE_COPY.keep}</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelDelete}
                accessibilityRole="button"
                accessibilityLabel="freeze-cancel-delete"
                hitSlop={6}
              >
                <Text className="text-sm text-brand-500">{FREEZE_COPY.cancelDelete}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
