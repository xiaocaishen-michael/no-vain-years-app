// OnboardingScreen.tsx
// AuthGate-driven onboarding (FR-011 不可跳过). Single field: displayName.
// Mirrors login v2 design tokens — zero new tokens introduced.
//
// State machine (4 states):
//   "idle" → "submitting" → "success"
//   any of the above can fall to → "error"
//
// Tokens: brand / accent / ink / line / surface / ok / warn / err / spacing /
// radius / shadow / fontFamily — byte-identical to LoginScreen v2.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
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

export type OnboardingState = 'idle' | 'submitting' | 'success' | 'error';

export interface OnboardingScreenProps {
  state?: OnboardingState;
  onSubmit?: (displayName: string) => void;
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
      className="rounded-full bg-ok-soft items-center justify-center w-20 h-20"
    >
      <View className="rounded-full bg-ok items-center justify-center w-14 h-14">
        <Text className="text-white text-3xl font-bold">✓</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Logo (mirror of login v2 — assets/logo-mark.svg)
// ─────────────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <Svg width={40} height={40} viewBox="0 0 64 64">
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
// Display-name input (single field; no decorations).
// 1..32 chars, allows CJK / latin / digits / emoji per FR copy.
// ─────────────────────────────────────────────────────────────────────────
function DisplayNameInput({
  value,
  onChangeText,
  disabled,
  errored,
  onCommit,
}: {
  value: string;
  onChangeText: (s: string) => void;
  disabled?: boolean;
  errored?: boolean;
  onCommit?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const tone = errored ? 'border-err' : focused ? 'border-brand-500' : 'border-line';
  const len = [...value].length; // count grapheme-ish (good enough; product validates server-side)

  return (
    <View>
      <View
        className={`flex-row items-center h-12 border-b ${tone} ${disabled ? 'opacity-60' : ''}`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          maxLength={32}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onCommit}
          placeholder="给自己起个昵称"
          placeholderTextColor="#999999"
          className="flex-1 text-base text-ink font-sans"
        />
        {/* live char counter — 0/32 idle, 4/32 mid-typing, etc. */}
        <Text className={`text-xs font-mono ${len > 32 ? 'text-err' : 'text-ink-subtle'} pl-2`}>
          {len}/32
        </Text>
      </View>
      <Text className="text-xs text-ink-subtle mt-1.5">
        1 至 32 字符，支持中文 / 字母 / 数字 / emoji
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Error row (inline below the input)
// ─────────────────────────────────────────────────────────────────────────
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
// Primary button (idle / disabled / loading)
// ─────────────────────────────────────────────────────────────────────────
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
    ? 'bg-brand-soft'
    : loading
      ? 'bg-brand-300'
      : 'bg-brand-500 active:bg-brand-600';
  const fg = disabled ? 'text-brand-300' : 'text-white';
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-12 rounded-full items-center justify-center flex-row gap-2.5 shadow-cta ${bg}`}
    >
      {loading ? <Spinner size={15} tone="white" /> : null}
      <Text className={`text-base font-medium ${fg}`}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Success overlay (post-submit; AuthGate redirects after ~600ms)
// ─────────────────────────────────────────────────────────────────────────
function SuccessOverlay() {
  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <View className="flex-1 items-center justify-center gap-4 pb-20">
        <SuccessCheck />
        <Text className="text-xl font-semibold text-ink mt-2">完成！</Text>
        <View className="flex-row items-center gap-2">
          <Spinner size={12} tone="muted" />
          <Text className="text-sm text-ink-muted">正在进入今日时间线…</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ state = 'idle', onSubmit }: OnboardingScreenProps) {
  const [name, setName] = useState(
    state === 'error' ? '@@bad_name' : state === 'submitting' ? '时间旅人' : '',
  );

  const submitting = state === 'submitting';
  const errored = state === 'error';

  const trimmed = name.trim();
  const len = [...trimmed].length;
  const valid = len >= 1 && len <= 32;
  const ctaDisabled = !valid;

  const errorText = errored ? '昵称不合法，请使用中文 / 字母 / 数字 / emoji' : null;

  if (state === 'success') return <SuccessOverlay />;

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      {/* Top — title only, no close, no skip (FR-011 不可跳过) */}
      <View className="flex-row items-center h-11" />

      {/* Header — centered (mirrors login v2) */}
      <View className="mt-4 items-center gap-3">
        <LogoMark />
        <Text
          className="text-3xl font-bold text-ink tracking-tight text-center"
          style={{ fontSize: 28 }}
        >
          完善个人资料
        </Text>
        <Text className="text-sm text-ink-muted leading-relaxed text-center">
          起一个昵称，随时可在设置里修改。
        </Text>
      </View>

      {/* Form */}
      <View className="mt-9">
        <DisplayNameInput
          value={name}
          onChangeText={setName}
          disabled={submitting}
          errored={errored}
          onCommit={() => valid && onSubmit?.(trimmed)}
        />
        {errorText ? <ErrorRow text={errorText} /> : null}
      </View>

      {/* CTA */}
      <View className="mt-7">
        <PrimaryButton
          label={submitting ? '提交中…' : '提交'}
          loading={submitting}
          disabled={ctaDisabled && !submitting}
          onPress={() => valid && onSubmit?.(trimmed)}
        />
      </View>

      <View className="flex-1" />

      {/* Footer reassurance — no escape hatch, just gentle reminder */}
      <Text className="text-center text-[11px] text-ink-subtle mb-2">
        昵称可在「设置」中随时修改
      </Text>
    </View>
  );
}
