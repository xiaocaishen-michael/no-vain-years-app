// 「登录设备详情」page — login-management/[id].tsx
// Stack header = "登录设备详情" (由 _layout.tsx 注册)
//
// 数据源: TanStack Query cache (无单独 GET /devices/{id} endpoint, per FR-003 / handoff Gotcha 1)
//   1. getQueriesData(['devices']) 取全部已缓存分页 → 按 id 找
//   2. 若不在缓存, 兜底 useDevicesQuery(0, 10) (命中 staleTime 缓存)
//   3. 仍缺失 → NotFoundFallback
//
// 4 字段 card: 设备名称 / 登录地点 / 登录方式 / 最近活跃(秒级 font-mono)
// 移除按钮: isCurrent=false 时显示 → 弹 RemoveDeviceSheet

import { type DeviceItem, type DeviceListResult } from '@nvy/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { formatLastActive } from '../../../../../lib/format/datetime';
import { useDevicesQuery } from '../../../../../lib/hooks/useDevicesQuery';
import RemoveDeviceSheet from './RemoveDeviceSheet';

// ─── Login method label ───────────────────────────────────────────────────────

type LoginMethod = 'PHONE_SMS' | 'GOOGLE' | 'APPLE' | 'WECHAT';

const LOGIN_METHOD_LABEL: Record<LoginMethod, string> = {
  PHONE_SMS: '快速登录',
  GOOGLE: 'Google 登录',
  APPLE: 'Apple 登录',
  WECHAT: '微信登录',
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View className="px-md py-md gap-1">
      <Text className="text-xs text-ink-subtle">{label}</Text>
      <Text className={`text-base font-semibold text-ink${mono ? ' font-mono' : ''}`}>{value}</Text>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-md border border-line-soft overflow-hidden shadow-card">
      {children}
    </View>
  );
}

function RemoveButton({ onPress }: { onPress: () => void }) {
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

function NotFoundFallback() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-surface-sunken items-center justify-center px-md gap-md">
      <Text className="text-base font-semibold text-ink">该设备不存在或已被移除</Text>
      <Pressable onPress={() => router.back()} className="px-lg py-sm rounded-md bg-brand-500">
        <Text className="text-sm font-medium text-surface">返回</Text>
      </Pressable>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginManagementDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const queryClient = useQueryClient();
  const [sheetVisible, setSheetVisible] = useState(false);

  // 1. Search all cached device pages
  const allCached = queryClient.getQueriesData<DeviceListResult>({ queryKey: ['devices'] });
  const cached = allCached
    .flatMap(([, d]) => d?.items ?? [])
    .find((x: DeviceItem) => x.id === numericId);

  // 2. Fallback: page 0 query (hits staleTime cache when navigating from list)
  const { data: page0 } = useDevicesQuery(0, 10);
  const item = cached ?? page0?.items.find((x) => x.id === numericId) ?? null;

  if (!item) return <NotFoundFallback />;

  const location = item.location ?? '—';
  const method = LOGIN_METHOD_LABEL[item.loginMethod as LoginMethod] ?? item.loginMethod;
  const lastActive = formatLastActive(item.lastActiveAt, 'second');
  const name = item.deviceName ?? '未知设备';

  return (
    <View className="flex-1 bg-surface-sunken">
      <ScrollView className="flex-1" contentContainerClassName="px-md pt-md pb-xl gap-lg">
        <Card>
          <Field label="设备名称" value={name} />
          <RowDivider />
          <Field label="登录地点" value={location} />
          <RowDivider />
          <Field label="登录方式" value={method} />
          <RowDivider />
          <Field label="最近活跃" value={lastActive} mono />
        </Card>

        {!item.isCurrent ? <RemoveButton onPress={() => setSheetVisible(true)} /> : null}
      </ScrollView>

      <RemoveDeviceSheet
        visible={sheetVisible}
        recordId={item.id}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}
