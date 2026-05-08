// LoginScreen.tsx (v2)
// Unified phone-SMS auth — no register concept user-facing.
// Reference: 网易云音乐 / 小红书 / 拼多多 大陆主流模式。
// Backend decides login vs auto-create. Single form, single CTA.
//
// State machine (5 states):
//   "idle" → "requesting_sms" → "sms_sent" → "submitting" → "success"
//   any of the above can fall to → "error"
//
// Tokens mirror v1 (brand / accent / ink / line / surface / ok / err / warn /
// spacing / radius / shadow / fontFamily). Animations via react-native-reanimated v3.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Platform } from 'react-native';
import Svg, { Rect, Circle, G, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export type LoginState =
  | 'idle'
  | 'requesting_sms'
  | 'sms_sent'
  | 'submitting'
  | 'success'
  | 'error';

export interface LoginScreenProps {
  state?: LoginState;
  /** Which step caused the error — drives the inline message location. */
  errorScope?: 'sms' | 'submit';
  onSendCode?: () => void;
  onSubmit?: () => void;
  onWeChat?: () => void;
  onGoogle?: () => void;
  onApple?: () => void;
  onHelp?: () => void;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────
// Spinner
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
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const ring =
    tone === 'white'
      ? 'border-white/30 border-t-white'
      : tone === 'brand'
        ? 'border-brand-200 border-t-brand-500'
        : 'border-line border-t-ink-subtle';
  return (
    <Animated.View
      style={[{ width: size, height: size }, style]}
      className={`rounded-full border-2 ${ring}`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Success check (pop-in scale)
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
      className="rounded-full bg-ok-soft items-center justify-center w-18 h-18"
    >
      <View className="rounded-full bg-ok items-center justify-center w-12 h-12">
        <Text className="text-white text-2xl font-bold">✓</Text>
      </View>
    </Animated.View>
  );
}

function useCountdown(seconds: number, active: boolean) {
  const [n, setN] = useState(seconds);
  useEffect(() => {
    if (!active) {
      setN(seconds);
      return;
    }
    setN(seconds);
    const id = setInterval(() => setN((v) => (v <= 1 ? 0 : v - 1)), 1000);
    return () => clearInterval(id);
  }, [active, seconds]);
  return n;
}

// ─────────────────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────────────────
function LogoMark() {
  // Mirrors assets/logo-mark.svg — blue tile, 12 white rays, orange halo + sun.
  return (
    <Svg width={56} height={56} viewBox="0 0 64 64">
      <Rect width={64} height={64} rx={14} fill="#2456E5" />
      <Circle cx={32} cy={32} r={22} fill="#FF8C00" opacity={0.18} />
      <G stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round">
        <Path d="M32 18 L32 8" />
        <Path d="M39 19.88 L44 11.22" />
        <Path d="M44.12 25 L52.78 20" />
        <Path d="M46 32 L56 32" />
        <Path d="M44.12 39 L52.78 44" />
        <Path d="M39 44.12 L44 52.78" />
        <Path d="M32 46 L32 56" />
        <Path d="M25 44.12 L20 52.78" />
        <Path d="M19.88 39 L11.22 44" />
        <Path d="M18 32 L8 32" />
        <Path d="M19.88 25 L11.22 20" />
        <Path d="M25 19.88 L20 11.22" />
      </G>
      <Circle cx={32} cy={32} r={9.5} fill="#FF8C00" />
      <Circle cx={29.5} cy={29.5} r={2.5} fill="#FFFFFF" opacity={0.3} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Top bar — close only
// ─────────────────────────────────────────────────────────────────────────
function TopBar({ onClose }: { onClose?: () => void }) {
  return (
    <View className="flex-row items-center h-11 px-1">
      <Pressable onPress={onClose} hitSlop={10}>
        <Text className="text-2xl text-ink leading-none">×</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Phone input (+86 prefix, no tabs)
// ─────────────────────────────────────────────────────────────────────────
function PhoneInput({
  value,
  onChangeText,
  disabled,
  errored,
}: {
  value: string;
  onChangeText: (s: string) => void;
  disabled?: boolean;
  errored?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const tone = errored ? 'border-err' : focused ? 'border-brand-500' : 'border-line';
  return (
    <View className={`flex-row items-center h-12 border-b ${tone} ${disabled ? 'opacity-60' : ''}`}>
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
// SMS input + send-code action
// ─────────────────────────────────────────────────────────────────────────
function SmsInput({
  value,
  onChangeText,
  errored,
  requesting,
  ticking,
  countdown,
  onSend,
  disabled,
}: {
  value: string;
  onChangeText: (s: string) => void;
  errored?: boolean;
  requesting?: boolean;
  ticking?: boolean;
  countdown?: number;
  onSend?: () => void;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const tone = errored ? 'border-err' : focused ? 'border-brand-500' : 'border-line';
  return (
    <View className={`flex-row items-center h-12 border-b ${tone}`}>
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
      <Pressable
        disabled={requesting || ticking}
        onPress={onSend}
        className="flex-row items-center gap-2 pl-2"
      >
        {requesting ? (
          <>
            <Spinner size={11} tone="muted" />
            <Text className="text-sm text-ink-subtle font-medium">发送中…</Text>
          </>
        ) : ticking ? (
          <Text className="text-sm text-ink-subtle font-medium font-mono">{countdown}s 后重发</Text>
        ) : (
          <Text className="text-sm text-brand-500 font-medium">获取验证码</Text>
        )}
      </Pressable>
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

function PrimaryButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const bg = disabled
    ? 'bg-brand-200'
    : loading
      ? 'bg-brand-300'
      : 'bg-brand-500 active:bg-brand-600';
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-12 rounded-full items-center justify-center flex-row gap-2.5 shadow-cta ${bg}`}
    >
      {loading ? <Spinner size={15} tone="white" /> : null}
      <Text className="text-base font-medium text-white">{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// OAuth circle buttons
// ─────────────────────────────────────────────────────────────────────────
function OAuthCircle({
  bg,
  label,
  children,
  onPress,
  disabled,
}: {
  bg: string;
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="items-center gap-1.5">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`w-12 h-12 rounded-full items-center justify-center ${bg} ${disabled ? 'opacity-50' : ''}`}
      >
        {children}
      </Pressable>
      <Text className="text-[11px] text-ink-subtle">{label}</Text>
    </View>
  );
}

function WeChatGlyph() {
  // Two overlapping speech bubbles, classic WeChat
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28">
      <Path
        d="M11 5C5.9 5 2 8.5 2 12.7c0 2.4 1.4 4.5 3.5 5.9l-.6 2.6 3.1-1.6c.94.18 1.93.28 2.95.28.32 0 .64-.01.95-.04C11.7 19.55 11.5 18.7 11.5 17.8c0-3.7 3.6-6.7 8-6.7.45 0 .9.03 1.34.09C20.05 7.45 16 5 11 5Z"
        fill="#fff"
      />
      <Circle cx={8.2} cy={11.2} r={1.05} fill="#07C160" />
      <Circle cx={13.8} cy={11.2} r={1.05} fill="#07C160" />
      <Path
        d="M27 18.5c0-3.05-3.13-5.5-7-5.5s-7 2.45-7 5.5c0 3.05 3.13 5.5 7 5.5.7 0 1.36-.08 2-.23l2.5 1.4-.55-2.1c1.85-1 3.05-2.55 3.05-4.57Z"
        fill="#fff"
      />
      <Circle cx={17.5} cy={18.2} r={0.9} fill="#07C160" />
      <Circle cx={22.5} cy={18.2} r={0.9} fill="#07C160" />
    </Svg>
  );
}
function GoogleGlyph() {
  return <Text className="text-ink text-xl font-bold">G</Text>;
}
function AppleGlyph() {
  return <Text className="text-white text-xl font-bold"></Text>;
}

// ─────────────────────────────────────────────────────────────────────────
// Success overlay
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
      <View className="absolute left-4 right-4 bottom-2 h-24 rounded-2xl bg-surface-alt p-3.5 opacity-60">
        <View className="h-2.5 w-1/3 rounded-sm bg-line mb-2.5" />
        <View className="h-2.5 w-3/4 rounded-sm bg-line mb-2.5" />
        <View className="h-2.5 w-1/2 rounded-sm bg-line" />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
export default function LoginScreen({
  state = 'idle',
  errorScope = 'sms',
  onSendCode,
  onSubmit,
  onWeChat,
  onGoogle,
  onApple,
  onHelp,
  onClose,
}: LoginScreenProps) {
  const [phone, setPhone] = useState('138 0013 8000');
  const [sms, setSms] = useState(
    state === 'error' && errorScope === 'submit'
      ? '381042'
      : state === 'submitting'
        ? '284917'
        : state === 'sms_sent'
          ? ''
          : '',
  );

  const requesting = state === 'requesting_sms';
  const submitting = state === 'submitting';
  const ticking =
    state === 'sms_sent' ||
    state === 'submitting' ||
    (state === 'error' && errorScope === 'submit');
  const remaining = useCountdown(60, ticking);

  const errorText =
    state !== 'error'
      ? null
      : errorScope === 'sms'
        ? '获取验证码失败，请稍后重试'
        : '验证码不正确，请重新输入';

  if (state === 'success') return <SuccessOverlay />;

  // Submit CTA gating: enabled only after sms_sent (and code looks 6 digits)
  const canSubmit =
    (state === 'sms_sent' ||
      state === 'submitting' ||
      (state === 'error' && errorScope === 'submit')) &&
    sms.replace(/\s/g, '').length >= 6;
  const ctaDisabled = !canSubmit && !submitting;

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <TopBar onClose={onClose} />

      {/* Header (centered) */}
      <View className="mt-3 items-center gap-2">
        <LogoMark />
        <Text className="text-3xl font-bold text-ink mt-3.5 tracking-tight text-center">
          欢迎回来
        </Text>
        <Text className="text-sm text-ink-muted text-center">把这一段日子，过得不虚此生。</Text>
      </View>

      {/* Form */}
      <View className="mt-9 gap-3">
        <PhoneInput
          value={phone}
          onChangeText={setPhone}
          disabled={requesting || submitting}
          errored={state === 'error' && errorScope === 'sms'}
        />
        <SmsInput
          value={sms}
          onChangeText={setSms}
          requesting={requesting}
          ticking={ticking && remaining > 0}
          countdown={remaining}
          onSend={onSendCode}
          disabled={submitting}
          errored={state === 'error' && errorScope === 'submit'}
        />
        {errorText ? <ErrorRow text={errorText} /> : null}
      </View>

      {/* CTA */}
      <View className="mt-7">
        <PrimaryButton
          label={submitting ? '登录中…' : '登录 / 注册'}
          loading={submitting}
          disabled={ctaDisabled}
          onPress={onSubmit}
        />
      </View>

      <View className="flex-1" />

      {/* OAuth row */}
      <View className="mt-6 flex-row items-center gap-3">
        <View className="flex-1 h-px bg-line-soft" />
        <Text className="text-[11px] text-ink-subtle">其他登录方式</Text>
        <View className="flex-1 h-px bg-line-soft" />
      </View>

      <View className="mt-4 flex-row justify-center gap-10">
        <OAuthCircle bg="bg-[#07C160]" label="微信" onPress={onWeChat}>
          <WeChatGlyph />
        </OAuthCircle>
        <OAuthCircle bg="bg-surface border border-line" label="Google" onPress={onGoogle}>
          <GoogleGlyph />
        </OAuthCircle>
        {/* iOS-only: Android caller should `Platform.OS === 'ios'` gate this. */}
        {Platform.OS !== 'android' ? (
          <OAuthCircle bg="bg-ink" label="Apple" onPress={onApple}>
            <AppleGlyph />
          </OAuthCircle>
        ) : null}
      </View>

      {/* Help link (M1.3) */}
      <View className="items-center mt-5">
        <Pressable onPress={onHelp} hitSlop={6}>
          <Text className="text-xs text-ink-muted">登录遇到问题</Text>
        </Pressable>
      </View>

      {/* Implicit agreement */}
      <Text className="text-center text-[11px] text-ink-subtle mt-3">
        登录即表示同意 <Text className="text-brand-500">《服务条款》</Text>
        <Text className="text-brand-500">《隐私政策》</Text>
      </Text>
    </View>
  );
}
