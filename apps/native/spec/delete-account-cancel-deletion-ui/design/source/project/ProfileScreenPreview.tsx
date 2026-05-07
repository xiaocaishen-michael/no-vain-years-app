// ProfileScreenPreview.tsx — 4 illustrative states side-by-side.
// default-notes / sticky-scrolled / graph-tab / kb-tab.

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import IOSFrame from './IOSFrame';
import ProfileScreen, { ProfileState } from './ProfileScreen';

interface FrameSpec {
  key: ProfileState;
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
    key: 'default-notes',
    num: '01',
    name: 'DEFAULT',
    zh: '落地态',
    desc: '冷启动落地。Hero 沉浸式 blur + 顶 nav 透明白图标，「笔记」tab 默认 active。',
    pillBg: 'bg-surface-sunken',
    pillFg: 'text-ink-muted',
    dot: 'bg-ink-muted',
  },
  {
    key: 'sticky-scrolled',
    num: '02',
    name: 'STICKY',
    zh: '滚动 sticky',
    desc: 'Hero 已滚出视口，SlideTabs sticky 置于顶 nav 下。顶 nav 切到白底深图标。',
    pillBg: 'bg-brand-soft',
    pillFg: 'text-brand-500',
    dot: 'bg-brand-500',
  },
  {
    key: 'graph-tab',
    num: '03',
    name: 'GRAPH',
    zh: '图谱 tab',
    desc: 'SlideTabs 切到「图谱」。下划线指示条滑到中间，inactive 文字降为 ink-muted。',
    pillBg: 'bg-accent-soft',
    pillFg: 'text-accent',
    dot: 'bg-accent',
  },
  {
    key: 'kb-tab',
    num: '04',
    name: 'KB',
    zh: '知识库 tab',
    desc: 'SlideTabs 切到「知识库」。指示条滑到末位。',
    pillBg: 'bg-ok-soft',
    pillFg: 'text-ok',
    dot: 'bg-ok',
  },
];

function StateFrame({ spec }: { spec: FrameSpec }) {
  return (
    <View className="gap-3" data-screen-label={`${spec.num} ${spec.name}`}>
      <IOSFrame>
        <ProfileScreen state={spec.key} />
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

export default function ProfileScreenPreview() {
  return (
    <ScrollView className="flex-1 bg-surface-sunken">
      <View className="px-8 py-10 gap-8 items-center">
        <View className="flex-row flex-wrap justify-between items-end gap-6 w-full max-w-[1700px]">
          <View className="gap-1.5">
            <Text className="text-2xl font-bold text-ink tracking-tight">
              我的 · Profile{'  '}
              <Text className="text-lg font-medium text-ink-muted">· account-center</Text>
            </Text>
            <Text className="text-sm text-ink-muted leading-relaxed max-w-[700px]">
              已 onboarded 用户冷启动落地页。4 zone：固定顶 nav / 沉浸式 Hero blur / sticky
              SlideTabs（笔记 · 图谱 · 知识库）/ Tab 内容占位 + 系统底 tab bar。 复用 login v2 全套
              token + 3 个新 alpha 变量（hero-overlay / white-soft / white-strong），底 tab 图标走
              react-native-svg 自绘。
            </Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">Frame</Text> iPhone · 360×780
            </Text>
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">States</Text> 4 (default / sticky / graph
              / kb)
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-center gap-7">
          {FRAMES.map((s) => (
            <StateFrame key={s.key} spec={s} />
          ))}
        </View>

        <View className="mt-2 max-w-[760px] gap-2">
          <Text className="text-xs font-semibold text-ink">
            新增 token（仅 3 个，全部为 alpha 变量）
          </Text>
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            <Text className="font-mono text-ink">hero-overlay</Text> rgba(15,18,28,0.36) — Hero
            photo blur 上叠暗 scrim，保白字可读性。
            {'  '}
            <Text className="font-mono text-ink">white-soft</Text> rgba(255,255,255,0.72) — 副文案 /
            分隔线 on blur。
            {'  '}
            <Text className="font-mono text-ink">white-strong</Text> rgba(255,255,255,0.92) —
            displayName / 数字 on blur（避免纯白刺眼）。
          </Text>
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            其余全部复用 login v2：tabs underline 用{' '}
            <Text className="font-mono text-ink">bg-brand-500</Text>，sticky 顶 nav 用{' '}
            <Text className="font-mono text-ink">bg-surface</Text>，底 tab active 用{' '}
            <Text className="font-mono text-ink">text-brand-500</Text>，inactive 用{' '}
            <Text className="font-mono text-ink">text-ink-subtle</Text>。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
