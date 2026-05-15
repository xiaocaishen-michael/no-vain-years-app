// LoginManagementPreview.tsx — 6 frames side by side
//
// 状态:
//   01 LIST-LOADING            副标题占位 + 居中 spinner
//   02 LIST-3-CURRENT          3 行 active devices, 第 1 行带「本机」徽标
//   03 LIST-PAGINATED-CTA      10 / 12 + 末尾「更多设备 >」inline cta
//   04 DETAIL-CURRENT          4 字段 (本机数据) + 无移除按钮
//   05 DETAIL-OTHER            4 字段 + destructive 移除按钮
//   06 SHEET-ACTIVE            detail 页底部叠加 RemoveDeviceSheet (sheet-default 态)
//
// Token Diff (vs delete-cancel PHASE 2 base):
//   ✅ +0 新 color/spacing/radius/font token
//   ✅ +2 shadow extension (cta-err / sheet) — 局部视觉, 非语义 token
//   ✅ 「本机」徽标       → 复用 brand-soft + brand-600 (识别 / identity 语义, 非 destructive)
//   ✅ destructive 移除   → 复用 err fill + surface 文字 (mirror delete-cancel "确认注销")
//   ✅ sheet overlay      → 复用 modal-overlay (delete-cancel freeze modal 已 ship)
//   ✅ sheet handle       → 复用 line-strong (4×40 pill)
//   ✅ device-icon stroke → 复用 ink-muted

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import IOSFrame from './IOSFrame';
import LoginManagementListScreen, { FIXTURE_ITEMS } from './LoginManagementListScreen';
import LoginManagementDetailScreen, {
  FIXTURE_CURRENT,
  FIXTURE_OTHER,
} from './LoginManagementDetailScreen';
import RemoveDeviceSheet from './RemoveDeviceSheet';

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
    name: 'LIST-LOADING',
    zh: 'list 加载中',
    desc: '副标题骨架占位 + 居中 spinner。无 cta。首次进入页面 / refetch 时短暂出现。',
    pillBg: 'bg-surface-sunken',
    pillFg: 'text-ink-muted',
    dot: 'bg-ink-muted',
    render: () => <LoginManagementListScreen state="list-loading" />,
  },
  {
    num: '02',
    name: 'LIST-3-CURRENT',
    zh: '3 设备 · 含本机',
    desc: '首屏典型: 3 行 active devices, 第 1 行 MK-iPhone 带 brand-soft 蓝灰「本机」徽标。items < 10 不显 cta。',
    pillBg: 'bg-brand-soft',
    pillFg: 'text-brand-600',
    dot: 'bg-brand-500',
    render: () => <LoginManagementListScreen state="list-3-with-current" />,
  },
  {
    num: '03',
    name: 'LIST-PAGINATED-CTA',
    zh: '10/12 + 更多',
    desc: '前 10 条 + 末尾 inline 「更多设备 >」 cta。tap 后追加 page+1, items >= total 时 cta 消失。',
    pillBg: 'bg-accent-soft',
    pillFg: 'text-accent',
    dot: 'bg-accent',
    render: () => <LoginManagementListScreen state="list-paginated-10-of-12-with-cta" />,
  },
  {
    num: '04',
    name: 'DETAIL-CURRENT',
    zh: '本机详情 · 无移除',
    desc: '本机条目: 4 字段 (设备名称 / 登录地点 / 登录方式 / 最近活跃 [秒精度])。移除按钮**不渲染**, 留白。',
    pillBg: 'bg-brand-soft',
    pillFg: 'text-brand-600',
    dot: 'bg-brand-500',
    render: () => <LoginManagementDetailScreen detail={FIXTURE_CURRENT} />,
  },
  {
    num: '05',
    name: 'DETAIL-OTHER',
    zh: '他机详情 · 可移除',
    desc: '4 字段 + 全宽 destructive「移除该设备」(err fill + shadow-cta-err)。tap → 弹起 RemoveDeviceSheet。',
    pillBg: 'bg-err-soft',
    pillFg: 'text-err',
    dot: 'bg-err',
    render: () => <LoginManagementDetailScreen detail={FIXTURE_OTHER} />,
  },
  {
    num: '06',
    name: 'SHEET-ACTIVE',
    zh: '移除确认 sheet',
    desc: 'detail-other 之上叠 RemoveDeviceSheet。modal-overlay scrim + rounded-t-lg card + 顶部 handle + ✕ + 双 button (取消 outline / 移除 err fill)。',
    pillBg: 'bg-ink/10',
    pillFg: 'text-ink',
    dot: 'bg-ink',
    render: () => (
      <View className="flex-1 relative">
        <LoginManagementDetailScreen detail={FIXTURE_OTHER} />
        <RemoveDeviceSheet inline visible state="default" />
      </View>
    ),
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

export default function LoginManagementPreview() {
  return (
    <ScrollView className="flex-1 bg-surface-sunken">
      <View className="px-8 py-10 gap-8 items-center">
        <View className="flex-row flex-wrap justify-between items-end gap-6 w-full max-w-[1700px]">
          <View className="gap-1.5">
            <Text className="text-2xl font-bold text-ink tracking-tight">
              登录管理 · device-management{'  '}
              <Text className="text-lg font-medium text-ink-muted">· account-center</Text>
            </Text>
            <Text className="text-sm text-ink-muted leading-relaxed max-w-[760px]">
              从「设置 → 账号与安全 → 登录管理」push 进入的 3-page 流: list 页 / 详情 / 移除确认
              sheet。 复用 delete-cancel PHASE 2 token base, +0 新色板; 「本机」徽标走 brand-soft
              (identity 语义), destructive 移除按钮走 err fill, sheet overlay 直接复用
              modal-overlay。
            </Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">Frame</Text>
              {'  '}iPhone · 360×780
            </Text>
            <Text className="text-[11px] text-ink-subtle">
              <Text className="text-ink-muted font-medium">States</Text>
              {'  '}6 (list ×3 / detail ×2 / sheet ×1)
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
            Token diff vs delete-cancel PHASE 2 base
          </Text>
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            <Text className="font-mono text-ink">+0 新 color / spacing / radius / font</Text>
            {'  ·  '}
            <Text className="font-mono text-ink">+2 shadow</Text> (cta-err 红色 CTA halo / sheet
            底部 lift) — 局部视觉 polish, 非语义 token{'  ·  '}
            「本机」徽标 → <Text className="font-mono text-ink">brand-soft + brand-600</Text> (拒绝
            err-soft 红 — 与 destructive 移除语义混淆; 拒绝 accent 橙 — 太抢戏盖过其他条目){'  ·  '}
            destructive 移除 → <Text className="font-mono text-ink">err</Text> fill (mirror
            delete-cancel 「确认注销」){'  ·  '}
            sheet overlay → <Text className="font-mono text-ink">modal-overlay</Text> (复用)
          </Text>
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            ❌ 本 mockup 不消费{' '}
            <Text className="font-mono text-ink">
              hero-overlay / white-soft / white-strong / shadow.hero-ring
            </Text>{' '}
            (无 hero / 无沉浸式背景)。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
