// LoginScreenPreview.tsx
// Renders the four LoginScreen states side-by-side inside iOS frames.
// This is a Storybook-style preview composition for the design review;
// it is NOT shipped to the app.

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import IOSFrame from './IOSFrame';
import LoginScreen, { LoginState } from './LoginScreen';

interface FrameSpec {
  key: LoginState;
  num: string;
  name: string;
  zh: string;
  desc: string;
  pillBg: string;
  pillFg: string;
}

const FRAMES: FrameSpec[] = [
  {
    key: 'default',
    num: '01',
    name: 'DEFAULT',
    zh: '默认',
    desc: '首次进入。手机号已记忆，等待用户输入验证码。',
    pillBg: 'bg-surface-sunken',
    pillFg: 'text-ink-muted',
  },
  {
    key: 'loading',
    num: '02',
    name: 'LOADING',
    zh: '发送中',
    desc: '已发送验证码，60s 倒计时进行中。CTA 锁定为蓝灰态。',
    pillBg: 'bg-brand-soft',
    pillFg: 'text-brand-500',
  },
  {
    key: 'error',
    num: '03',
    name: 'ERROR',
    zh: '校验失败',
    desc: '验证码错误。下划线转红，错误信息出现在输入框下方。',
    pillBg: 'bg-err-soft',
    pillFg: 'text-err',
  },
  {
    key: 'success',
    num: '04',
    name: 'SUCCESS',
    zh: '登录成功',
    desc: '校验通过，绿色对勾弹入 → 跳转今日时间线。',
    pillBg: 'bg-ok-soft',
    pillFg: 'text-ok',
  },
];

function StateFrame({ spec }: { spec: FrameSpec }) {
  return (
    <View className="gap-3">
      <IOSFrame>
        <LoginScreen state={spec.key} />
      </IOSFrame>
      <View className="gap-1 max-w-[360px]">
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className={`flex-row items-center gap-1.5 px-2 py-0.5 rounded-full ${spec.pillBg}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${spec.pillFg.replace('text-', 'bg-')}`} />
            <Text className={`text-[10px] font-semibold font-mono tracking-wider ${spec.pillFg}`}>
              {spec.name}
            </Text>
          </View>
          <Text className="text-[11px] font-medium font-mono text-ink-subtle">{spec.num}</Text>
          <Text className="text-sm font-semibold text-ink">· {spec.zh}</Text>
        </View>
        <Text className="text-xs text-ink-muted leading-snug">{spec.desc}</Text>
      </View>
    </View>
  );
}

export default function LoginScreenPreview() {
  return (
    <ScrollView className="flex-1 bg-surface-sunken">
      <View className="px-8 py-10 gap-8 items-center">
        {/* Header */}
        <View className="w-full max-w-[1700px] flex-row flex-wrap justify-between items-end gap-6">
          <View className="gap-1.5">
            <Text className="text-2xl font-bold text-ink tracking-tight">
              登录页 · Login{'  '}
              <Text className="text-lg font-medium text-ink-muted">· 不虚此生</Text>
            </Text>
            <Text className="text-sm text-ink-muted max-w-xl leading-relaxed">
              三种登录方式：短信 / 密码 / Google OAuth。可视参考为 B 站移动端登录流。
              四个状态横向排列：默认 → 发送验证码 → 校验失败 → 登录成功。
            </Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-[11px] font-mono text-ink-subtle">
              <Text className="text-ink-muted font-medium">Frame</Text> iPhone · 360×780
            </Text>
            <Text className="text-[11px] font-mono text-ink-subtle">
              <Text className="text-ink-muted font-medium">Stack</Text> Expo + RN + NativeWind
            </Text>
          </View>
        </View>

        {/* 4-up grid (RN flex-wrap stands in for CSS grid) */}
        <View className="flex-row flex-wrap justify-center gap-7">
          {FRAMES.map((s) => (
            <StateFrame key={s.key} spec={s} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
