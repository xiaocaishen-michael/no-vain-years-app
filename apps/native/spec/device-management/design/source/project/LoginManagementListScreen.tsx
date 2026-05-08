// LoginManagementListScreen.tsx
// 「登录管理」list 页 (login-management/index, authenticated)
// Stack header = "登录管理"; 由 _layout.tsx 注册 — 本组件不画 header
//
// 自上而下:
//   • 副标题 "已登录的设备 N" (ink-muted, 紧贴 header 下方)
//   • Card 列表: device row × N (设备图标 / 名+本机徽标 / 时间·地点 / chevron)
//   • 末尾 inline cta「更多设备 >」(items.length < totalElements 时)
//
// 状态变体:
//   list-loading                          spinner 居中, 无副标题/无 cta
//   list-3-with-current                   3 行, 第 1 行带「本机」, 无 cta
//   list-paginated-10-of-12-with-cta      10 行 + 末尾 inline cta
//   list-paginated-12-of-12               12 行, cta 隐藏
//   list-error                            ErrorRow + 重试

import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DeviceIcon, { DeviceKind } from './DeviceIcon';

export interface DeviceItem {
  id: string;
  name: string;
  kind: DeviceKind;
  lastActiveAt: string; // YYYY.MM.DD HH:mm — list 显示精度 (分钟)
  location: string | null; // 中文省市; null → "—"
  isCurrent: boolean;
}

export type ListState =
  | 'list-loading'
  | 'list-3-with-current'
  | 'list-paginated-10-of-12-with-cta'
  | 'list-paginated-12-of-12'
  | 'list-error';

export interface LoginManagementListScreenProps {
  state?: ListState;
  items?: DeviceItem[];
  totalElements?: number;
  onPressItem?: (item: DeviceItem) => void;
  onPressMore?: () => void;
  onRetry?: () => void;
}

// ─── glyphs ──────────────────────────────────────────────────────────────
const stroke = (c: string, w = 2) => ({
  stroke: c,
  strokeWidth: w,
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});
function ChevronRight({ color = '#999999', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 6 L15 12 L9 18" {...stroke(color, 2)} />
    </Svg>
  );
}

// ─── 「本机」徽标 ─────────────────────────────────────────────────────────
// Token 决议: bg-brand-soft + text-brand-600.
// 不用 err-soft (会与 destructive 移除按钮语义混淆); 不用 accent (橙色太抢戏);
// 用 brand-soft 蓝灰 — 语义"identity / 这是我"，与 destructive err 红明显区分.
function CurrentBadge() {
  return (
    <View className="bg-brand-soft px-2 py-0.5 rounded-xs">
      <Text className="text-[10px] font-semibold text-brand-600 tracking-wider">本机</Text>
    </View>
  );
}

