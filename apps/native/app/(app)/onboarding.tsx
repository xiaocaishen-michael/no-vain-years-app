// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
//
// per ADR-0017 类 1 占位 UI 4 边界（spec FR-006 / FR-011 / FR-012）：
//   ✓ 路由：/(app)/onboarding
//   ✓ Form 输入：单 <TextInput> displayName
//   ✓ 提交事件：单 <Pressable> 调 useOnboardingForm.submit
//   ✓ 状态指示 + 错误展示：裸 <Text>（无视觉决策）
//
// 禁：精确间距 / 颜色 / 字号 / 阴影 / 自定义动画 / packages/ui import /
// hex / rgb / px 字面量。视觉决策留 mockup PHASE 2 由 Claude Design 落地。

import { useEffect } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useOnboardingForm } from '../../lib/hooks/use-onboarding-form';

export default function OnboardingScreen() {
  const { displayName, setDisplayName, submit, status, errorMessage, isSubmittable } =
    useOnboardingForm();

  // FR-011: onboarding 强制不可跳过 — Android hardware back noop in this page.
  // iOS 默认无 hardware back；Web 端 BackHandler 是 noop 不需 guard。
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <Text>完善个人资料</Text>
        <TextInput
          accessibilityLabel="昵称"
          accessibilityHint="1 至 32 字符，支持中文、字母、数字、emoji"
          placeholder="昵称"
          value={displayName}
          onChangeText={setDisplayName}
          editable={status !== 'submitting'}
          autoFocus
        />
        <Pressable
          onPress={() => {
            void submit();
          }}
          disabled={!isSubmittable}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isSubmittable }}
        >
          <Text>{status === 'submitting' ? '提交中...' : '提交'}</Text>
        </Pressable>
        {errorMessage !== null && (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
            {errorMessage}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
