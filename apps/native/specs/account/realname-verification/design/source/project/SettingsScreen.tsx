// SettingsScreen.tsx
// 「设置」shell 主页 (settings/index)
// Stack header 标题 = "设置"; 返回 = (tabs)/profile
//
// 自上而下: 3 cards + footer 法规链接
//   Card 1 — 单行: 账号与安全 >
//   Card 2 — 4 行 disabled (opacity 0.5): 通用 / 通知 / 隐私与权限 / 关于
//   Card 3 — 切换账号 (disabled) / 退出登录 (active, destructive `err`)
//   Footer — 《个人信息收集与使用清单》《第三方共享清单》(text-accent)
//
// Tokens: 全部复用 my-profile PHASE 2 base。新 token = 0
//   list-divider  → 复用 line-soft
//   link-text     → 复用 accent (#FF8C00) — 警告: 设计阶段决议用 accent 而非新蓝色，
//                    避免与 brand-500 主 CTA 蓝色撞车; 法规链接是次级动作。
//   card-bg       → 复用 surface (#FFFFFF) on surface-sunken 页底
//   destructive   → 复用 err (#EF4444) for 退出登录文字

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

export type SettingsState = 'default' | 'logout-alert';

export interface SettingsScreenProps {
  state?: SettingsState;
}

// ─── Glyphs ──────────────────────────────────────────────────────────────
const stroke = (c: string, w = 2) => ({
  stroke: c,
  strokeWidth: w,
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

function IconChevronRight({ color = '#999999' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M9 6 L15 12 L9 18" {...stroke(color, 2)} />
    </Svg>
  );
}

function IconBack({ color = '#1A1A1A' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M15 6 L9 12 L15 18" {...stroke(color, 2)} />
    </Svg>
  );
}

// ─── Stack header ────────────────────────────────────────────────────────
export function StackHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View className="flex-row items-center bg-surface border-b border-line-soft h-12 px-sm">
      <Pressable hitSlop={10} onPress={onBack} className="w-10 h-10 items-center justify-center">
        <IconBack />
      </Pressable>
      <View className="flex-1 items-center">
        <Text className="text-base font-semibold text-ink">{title}</Text>
      </View>
      {/* right-spacer to keep title centered */}
      <View className="w-10 h-10" />
    </View>
  );
}

// ─── List primitives ─────────────────────────────────────────────────────
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-md border border-line-soft overflow-hidden">
      {children}
    </View>
  );
}

export function Divider() {
  // 行间分隔: 16px 左缩进 (与 row label 对齐), 不延伸到右 chevron
  return (
    <View className="flex-row">
      <View className="w-md" />
      <View className="flex-1 h-px bg-line-soft" />
    </View>
  );
}

export interface RowProps {
  label: string;
  value?: string;
  disabled?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
  align?: 'left' | 'center';
  onPress?: () => void;
}

export function Row({
  label,
  value,
  disabled,
  destructive,
  showChevron = true,
  align = 'left',
  onPress,
}: RowProps) {
  const labelTone = destructive ? 'text-err' : disabled ? 'text-ink-muted' : 'text-ink';
  const labelWeight = destructive ? 'font-medium' : 'font-normal';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center px-md ${disabled ? 'opacity-50' : ''}`}
      style={{ height: 52 }}
      accessibilityState={{ disabled: !!disabled }}
    >
      <View className={`flex-1 ${align === 'center' ? 'items-center' : ''}`}>
        <Text className={`text-base ${labelTone} ${labelWeight}`}>{label}</Text>
      </View>
      {value ? <Text className="text-sm text-ink-muted mr-xs">{value}</Text> : null}
      {showChevron && !destructive ? <IconChevronRight /> : null}
    </Pressable>
  );
}

// ─── Footer 法规链接 ──────────────────────────────────────────────────────
function LegalFooter({
  onPersonalInfo,
  onThirdParty,
}: {
  onPersonalInfo?: () => void;
  onThirdParty?: () => void;
}) {
  return (
    <View className="items-center pt-xl pb-lg gap-2">
      <Pressable onPress={onPersonalInfo}>
        <Text className="text-xs text-accent">《个人信息收集与使用清单》</Text>
      </Pressable>
      <Pressable onPress={onThirdParty}>
        <Text className="text-xs text-accent">《第三方共享清单》</Text>
      </Pressable>
    </View>
  );
}

// ─── Logout confirm modal (custom; PHASE 2 — replaces RN system Alert) ──
function LogoutAlert({ onCancel, onConfirm }: { onCancel?: () => void; onConfirm?: () => void }) {
  return (
    <View
      className="absolute inset-0 items-center justify-center px-xl"
      style={{ backgroundColor: 'rgba(15,18,28,0.45)' }}
    >
      <View className="bg-surface rounded-lg overflow-hidden w-full max-w-[280px] shadow-card">
        <View className="px-md pt-lg pb-md items-center gap-2">
          <Text className="text-base font-semibold text-ink">退出登录</Text>
          <Text className="text-sm text-ink-muted text-center leading-snug">
            退出后需重新登录才能继续使用
          </Text>
        </View>
        <View className="h-px bg-line-soft" />
        <View className="flex-row">
          <Pressable
            onPress={onCancel}
            className="flex-1 items-center justify-center"
            style={{ height: 44 }}
          >
            <Text className="text-base text-ink-muted">取消</Text>
          </Pressable>
          <View className="w-px bg-line-soft" />
          <Pressable
            onPress={onConfirm}
            className="flex-1 items-center justify-center"
            style={{ height: 44 }}
          >
            <Text className="text-base font-semibold text-err">退出</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────
export default function SettingsScreen({ state = 'default' }: SettingsScreenProps) {
  return (
    <View className="flex-1 bg-surface-sunken">
      <StackHeader title="设置" />

      <ScrollView className="flex-1" contentContainerClassName="px-md pt-md pb-xl gap-md">
        {/* Card 1 — 账号与安全 (single row, active) */}
        <Card>
          <Row label="账号与安全" />
        </Card>

        {/* Card 2 — disabled cluster */}
        <Card>
          <Row label="通用" disabled />
          <Divider />
          <Row label="通知" disabled />
          <Divider />
          <Row label="隐私与权限" disabled />
          <Divider />
          <Row label="关于" disabled />
        </Card>

        {/* Card 3 — account actions */}
        <Card>
          <Row label="切换账号" disabled showChevron={false} align="center" />
          <Divider />
          <Row label="退出登录" destructive showChevron={false} align="center" />
        </Card>

        {/* Footer — 法规链接 */}
        <LegalFooter />
      </ScrollView>

      {state === 'logout-alert' ? <LogoutAlert /> : null}
    </View>
  );
}
