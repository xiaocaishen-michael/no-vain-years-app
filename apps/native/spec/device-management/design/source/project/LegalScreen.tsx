// LegalScreen.tsx
// 法规页占位 — 共用模板
//   personal-info  →  《个人信息收集与使用清单》
//   third-party    →  《第三方共享清单》
// 正文同 (per spec FR-011 + Q6): 法务定稿前严禁实际内容

import React from 'react';
import { View, Text } from 'react-native';
import { StackHeader } from './SettingsScreen';

export type LegalKind = 'personal-info' | 'third-party';

const TITLES: Record<LegalKind, string> = {
  'personal-info': '《个人信息收集与使用清单》',
  'third-party': '《第三方共享清单》',
};

export interface LegalScreenProps {
  kind: LegalKind;
}

export default function LegalScreen({ kind }: LegalScreenProps) {
  return (
    <View className="flex-1 bg-surface">
      <StackHeader title={TITLES[kind]} />

      <View className="flex-1 px-xl pt-2xl">
        <Text className="text-sm text-ink-muted leading-relaxed text-center">
          本清单内容由法务团队定稿后填入，预计 M3 内测前完成。
        </Text>
      </View>
    </View>
  );
}
