// List primitives translated from mockup design/source/SettingsScreen.tsx.
// Used by settings/index + account-security/index. Keeping these app-local
// (not packages/ui) until a 2nd module needs the same list-card pattern;
// see design/handoff.md § 2 for the abstraction-deferral rationale.

import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export function Card({ children }: { children: ReactNode }) {
  return (
    <View className="bg-surface rounded-md border border-line-soft overflow-hidden">
      {children}
    </View>
  );
}

export function Divider() {
  // Left gap equals the Row's px-md so the rule lines up with the label edge.
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
  busy?: boolean;
  onPress?: () => void;
}

export function Row({
  label,
  value,
  disabled,
  destructive,
  showChevron = true,
  align = 'left',
  busy,
  onPress,
}: RowProps) {
  const isDisabled = !!disabled;
  const isBusy = !!busy;
  const isMuted = isDisabled || isBusy;
  const labelTone = destructive ? 'text-err' : isDisabled ? 'text-ink-muted' : 'text-ink';
  const labelWeight = destructive ? 'font-medium' : 'font-normal';
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled || isBusy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isBusy }}
      className={`flex-row items-center px-md ${isMuted ? 'opacity-50' : ''}`}
      style={{ height: 52, opacity: isMuted ? 0.5 : 1 }}
    >
      <View className={`flex-1 ${align === 'center' ? 'items-center' : ''}`}>
        <Text className={`text-base ${labelTone} ${labelWeight}`}>{label}</Text>
      </View>
      {value != null ? <Text className="text-sm text-ink-muted mr-xs">{value}</Text> : null}
      {showChevron && !destructive ? <Text className="text-base text-ink-subtle">›</Text> : null}
    </Pressable>
  );
}
