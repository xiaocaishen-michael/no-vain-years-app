// PhoneScreen.tsx
// 「手机号」mask 详情 (account-security/phone)
// Stack header = "手机号"; 返回 → account-security/index
// 极简: 居中单一 mask 文本，无任何操作按钮 (per FR-008)

import React from 'react';
import { View, Text } from 'react-native';
import { StackHeader } from './SettingsScreen';

export interface PhoneScreenProps {
  phoneMask?: string;
}

export default function PhoneScreen({ phoneMask = '+86 138****5678' }: PhoneScreenProps) {
  return (
    <View className="flex-1 bg-surface">
      <StackHeader title="手机号" />

      <View className="flex-1 items-center justify-center px-lg">
        {/* 上 1/3 视觉重心: 大号 mask, mono 字体 (数字 affordance), tracking-wide */}
        <Text className="text-2xl font-semibold text-ink font-mono tracking-wide">{phoneMask}</Text>
        <View className="mt-md">
          <Text className="text-xs text-ink-subtle">已绑定手机号</Text>
        </View>
      </View>
    </View>
  );
}
