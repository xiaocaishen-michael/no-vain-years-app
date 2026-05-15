// SettingsShellPreview.tsx — 4 frames side by side
//
// 状态:
//   01 SETTINGS         settings/index 默认
//   02 ACCOUNT-SECURITY account-security/index 默认 (phone mask 显示)
//   03 PHONE            account-security/phone mask 居中
//   04 LEGAL            legal/personal-info 占位
//
// (logout-alert 状态接受 RN 系统 Alert 降级 per 决策5; mockup 不画弹窗)
//
// Token Diff (vs my-profile PHASE 2 base):
//   ❌ 不消费: hero-overlay / white-soft / white-strong / shadow.hero-ring (无 hero/blur)
//   ✅ 全部复用 base: brand / accent / ink / line / surface / err / warn / spacing / radius / shadow.card
//   ✅ 法规 footer 链接走 `text-accent` (#FF8C00) — 决策: 不引入新 link-text token，避免与 brand-500 主 CTA 撞色
//   ✅ 退出登录 + 注销账号 走 `text-err` — destructive 暗示
//   ✅ disabled 行走 `opacity-50` 整行 + 不可按 — 视觉对比足够，不加 lock 🔒 icon (per 决策)
//   ✅ list 行高 = 52px (常规 setting list 节奏)
//   ✅ list-divider 复用 line-soft，左缩进 16px (与 label 对齐，惯例)
//   ✅ card-bg 复用 surface; 页底 surface-sunken 形成卡片浮起感

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import IOSFrame from './IOSFrame';
import SettingsScreen from './SettingsScreen';
import AccountSecurityScreen from './AccountSecurityScreen';
import PhoneScreen from './PhoneScreen';
import LegalScreen from './LegalScreen';

interface FrameSpec {
  num: string;
  name: string;
  zh: string;
  desc: string;
  pillBg: string;
  pillFg: string;
  dot: string;
  render: () => React.ReactNode;
}

const FRAMES: FrameSpec[] = [
  {
    num: '01',
    name: 'SETTINGS',
    zh: '设置主页',
    desc: '从「我的」⚙️ push 进入。3 cards + 法规 footer。Card 1 单行可点；Card 2 全 disabled 占位；Card 3 切换账号 disabled / 退出登录 destructive 红字。',
    pillBg: 'bg-brand-soft',
    pillFg: 'text-brand-500',
    dot: 'bg-brand-500',
    render: () => <SettingsScreen />,
  },
  {
    num: '02',
    name: 'ACCOUNT-SECURITY',
    zh: '账号与安全',
    desc: 'Card 1 第一行手机号 mask 右对齐 +chevron；实名 / 第三方绑定 disabled。Card 2 登录设备 disabled。Card 3 注销账号 destructive 暗示风险，安全小知识 disabled。',
    pillBg: 'bg-surface-sunken',
    pillFg: 'text-ink-muted',
    dot: 'bg-ink-muted',
    render: () => <AccountSecurityScreen />,
  },
  {
    num: '03',
    name: 'PHONE',
    zh: '手机号 mask',
    desc: '极简详情页。仅居中显示 maskPhone 格式后字符串，mono + tracking-wide 强调数字 affordance。无操作入口 (per FR-008)。',
    pillBg: 'bg-accent-soft',
    pillFg: 'text-accent',
    dot: 'bg-accent',
    render: () => <PhoneScreen />,
  },
  {
    num: '04',
    name: 'LEGAL',
    zh: '法规占位',
    desc: 'personal-info / third-party 共用模板，仅标题不同。占位文案居中 ink-muted。法务定稿前严禁实际内容 (per Q6)。',
    pillBg: 'bg-warn-soft',
    pillFg: 'text-warn',
    dot: 'bg-warn',
    render: () => <LegalScreen kind="personal-info" />,
  },
];

function StateFrame({ spec }: { spec: FrameSpec }) {
  return (
    <View className="gap-3" data-screen-label={`${spec.num} ${spec.name}`}>
      <IOSFrame>{spec.render()}</IOSFrame>
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

export default function SettingsShellPreview() {
  return (
    <ScrollView className="flex-1 bg-surface-sunken">
      <View className="px-8 py-10 gap-8 items-center">
        <View className="flex-row flex-wrap justify-between items-end gap-6 w-full max-w-[1700px]">
          <View className="gap-1.5">
            <Text className="text-2xl font-bold text-ink tracking-tight">
              账号设置 shell · Settings{'  '}
              <Text className="text-lg font-medium text-ink-muted">· account-center</Text>
            </Text>
            <Text className="text-sm text-ink-muted leading-relaxed max-w-[760px]">
              从「我的」⚙️ push 进入的 5 页面 stack — 设置主页 / 账号与安全 / 手机号 mask / 法规
              ×2。 全部复用 my-profile PHASE 2 token base，零新增 token；list 行 +
              卡片分组为唯一新视觉模式。 destructive (退出登录 / 注销账号) 走 err token，法规 footer
              链接走 accent token。
            </Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">Frame</Text>
              {'  '}iPhone · 360×780
            </Text>
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">States</Text>
              {'  '}4 (settings / security / phone / legal)
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-center gap-7">
          {FRAMES.map((s) => (
            <StateFrame key={s.num} spec={s} />
          ))}
        </View>

        {/* Token diff annotation */}
        <View className="mt-2 max-w-[860px] gap-2">
          <Text className="text-xs font-semibold text-ink">
            Token diff vs my-profile PHASE 2 base
          </Text>
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            <Text className="font-mono text-ink">+0 新 token</Text>
            {'  ·  '}
            list-divider → 复用 <Text className="font-mono text-ink">line-soft</Text>
            {'  ·  '}
            link-text → 复用 <Text className="font-mono text-ink">accent</Text>（避免与 brand-500 主
            CTA 蓝撞色）{'  ·  '}
            card-bg → 复用 <Text className="font-mono text-ink">surface</Text>
            {'  ·  '}
            destructive → 复用 <Text className="font-mono text-ink">err</Text>
          </Text>
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            ❌ 本 shell 不消费 my-profile 引入的{' '}
            <Text className="font-mono text-ink">
              hero-overlay / white-soft / white-strong / shadow.hero-ring
            </Text>{' '}
            （无 hero / 无沉浸式背景）。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