// ─── Device row ──────────────────────────────────────────────────────────
function DeviceRow({ item, onPress }: { item: DeviceItem; onPress?: () => void }) {
  const time = item.lastActiveAt;
  const loc = item.location ?? '—';
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-md gap-md"
      style={{ minHeight: 68 }}
    >
      <View className="items-center justify-center" style={{ width: 28, height: 28 }}>
        <DeviceIcon kind={item.kind} size={26} />
      </View>
      <View className="flex-1 gap-1" style={{ paddingVertical: 12 }}>
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-ink">{item.name}</Text>
          {item.isCurrent ? <CurrentBadge /> : null}
        </View>
        <Text className="text-xs text-ink-muted">
          {time} · {loc}
        </Text>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

function RowDivider() {
  // 左缩进与图标右缘对齐 (16px padding + 28 icon + 16 gap = 60px)
  return (
    <View className="flex-row">
      <View style={{ width: 60 }} />
      <View className="flex-1 h-px bg-line-soft" />
    </View>
  );
}

// ─── 「更多设备 >」inline cta ─────────────────────────────────────────────
function MoreCta({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-center gap-1 py-md">
      <Text className="text-sm text-ink-muted">更多设备</Text>
      <ChevronRight color="#666666" size={14} />
    </Pressable>
  );
}

// ─── ErrorRow ────────────────────────────────────────────────────────────
function ErrorRow({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="bg-err-soft rounded-md px-md py-md flex-row items-center justify-between gap-md">
      <Text className="text-sm text-err flex-1">{message}</Text>
      <Pressable onPress={onRetry} className="px-md py-xs rounded-xs border border-err">
        <Text className="text-xs font-medium text-err">重试</Text>
      </Pressable>
    </View>
  );
}

// ─── Subtitle ────────────────────────────────────────────────────────────
function Subtitle({ count }: { count: number }) {
  return <Text className="text-xs text-ink-muted px-md pt-md pb-sm">已登录的设备 {count}</Text>;
}

// ─── Card ────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-md border border-line-soft overflow-hidden shadow-card">
      {children}
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────
export const FIXTURE_ITEMS: DeviceItem[] = [
  {
    id: '1',
    name: 'MK-iPhone',
    kind: 'PHONE',
    lastActiveAt: '2026.05.08 09:41',
    location: '上海',
    isCurrent: true,
  },
  {
    id: '2',
    name: 'MacBook Pro',
    kind: 'DESKTOP',
    lastActiveAt: '2026.05.07 22:18',
    location: '上海',
    isCurrent: false,
  },
  {
    id: '3',
    name: '张磊的 Mate 50',
    kind: 'PHONE',
    lastActiveAt: '2026.05.05 17:02',
    location: '北京',
    isCurrent: false,
  },
  {
    id: '4',
    name: 'iPad Air',
    kind: 'TABLET',
    lastActiveAt: '2026.05.03 12:34',
    location: '杭州',
    isCurrent: false,
  },
  {
    id: '5',
    name: 'Chrome · macOS',
    kind: 'WEB',
    lastActiveAt: '2026.04.29 20:11',
    location: '上海',
    isCurrent: false,
  },
  {
    id: '6',
    name: 'Safari · iOS',
    kind: 'WEB',
    lastActiveAt: '2026.04.28 08:50',
    location: '上海',
    isCurrent: false,
  },
  {
    id: '7',
    name: 'Redmi K70',
    kind: 'PHONE',
    lastActiveAt: '2026.04.21 13:27',
    location: null,
    isCurrent: false,
  },
  {
    id: '8',
    name: 'Windows · Edge',
    kind: 'WEB',
    lastActiveAt: '2026.04.18 19:44',
    location: '深圳',
    isCurrent: false,
  },
  {
    id: '9',
    name: 'iMac',
    kind: 'DESKTOP',
    lastActiveAt: '2026.04.15 11:02',
    location: '上海',
    isCurrent: false,
  },
  {
    id: '10',
    name: 'Galaxy Tab S9',
    kind: 'TABLET',
    lastActiveAt: '2026.04.10 16:38',
    location: '广州',
    isCurrent: false,
  },
  {
    id: '11',
    name: '未知设备',
    kind: 'UNKNOWN',
    lastActiveAt: '2026.04.04 02:13',
    location: null,
    isCurrent: false,
  },
  {
    id: '12',
    name: 'Pixel 8',
    kind: 'PHONE',
    lastActiveAt: '2026.03.27 10:21',
    location: '成都',
    isCurrent: false,
  },
];

export default function LoginManagementListScreen({
  state = 'list-3-with-current',
  items,
  totalElements,
  onPressItem,
  onPressMore,
  onRetry,
}: LoginManagementListScreenProps) {
  // resolve fixture per state
  let renderItems: DeviceItem[] = items ?? [];
  let total = totalElements ?? 0;
  let showCta = false;

  if (!items) {
    if (state === 'list-3-with-current') {
      renderItems = FIXTURE_ITEMS.slice(0, 3);
      total = 3;
    } else if (state === 'list-paginated-10-of-12-with-cta') {
      renderItems = FIXTURE_ITEMS.slice(0, 10);
      total = 12;
      showCta = true;
    } else if (state === 'list-paginated-12-of-12') {
      renderItems = FIXTURE_ITEMS.slice(0, 12);
      total = 12;
    }
  } else {
    showCta = renderItems.length < (total ?? 0);
  }

  if (state === 'list-loading') {
    return (
      <View className="flex-1 bg-surface-sunken">
        <View className="px-md pt-md pb-sm">
          <View className="bg-line-soft rounded-xs" style={{ width: 120, height: 12 }} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-xs text-ink-subtle mt-sm">加载中…</Text>
        </View>
      </View>
    );
  }

  if (state === 'list-error') {
    return (
      <View className="flex-1 bg-surface-sunken">
        <View className="p-md">
          <ErrorRow message="网络错误，请重试" onRetry={onRetry} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-sunken">
      <Subtitle count={total} />
      <ScrollView className="flex-1" contentContainerClassName="px-md pb-xl gap-md">
        <Card>
          {renderItems.map((it, i) => (
            <React.Fragment key={it.id}>
              {i > 0 ? <RowDivider /> : null}
              <DeviceRow item={it} onPress={() => onPressItem?.(it)} />
            </React.Fragment>
          ))}
        </Card>
        {showCta ? <MoreCta onPress={onPressMore} /> : null}
      </ScrollView>
    </View>
  );
}
