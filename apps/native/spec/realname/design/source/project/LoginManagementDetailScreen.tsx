// LoginManagementDetailScreen.tsx
// 「登录设备详情」(login-management/[id], authenticated)
// Stack header = "登录设备详情"; 由 _layout.tsx 注册 — 本组件不画 header
//
// 4 字段 (label-value 上下结构):
//   设备名称 / 登录地点 / 登录方式 / 最近活跃 (精确到秒)
// + 移除按钮 (full-width destructive, 仅 isCurrent === false)
//
// 状态:
//   detail-current-no-remove   — 4 字段 + 无移除按钮
//   detail-other-with-remove   — 4 字段 + destructive 移除按钮

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export type LoginMethod = 'PHONE_SMS' | 'GOOGLE' | 'APPLE' | 'WECHAT';

const LOGIN_METHOD_LABEL: Record<LoginMethod, string> = {
  PHONE_SMS: '快速登录',
  GOOGLE: 'Google 登录',
  APPLE: 'Apple 登录',
  WECHAT: '微信登录',
};

export interface DeviceDetail {
  id: string;
  name: string;
  location: string | null;
  loginMethod: LoginMethod;
  lastActiveAt: string; // YYYY.MM.DD HH:mm:ss — 精度到秒 (vs list 分钟)
  isCurrent: boolean;
}

export interface LoginManagementDetailScreenProps {
  detail?: DeviceDetail;
  onPressRemove?: () => void;
  /** test-only override of isCurrent for preview frames */
  forceState?: 'current-no-remove' | 'other-with-remove';
}

// ─── Field row ───────────────────────────────────────────────────────────
function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View className="px-md py-md gap-1">
      <Text className="text-xs text-ink-subtle">{label}</Text>
      <Text className={`text-base font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</Text>
    </View>
  );
}

function RowDivider() {
  return (
    <View className="flex-row">
      <View style={{ width: 16 }} />
      <View className="flex-1 h-px bg-line-soft" />
    </View>
  );
}

// ─── Destructive 移除按钮 ─────────────────────────────────────────────────
// 强调度: err fill — 与 delete-cancel "确认注销" 协调; 危险动作语义最强.
// disabled-本机 不需要 (本机条目隐藏按钮 placeholder, 不是 disabled).
function RemoveButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-err rounded-md items-center justify-center shadow-cta-err"
      style={{ height: 48 }}
    >
      <Text className="text-base font-semibold text-surface">移除该设备</Text>
    </Pressable>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-md border border-line-soft overflow-hidden shadow-card">
      {children}
    </View>
  );
}

// ─── Fixtures ────────────────────────────────────────────────────────────
export const FIXTURE_CURRENT: DeviceDetail = {
  id: '1',
  name: 'MK-iPhone',
  location: '上海',
  loginMethod: 'PHONE_SMS',
  lastActiveAt: '2026.05.08 09:41:02',
  isCurrent: true,
};

export const FIXTURE_OTHER: DeviceDetail = {
  id: '3',
  name: '张磊的 Mate 50',
  location: '北京',
  loginMethod: 'WECHAT',
  lastActiveAt: '2026.05.05 17:02:31',
  isCurrent: false,
};

// ─── Main ────────────────────────────────────────────────────────────────
export default function LoginManagementDetailScreen({
  detail,
  onPressRemove,
  forceState,
}: LoginManagementDetailScreenProps) {
  const data = detail ?? (forceState === 'other-with-remove' ? FIXTURE_OTHER : FIXTURE_CURRENT);
  return (
    <View className="flex-1 bg-surface-sunken">
      <ScrollView className="flex-1" contentContainerClassName="px-md pt-md pb-xl gap-lg">
        <Card>
          <Field label="设备名称" value={data.name} />
          <RowDivider />
          <Field label="登录地点" value={data.location ?? '—'} />
          <RowDivider />
          <Field label="登录方式" value={LOGIN_METHOD_LABEL[data.loginMethod]} />
          <RowDivider />
          <Field label="最近活跃" value={data.lastActiveAt} mono />
        </Card>

        {!data.isCurrent ? <RemoveButton onPress={onPressRemove} /> : null}
      </ScrollView>
    </View>
  );
}
