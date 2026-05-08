// OnboardingScreenPreview.tsx — 4 illustrative states side-by-side.
// idle / submitting / success / error.

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import IOSFrame from './IOSFrame';
import OnboardingScreen, { OnboardingState } from './OnboardingScreen';

interface FrameSpec {
  key: OnboardingState;
  num: string;
  name: string;
  zh: string;
  desc: string;
  pillBg: string;
  pillFg: string;
  dot: string;
}

const FRAMES: FrameSpec[] = [
  {
    key: 'idle',
    num: '01',
    name: 'IDLE',
    zh: '待输入',
    desc: '进入页面，输入框为空。CTA disabled（brand-soft）。',
    pillBg: 'bg-surface-sunken',
    pillFg: 'text-ink-muted',
    dot: 'bg-ink-muted',
  },
  {
    key: 'submitting',
    num: '02',
    name: 'SUBMITTING',
    zh: '提交中',
    desc: '已填昵称，CTA loading。input 锁定不可编辑。',
    pillBg: 'bg-warn-soft',
    pillFg: 'text-warn',
    dot: 'bg-warn',
  },
  {
    key: 'success',
    num: '03',
    name: 'SUCCESS',
    zh: '完成',
    desc: 'API 200。绿色对勾弹入，~600ms 后 AuthGate redirect。',
    pillBg: 'bg-ok-soft',
    pillFg: 'text-ok',
    dot: 'bg-ok',
  },
  {
    key: 'error',
    num: '04',
    name: 'ERROR',
    zh: '校验失败',
    desc: 'API 400 / 429 / 网络错。input 标红，错误信息显示在下方。',
    pillBg: 'bg-err-soft',
    pillFg: 'text-err',
    dot: 'bg-err',
  },
];

function StateFrame({ spec }: { spec: FrameSpec }) {
  return (
    <View className="gap-3" data-screen-label={`${spec.num} ${spec.name}`}>
      <IOSFrame>
        <OnboardingScreen state={spec.key} />
      </IOSFrame>
      <View className="gap-1 max-w-[360px]">
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className={`flex-row items-center gap-1.5 px-2 py-0.5 rounded-full ${spec.pillBg}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${spec.dot}`} />
            <Text className={`text-[10px] font-semibold tracking-wider ${spec.pillFg}`}>
              {spec.name}
            </Text>
          </View>
          <Text className="text-[11px] font-medium text-ink-subtle">{spec.num}</Text>
          <Text className="text-sm font-semibold text-ink">· {spec.zh}</Text>
        </View>
        <Text className="text-xs text-ink-muted leading-snug">{spec.desc}</Text>
      </View>
    </View>
  );
}

export default function OnboardingScreenPreview() {
  return (
    <ScrollView className="flex-1 bg-surface-sunken">
      <View className="px-8 py-10 gap-8 items-center">
        <View className="flex-row flex-wrap justify-between items-end gap-6 w-full max-w-[1700px]">
          <View className="gap-1.5">
            <Text className="text-2xl font-bold text-ink tracking-tight">
              Onboarding · 完善资料{'  '}
              <Text className="text-lg font-medium text-ink-muted">· account-center</Text>
            </Text>
            <Text className="text-sm text-ink-muted leading-relaxed max-w-[660px]">
              AuthGate-driven 强制 onboarding：服务器自动建账后
              displayName=null，强制填昵称才进首页（FR-011 不可跳过）。 单 form / 单字段 / 单
              CTA。比 login v2 更简单。
            </Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">Frame</Text> iPhone · 360×780
            </Text>
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">States</Text> 4
              (idle/submit/success/error)
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-center gap-7">
          {FRAMES.map((s) => (
            <StateFrame key={s.key} spec={s} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
