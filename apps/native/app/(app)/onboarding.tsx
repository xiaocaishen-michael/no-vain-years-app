// /(app)/onboarding — AuthGate-driven 完善昵称卡点（FR-011 不可跳过）。
// 视觉 mirror login v2 design tokens（0 新增）；5 个子组件复用 @nvy/ui，
// DisplayNameInput / SuccessOverlay 本页 inline（once-only）。
// 业务状态由 useOnboardingForm 驱动；hook 不跳路由，AuthGate 监听
// store.displayName 后由 _layout.tsx redirect 进 (app)/。

import { ErrorRow, LogoMark, PrimaryButton, Spinner, SuccessCheck } from '@nvy/ui';
import { useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { useOnboardingForm } from '../../lib/hooks/use-onboarding-form';

interface DisplayNameInputProps {
  value: string;
  onChangeText: (s: string) => void;
  disabled?: boolean;
  errored?: boolean;
  onCommit?: () => void;
}

function DisplayNameInput({
  value,
  onChangeText,
  disabled,
  errored,
  onCommit,
}: DisplayNameInputProps) {
  const [focused, setFocused] = useState(false);
  const tone = errored ? 'border-err' : focused ? 'border-brand-500' : 'border-line';
  const len = [...value].length;

  return (
    <View>
      <View
        className={`flex-row items-center h-12 border-b ${tone} ${disabled ? 'opacity-60' : ''}`}
      >
        <TextInput
          accessibilityLabel="昵称"
          accessibilityHint="1 至 32 字符，支持中文、字母、数字、emoji"
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

export default function OnboardingScreen() {
  const { displayName, setDisplayName, submit, status, errorMessage, isSubmittable } =
    useOnboardingForm();

  // FR-011: hardware back must noop on this page (Android only; iOS has no
  // hardware back; web BackHandler is a noop already).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const submitting = status === 'submitting';
  const errored = status === 'error';

  if (status === 'success') return <SuccessOverlay />;

  const handleSubmit = () => {
    void submit();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-surface px-lg pb-lg">
        <View className="flex-row items-center h-11" />

        <View className="mt-4 items-center gap-3">
          <LogoMark size={40} />
          <Text className="text-[28px] font-bold text-ink tracking-tight text-center">
            完善个人资料
          </Text>
          <Text className="text-sm text-ink-muted leading-relaxed text-center">
            起一个昵称，随时可在设置里修改。
          </Text>
        </View>

        <View className="mt-9">
          <DisplayNameInput
            value={displayName}
            onChangeText={setDisplayName}
            disabled={submitting}
            errored={errored}
            onCommit={handleSubmit}
          />
          {errorMessage !== null ? <ErrorRow text={errorMessage} /> : null}
        </View>

        <View className="mt-7">
          <PrimaryButton
            label={submitting ? '提交中…' : '提交'}
            loading={submitting}
            disabled={!isSubmittable}
            onPress={handleSubmit}
          />
        </View>

        <View className="flex-1" />

        <Text className="text-center text-[11px] text-ink-subtle mb-2">
          昵称可在「设置」中随时修改
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
