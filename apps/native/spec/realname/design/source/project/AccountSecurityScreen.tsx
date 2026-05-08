// AccountSecurityScreen.tsx
// 「账号与安全」子页 (account-security/index)
// Stack header = "账号与安全"; 返回 → settings/index
//
// 反枚举守则: NO ID 行 / NO 客服 / NO 安全系数 banner / NO 4 盾牌 / NO 找回 / NO 密码
//
// 3 cards:
//   Card 1 — 手机号 +86 138****5678 (active) / 实名认证 (disabled) / 第三方账号绑定 (disabled)
//   Card 2 — 登录设备与授权管理 (disabled)
//   Card 3 — 注销账号 (active, destructive `err` 暗示风险) / 安全小知识 (disabled)

import React from 'react';
import { View, ScrollView } from 'react-native';
import { StackHeader, Card, Row, Divider } from './SettingsScreen';

export interface AccountSecurityScreenProps {
  /** mockup 数据; production 从 store 读 + maskPhone format */
  phoneMask?: string;
}

export default function AccountSecurityScreen({
  phoneMask = '+86 138****5678',
}: AccountSecurityScreenProps) {
  return (
    <View className="flex-1 bg-surface-sunken">
      <StackHeader title="账号与安全" />

      <ScrollView className="flex-1" contentContainerClassName="px-md pt-md pb-xl gap-md">
        {/* Card 1 */}
        <Card>
          <Row label="手机号" value={phoneMask} />
          <Divider />
          <Row label="实名认证" disabled />
          <Divider />
          <Row label="第三方账号绑定" disabled />
        </Card>

        {/* Card 2 */}
        <Card>
          <Row label="登录设备与授权管理" disabled />
        </Card>

        {/* Card 3 */}
        <Card>
          <Row label="注销账号" destructive showChevron />
          <Divider />
          <Row label="安全小知识" disabled />
        </Card>
      </ScrollView>
    </View>
  );
}
