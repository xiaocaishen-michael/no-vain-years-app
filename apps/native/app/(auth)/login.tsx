import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  GoogleButton,
  LogoMark,
  PasswordField,
  PhoneInput,
  PrimaryButton,
  SmsInput,
  Spinner,
  SuccessCheck,
  TabSwitcher,
  type TabOption,
} from '@nvy/ui';

import { PHONE_REGEX, loginPasswordSchema, loginSmsSchema } from '../../lib/validation/login';
import { useLoginForm, type LoginTab } from '../../lib/hooks/use-login-form';

// Tab order matches mockup (apps/native/spec/login/design/source/LoginScreen.tsx)：
// 短信登录 first / 密码登录 second. Default tab = "password" per FR-001（hook 起始值控制）。
const TAB_OPTIONS: ReadonlyArray<TabOption<LoginTab>> = [
  { key: 'sms', label: '短信登录' },
  { key: 'password', label: '密码登录' },
] as const;

// Per spec FR-002 + plan token discipline: PhoneInput 仅显示数字部分；
// 提交前拼 +86 prefix，与后端契约一致（zod regex: /^\+861[3-9]\d{9}$/）。
const toE164 = (rawDigits: string): string => `+86${rawDigits.replace(/\s+/g, '')}`;

function SuccessOverlay() {
  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
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
    tab,
    setTab,
    state,
    errorToast,
    smsCountdown,
    submitPassword,
    submitSms,
    requestSms,
    showPlaceholderToast,
    clearError,
  } = useLoginForm();

  // Form input state — phone is shared across tabs (FR-001).
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');

  const isLoading = state === 'submitting';
  const isError = state === 'error';
  const isSuccess = state === 'success';

  const phoneValid = useMemo(() => PHONE_REGEX.test(toE164(phone)), [phone]);

  const formValid = useMemo(() => {
    const phoneE164 = toE164(phone);
    if (tab === 'password') {
      return loginPasswordSchema.safeParse({ phone: phoneE164, password }).success;
    }
    return loginSmsSchema.safeParse({ phone: phoneE164, smsCode }).success;
  }, [tab, phone, password, smsCode]);

  const handleSubmit = () => {
    if (!formValid || isLoading) return;
    const phoneE164 = toE164(phone);
    if (tab === 'password') {
      void submitPassword(phoneE164, password);
    } else {
      void submitSms(phoneE164, smsCode);
    }
  };

  const handleSendSms = () => {
    if (!phoneValid || smsCountdown > 0) return;
    void requestSms(toE164(phone));
  };

  const onPhoneChange = (next: string) => {
    setPhone(next);
    if (errorToast) clearError();
  };
  const onPasswordChange = (next: string) => {
    setPassword(next);
    if (errorToast) clearError();
  };
  const onSmsChange = (next: string) => {
    setSmsCode(next);
    if (errorToast) clearError();
  };

  if (isSuccess) {
    return <SuccessOverlay />;
  }

  // Render errorToast as input-level errorText when state='error' (matches mockup)；
  // placeholder/idle messages（来自 showPlaceholderToast）作为顶部 banner 渲染。
  const inputErrorText = isError ? errorToast : null;
  const placeholderBanner = !isError && errorToast ? errorToast : null;

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      {/* Header */}
      <View className="mt-3 items-start gap-2">
        <LogoMark />
        <Text className="text-3xl font-bold text-ink mt-3.5 tracking-tight">欢迎回来</Text>
        <Text className="text-sm text-ink-muted">把这一段日子，过得不虚此生。</Text>
      </View>

      {/* Tabs */}
      <View className="mt-7 mb-4">
        <TabSwitcher<LoginTab>
          value={tab}
          onChange={setTab}
          options={TAB_OPTIONS}
          disabled={isLoading}
        />
      </View>

      {/* Inputs */}
      <View className="gap-3">
        <PhoneInput value={phone} onChangeText={onPhoneChange} disabled={isLoading} />
        {tab === 'sms' ? (
          <SmsInput
            value={smsCode}
            onChangeText={onSmsChange}
            errorText={inputErrorText}
            countdown={smsCountdown > 0 ? smsCountdown : null}
            disabled={isLoading}
            onSend={handleSendSms}
          />
        ) : (
          <PasswordField
            value={password}
            onChangeText={onPasswordChange}
            errorText={inputErrorText}
            disabled={isLoading}
          />
        )}
      </View>

      {/* Helper row — only password tab shows "忘记密码" placeholder */}
      <View className="mt-3.5 flex-row items-center justify-end h-5">
        {tab === 'password' ? (
          <Pressable
            onPress={() => showPlaceholderToast('forgot-password')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="忘记密码（即将上线）"
          >
            <Text className="text-sm text-brand-500">忘记密码</Text>
          </Pressable>
        ) : null}
      </View>

      {/* CTA — label per D4: SMS 模式也用 "登录"，不暗示自动注册 */}
      <View className="mt-5">
        <PrimaryButton
          label={isLoading ? '登录中…' : '登录'}
          loading={isLoading}
          disabled={!formValid}
          onPress={handleSubmit}
        />
      </View>

      {/* Divider */}
      <View className="mt-6 flex-row items-center gap-3">
        <View className="flex-1 h-px bg-line-soft" />
        <Text className="text-[11px] text-ink-subtle">其他登录方式</Text>
        <View className="flex-1 h-px bg-line-soft" />
      </View>

      {/* OAuth row — M1.2 仅 Google placeholder（per D1） */}
      <View className="mt-4 flex-row justify-center gap-6">
        <GoogleButton onPress={() => showPlaceholderToast('google')} disabled={isLoading} />
      </View>

      {/* Placeholder banner（transient feedback for "Coming in M1.3" 等 idle 文案） */}
      {placeholderBanner ? (
        <View className="mt-4 self-center px-4 py-2 bg-brand-soft rounded-md">
          <Text className="text-sm text-brand-500" accessibilityRole="alert">
            {placeholderBanner}
          </Text>
        </View>
      ) : null}

      <View className="flex-1" />

      {/* Register footer — "创建一个" link per D9 */}
      <View className="items-center mb-2">
        <Text className="text-sm text-ink-muted">
          还没账号？
          <Text
            onPress={() => router.push('/(auth)/register')}
            className="text-brand-500 font-medium"
            accessibilityRole="link"
            accessibilityLabel="前往注册"
          >
            创建一个
          </Text>
        </Text>
      </View>

      {/* Footer 隐式同意（per D3，不再加显式 AgreeRow） */}
      <Text className="text-center text-[11px] text-ink-subtle">
        登录即表示同意 <Text className="text-brand-500">服务协议</Text> 与{' '}
        <Text className="text-brand-500">隐私政策</Text>
      </Text>
    </View>
  );
}
