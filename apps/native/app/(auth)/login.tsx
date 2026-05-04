// PHASE 1 PLACEHOLDER (per ADR-0017) — business flow validated; visuals pending mockup v2.
// See apps/native/spec/login/plan.md § UI 结构 for visual decisions to come.
// Constraints (per ADR-0017 占位 4 边界):
//   - 全用原生 RN (View / Text / Pressable / TextInput); 不 import @nvy/ui
//   - 无视觉决策 (无精确间距/颜色/字号/阴影/动画/装饰)
//   - 仅含: 路由 / form 输入 / 提交事件 / 状态机视觉指示 / 错误展示位置
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { PHONE_REGEX, phoneSmsAuthSchema } from '../../lib/validation/login';
import { useLoginForm } from '../../lib/hooks/use-login-form';

const toE164 = (rawDigits: string): string => `+86${rawDigits.replace(/\s+/g, '')}`;

export default function LoginScreen() {
  const { state, errorToast, smsCountdown, requestSms, submit, showPlaceholderToast, clearError } =
    useLoginForm();

  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');

  const isLoading = state === 'submitting' || state === 'requesting_sms';
  const isSuccess = state === 'success';
  const isError = state === 'error';

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

  const onPhoneChange = (next: string) => {
    setPhone(next);
    if (errorToast) clearError();
  };
  const onSmsChange = (next: string) => {
    setSmsCode(next);
    if (errorToast) clearError();
  };

  if (isSuccess) {
    return (
      <View>
        <Text>登录成功</Text>
        <Text>正在进入今日时间线…</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Header — placeholder, mockup will define logo / subtitle / spacing */}
      <View>
        <Text>不虚此生</Text>
        <Text>把这一段日子，过得不虚此生。</Text>
      </View>

      {/* Top right "立即体验" placeholder (per spec FR-008) */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="立即体验（即将上线）"
        onPress={() => showPlaceholderToast('guest')}
      >
        <Text>立即体验</Text>
      </Pressable>

      {/* Single form (per ADR-0016: 无 tab, 无密码) */}
      <View>
        <Text>+86</Text>
        <TextInput
          accessibilityLabel="手机号"
          placeholder="请输入手机号"
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
          editable={!isLoading}
          maxLength={11}
        />
      </View>

      <View>
        <TextInput
          accessibilityLabel="验证码"
          placeholder="请输入 6 位验证码"
          value={smsCode}
          onChangeText={onSmsChange}
          keyboardType="number-pad"
          editable={!isLoading}
          maxLength={6}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={smsCountdown > 0 ? `${smsCountdown}秒后重发` : '获取验证码'}
          accessibilityState={{ disabled: !phoneValid || smsCountdown > 0 || isLoading }}
          onPress={handleSendSms}
          disabled={!phoneValid || smsCountdown > 0 || isLoading}
        >
          <Text>{smsCountdown > 0 ? `${smsCountdown}s 后重发` : '获取验证码'}</Text>
        </Pressable>
      </View>

      {/* Submit CTA (per spec FR-001 文案 "登录") */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="登录"
        accessibilityState={{ disabled: !formValid || isLoading }}
        onPress={handleSubmit}
        disabled={!formValid || isLoading}
      >
        <Text>{isLoading ? '登录中…' : '登录'}</Text>
      </Pressable>

      {/* State machine indicator (placeholder visualization, mockup will replace) */}
      {state === 'requesting_sms' ? <Text>正在发送验证码…</Text> : null}
      {state === 'sms_sent' && smsCountdown > 0 ? <Text>验证码已发送</Text> : null}
      {isError && errorToast ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
          {errorToast}
        </Text>
      ) : null}
      {!isError && errorToast ? <Text>{errorToast}</Text> : null}

      {/* Three-party OAuth placeholder row (per ADR-0016 决策 4 + spec FR-007) */}
      <Text>其他登录方式</Text>
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="微信登录（即将上线）"
          onPress={() => showPlaceholderToast('wechat')}
        >
          <Text>微信</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Google 登录（即将上线）"
          onPress={() => showPlaceholderToast('google')}
        >
          <Text>Google</Text>
        </Pressable>
        {/* Apple iOS-only conditional render (per spec FR-007 + SC-008) */}
        {Platform.OS === 'ios' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Apple 登录（即将上线）"
            onPress={() => showPlaceholderToast('apple')}
          >
            <Text>Apple</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Bottom "登录遇到问题" placeholder (per spec FR-009) */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="登录遇到问题（即将上线）"
        onPress={() => showPlaceholderToast('help')}
      >
        <Text>登录遇到问题</Text>
      </Pressable>

      {/* Implicit consent (per spec FR-001 + ADR-0016 决策 4) */}
      <Text>登录即表示同意《服务条款》《隐私政策》</Text>
    </View>
  );
}
