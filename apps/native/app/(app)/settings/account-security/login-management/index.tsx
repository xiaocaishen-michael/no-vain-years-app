// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
// → PHASE 2 mockup translated (ADR-0017). This is the production implementation.
//
// 自上而下:
//   • 副标题「已登录的设备 N」(ink-muted)
//   • Card 列表: device row × N (图标 / 名+本机徽标 / 时间·地点 / chevron)
//   • 末尾 inline cta「更多设备 >」(items < totalElements 时)
//   • 全屏 error 态: ErrorRow + 重试

import { type DeviceItem } from '@nvy/auth';
import { colors } from '@nvy/design-tokens';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { formatLastActive } from '../../../../../lib/format/datetime';
import { useDevicesQuery } from '../../../../../lib/hooks/useDevicesQuery';
import DeviceIcon, { type DeviceKind } from './DeviceIcon';

// ─── Glyph ───────────────────────────────────────────────────────────────────

function ChevronRight({ color = colors.ink.subtle, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 6 L15 12 L9 18"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── 「本机」徽标 ─────────────────────────────────────────────────────────────
// bg-brand-soft + text-brand-600: identity 语义蓝灰, 与 destructive err 红明显区分.

function CurrentBadge() {
  return (
    <View className="bg-brand-soft px-2 py-0.5 rounded-xs">
      <Text className="font-semibold text-brand-600 tracking-wider" style={{ fontSize: 10 }}>
        本机
      </Text>
    </View>
  );
}

// ─── Display item ─────────────────────────────────────────────────────────────

interface DisplayItem {
  id: number;
  kind: DeviceKind;
  name: string;
  lastActiveAt: string;
  location: string | null;
  isCurrent: boolean;
}

function mapItem(item: DeviceItem): DisplayItem {
  return {
    id: item.id,
    kind: item.deviceType as DeviceKind,
    name: item.deviceName ?? '未知设备',
    lastActiveAt: formatLastActive(item.lastActiveAt, 'minute'),
    location: item.location,
    isCurrent: item.isCurrent,
  };
}

// ─── Device row ───────────────────────────────────────────────────────────────

function DeviceRow({ item, onPress }: { item: DisplayItem; onPress: () => void }) {
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
          {item.lastActiveAt} · {item.location ?? '—'}
        </Text>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

function RowDivider() {
  // 左缩进与图标右缘对齐: px-md(16) + icon(28) + gap-md(16) = 60
  return (
    <View className="flex-row">
      <View style={{ width: 60 }} />
      <View className="flex-1 h-px bg-line-soft" />
    </View>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-md border border-line-soft overflow-hidden shadow-card">
      {children}
    </View>
  );
}

function Subtitle({ count }: { count: number }) {
  return <Text className="text-xs text-ink-muted px-md pt-md pb-sm">已登录的设备 {count}</Text>;
}

function MoreCta({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-center gap-1 py-md">
      <Text className="text-sm text-ink-muted">更多设备</Text>
      <ChevronRight color={colors.ink.muted} size={14} />
    </Pressable>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="bg-err-soft rounded-md px-md py-md flex-row items-center justify-between gap-md">
      <Text className="text-sm text-err flex-1">{message}</Text>
      <Pressable onPress={onRetry} className="px-md py-xs rounded-xs border border-err">
        <Text className="text-xs font-medium text-err">重试</Text>
      </Pressable>
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginManagementListPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [accItems, setAccItems] = useState<DisplayItem[]>([]);
  const prevDataRef = useRef<typeof query.data>(undefined);

  const query = useDevicesQuery(page, 10);
  const { data, isLoading, isError, refetch } = query;

  // Accumulate pages: replace on page 0, append on subsequent pages.
  // prevDataRef guards against appending the same data object twice.
  useEffect(() => {
    if (!data || data === prevDataRef.current) return;
    prevDataRef.current = data;
    const mapped = data.items.map(mapItem);
    setAccItems((prev) => (page === 0 ? mapped : [...prev, ...mapped]));
  }, [data, page]);

  const totalElements = data?.totalElements ?? 0;
  const showCta = !isLoading && !isError && accItems.length < totalElements;

  if (isLoading && accItems.length === 0) {
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

  if (isError && accItems.length === 0) {
    return (
      <View className="flex-1 bg-surface-sunken">
        <View className="p-md">
          <ErrorRow message="网络错误，请重试" onRetry={() => void refetch()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-sunken">
      <Subtitle count={totalElements} />
      <ScrollView className="flex-1" contentContainerClassName="px-md pb-xl gap-md">
        <Card>
          {accItems.map((item, i) => (
            <View key={item.id}>
              {i > 0 ? <RowDivider /> : null}
              <DeviceRow
                item={item}
                onPress={() =>
                  router.push(
                    `/(app)/settings/account-security/login-management/${item.id}` as Parameters<
                      typeof router.push
                    >[0],
                  )
                }
              />
            </View>
          ))}
        </Card>
        {isError ? (
          <View>
            <ErrorRow message="加载更多失败，请重试" onRetry={() => void refetch()} />
          </View>
        ) : null}
        {showCta ? <MoreCta onPress={() => setPage((p) => p + 1)} /> : null}
      </ScrollView>
    </View>
  );
}
