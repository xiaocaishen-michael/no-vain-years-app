// LoginScreen.tsx
// React Native + NativeWind login screen for 不虚此生 / no-vain-years.
// Three login methods (SMS / Password / Google) + register footer.
// State is driven by `state` prop so the screen can be rendered in any of:
//   "default" | "loading" | "error" | "success"
//
// Tailwind tokens map to packages/design-tokens:
//   brand-{50..900,soft}  ink / ink-muted / ink-subtle
//   line / line-soft       surface / surface-alt / surface-sunken
//   ok / err / warn (+soft)  spacing.md/lg/xl  rounded-md/lg/full
//   shadow-sm / shadow-cta
//
// All animation goes through react-native-reanimated v3 — no @keyframes.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export type LoginState = 'default' | 'loading' | 'error' | 'success';
export type LoginMode = 'sms' | 'password';

export interface LoginScreenProps {
  state?: LoginState;
  initialMode?: LoginMode;
  onLogin?: () => void;
  onGoogle?: () => void;
  onRegister?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────
// Spinner — reanimated rotation, no CSS keyframes
// ─────────────────────────────────────────────────────────────────────────
function Spinner({
  size = 16,
  tone = 'white',
}: {
  size?: number;
  tone?: 'white' | 'muted' | 'brand';
}) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [r]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r.value}deg` }],
  }));

  const ringTone =
    tone === 'white'
      ? 'border-white/30 border-t-white'
      : tone === 'brand'
        ? 'border-brand-200 border-t-brand-500'
        : 'border-line border-t-ink-subtle';

  return (
    <Animated.View
      style={[{ width: size, height: size }, style]}
      className={`rounded-full border-2 ${ringTone}`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Success check — drawn with Reanimated scale-in
// ─────────────────────────────────────────────────────────────────────────
function SuccessCheck() {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withSequence(
      withTiming(1.1, { duration: 240, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 140, easing: Easing.out(Easing.cubic) }),
    );
  }, [s]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
    opacity: s.value === 0 ? 0 : 1,
  }));
  return (
    <Animated.View
      style={style}
      className="w-18 h-18 rounded-full bg-ok-soft items-center justify-center"
    >
      <View className="w-12 h-12 rounded-full bg-ok items-center justify-center">
        <Text className="text-white text-2xl font-bold">✓</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 60-second SMS countdown hook
// ─────────────────────────────────────────────────────────────────────────
function useCountdown(seconds: number, active: boolean) {
  const [n, setN] = useState(seconds);
  useEffect(() => {
    if (!active) {
      setN(seconds);
      return;
    }
    setN(seconds);
    const id = setInterval(() => {
      setN((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [active, seconds]);
  return n;
}

// ─────────────────────────────────────────────────────────────────────────
// Tab switcher (B站-style underline bar)
// ─────────────────────────────────────────────────────────────────────────
function TabSwitcher({
  value,
  onChange,
  disabled,
}: {
  value: LoginMode;
  onChange: (m: LoginMode) => void;
  disabled?: boolean;
}) {
  const tabs: { key: LoginMode; label: string }[] = [
    { key: 'sms', label: '短信登录' },
    { key: 'password', label: '密码登录' },
  ];
  return (
    <View className="flex-row gap-7">
      {tabs.map((t) => {
        const on = value === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => !disabled && onChange(t.key)}
            disabled={disabled}
            className="pb-2"
          >
            <Text
              className={
                on ? 'text-lg font-semibold text-ink' : 'text-base font-medium text-ink-subtle'
              }
            >
              {t.label}
            </Text>
            {on ? (
              <View className="absolute left-0 right-0 bottom-0 h-1 bg-brand-500 rounded-full" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Phone input with +86 prefix
// ─────────────────────────────────────────────────────────────────────────
function PhoneInput({
  value,
  onChangeText,
  disabled,
}: {
  value: string;
  onChangeText: (s: string) => void;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={`flex-row items-center h-12 border-b ${
        focused ? 'border-brand-500' : 'border-line'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-center gap-1 pr-2">
        <Text className="text-base font-medium text-ink">+86</Text>
        <Text className="text-xs text-ink-subtle">▾</Text>
      </View>
      <View className="w-px h-4 bg-line mr-3" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        placeholder="请输入手机号"
        placeholderTextColor="#999999"
        keyboardType="phone-pad"
        className="flex-1 text-base text-ink font-sans tracking-wide"
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SMS code input + countdown send button
// ─────────────────────────────────────────────────────────────────────────
function SmsInput({
  value,
  onChangeText,
  errorText,
  countdown,
  disabled,
  onSend,
}: {
  value: string;
  onChangeText: (s: string) => void;
  errorText?: string | null;
  countdown: number | null; // null = idle, >0 = ticking
  disabled?: boolean;
  onSend?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const ticking = countdown !== null && countdown > 0;
  const borderTone = errorText ? 'border-err' : focused ? 'border-brand-500' : 'border-line';

  return (
    <View>
      <View className={`flex-row items-center h-12 border-b ${borderTone}`}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          placeholder="请输入 6 位验证码"
          placeholderTextColor="#999999"
          maxLength={6}
          keyboardType="number-pad"
          className="flex-1 text-base text-ink font-sans tracking-widest"
        />
        <Pressable disabled={ticking} onPress={onSend} className="flex-row items-center gap-2 pl-2">
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

// ─────────────────────────────────────────────────────────────────────────
// Password input with show/hide toggle
// ─────────────────────────────────────────────────────────────────────────
function PasswordField({
  value,
  onChangeText,
  errorText,
  disabled,
}: {
  value: string;
  onChangeText: (s: string) => void;
  errorText?: string | null;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const borderTone = errorText ? 'border-err' : focused ? 'border-brand-500' : 'border-line';

  return (
    <View>
      <View className={`flex-row items-center h-12 border-b ${borderTone}`}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          secureTextEntry={!show}
          placeholder="请输入密码"
          placeholderTextColor="#999999"
          className="flex-1 text-base text-ink font-sans"
        />
        <Pressable onPress={() => setShow((s) => !s)} className="px-1 py-1">
          <Text className="text-sm text-ink-subtle">{show ? '隐藏' : '显示'}</Text>
        </Pressable>
      </View>
      {errorText ? <ErrorRow text={errorText} /> : null}
    </View>
  );
}

function ErrorRow({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-1.5 mt-1.5">
      <View className="w-3.5 h-3.5 rounded-full bg-err items-center justify-center">
        <Text className="text-white text-[10px] font-bold leading-none">!</Text>
      </View>
      <Text className="text-xs text-err">{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Primary login CTA
// ─────────────────────────────────────────────────────────────────────────
function PrimaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      className={`h-12 rounded-full items-center justify-center flex-row gap-2.5 shadow-cta ${
        loading ? 'bg-brand-300' : 'bg-brand-500 active:bg-brand-600'
      }`}
    >
      {loading ? <Spinner size={15} tone="white" /> : null}
      <Text className="text-base font-medium text-white">{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Google OAuth circle button
// ─────────────────────────────────────────────────────────────────────────
function GoogleButton({ onPress, disabled }: { onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-12 h-12 rounded-full border border-line bg-surface items-center justify-center ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <Image
        source={{
          uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
        }}
        className="w-5 h-5"
        resizeMode="contain"
      />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Agreement checkbox
// ─────────────────────────────────────────────────────────────────────────
function AgreeRow({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-1.5">
      <View
        className={`w-3.5 h-3.5 rounded-full items-center justify-center ${
          checked ? 'bg-brand-500' : 'bg-surface border border-line-strong'
        }`}
      >
        {checked ? <Text className="text-white text-[8px] font-bold leading-none">✓</Text> : null}
      </View>
      <Text className="text-xs text-ink-subtle">
        已阅读并同意 <Text className="text-brand-500">服务协议</Text>
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Logo mark
// ─────────────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <View className="w-11 h-11 rounded-xl bg-brand-500 items-center justify-center">
      <Text className="text-white text-xl font-bold">不</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Top bar (close + skip)
// ─────────────────────────────────────────────────────────────────────────
function TopBar({ onClose, onSkip }: { onClose?: () => void; onSkip?: () => void }) {
  return (
    <View className="flex-row items-center justify-between h-11 px-1">
      <Pressable onPress={onClose} hitSlop={10}>
        <Text className="text-2xl text-ink leading-none">×</Text>
      </Pressable>
      <Pressable onPress={onSkip} hitSlop={10}>
        <Text className="text-sm text-ink-muted">跳过</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Success overlay (post-login redirect)
// ─────────────────────────────────────────────────────────────────────────
function SuccessOverlay() {
  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <TopBar />
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

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────
export default function LoginScreen({
  state = 'default',
  initialMode = 'sms',
  onLogin,
  onGoogle,
  onRegister,
}: LoginScreenProps) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [phone, setPhone] = useState('138 0013 8000');
  const [pw, setPw] = useState(state === 'default' ? '' : '********');
  const [sms, setSms] = useState(state === 'error' ? '381042' : state === 'loading' ? '' : '');
  const [agree, setAgree] = useState(true);

  const isLoading = state === 'loading';
  const isError = state === 'error';
  const isSuccess = state === 'success';

  // Active countdown only while we're in the "loading" SMS sub-state
  const remaining = useCountdown(60, isLoading && mode === 'sms');
  const countdown = isLoading && mode === 'sms' ? remaining : null;

  const errorText =
    isError && mode === 'sms'
      ? '验证码不正确，请重新输入'
      : isError && mode === 'password'
        ? '手机号或密码错误'
        : null;

  if (isSuccess) return <SuccessOverlay />;

  const ctaLabel = isLoading
    ? mode === 'sms'
      ? '验证码已发送…'
      : '登录中…'
    : mode === 'sms'
      ? '登录 / 注册'
      : '登录';

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <TopBar />

      {/* Header */}
      <View className="mt-3 items-start gap-2">
        <LogoMark />
        <Text className="text-3xl font-bold text-ink mt-3.5 tracking-tight">欢迎回来</Text>
        <Text className="text-sm text-ink-muted">把这一段日子，过得不虚此生。</Text>
      </View>

      {/* Tabs */}
      <View className="mt-7 mb-4">
        <TabSwitcher value={mode} onChange={setMode} disabled={isLoading} />
      </View>

      {/* Inputs */}
      <View className="gap-3">
        <PhoneInput value={phone} onChangeText={setPhone} disabled={isLoading} />
        {mode === 'sms' ? (
          <SmsInput
            value={sms}
            onChangeText={setSms}
            errorText={errorText}
            countdown={countdown}
            disabled={isLoading && (countdown ?? 0) > 0}
          />
        ) : (
          <PasswordField
            value={pw}
            onChangeText={setPw}
            errorText={errorText}
            disabled={isLoading}
          />
        )}
      </View>

      {/* Helper row */}
      <View className="mt-3.5 flex-row items-center justify-between">
        <AgreeRow checked={agree} onToggle={() => setAgree((v) => !v)} />
        {mode === 'password' ? (
          <Pressable hitSlop={6}>
            <Text className="text-sm text-brand-500">忘记密码</Text>
          </Pressable>
        ) : null}
      </View>

      {/* CTA */}
      <View className="mt-5">
        <PrimaryButton label={ctaLabel} loading={isLoading} onPress={onLogin} />
      </View>

      {/* Divider */}
      <View className="mt-6 flex-row items-center gap-3">
        <View className="flex-1 h-px bg-line-soft" />
        <Text className="text-[11px] text-ink-subtle">其他登录方式</Text>
        <View className="flex-1 h-px bg-line-soft" />
      </View>

      {/* Google OAuth */}
      <View className="mt-4 flex-row justify-center gap-6">
        <GoogleButton onPress={onGoogle} disabled={isLoading} />
      </View>

      <View className="flex-1" />

      {/* Register footer */}
      <View className="items-center mb-2">
        <Text className="text-sm text-ink-muted">
          还没账号？
          <Text onPress={onRegister} className="text-brand-500 font-medium">
            创建一个
          </Text>
        </Text>
      </View>
      <Text className="text-center text-[11px] text-ink-subtle">
        登录即表示同意 <Text className="text-brand-500">服务协议</Text> 与{' '}
        <Text className="text-brand-500">隐私政策</Text>
      </Text>
    </View>
  );
}
