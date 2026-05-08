import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { logoutAll } from '@nvy/auth';

import { Card, Divider, Row } from '../../../components/settings/primitives';

const COPY = {
  cards: {
    accountSecurity: '账号与安全',
    general: '通用',
    notifications: '通知',
    privacy: '隐私与权限',
    about: '关于',
    switchAccount: '切换账号',
    logout: '退出登录',
  },
  legal: {
    personalInfo: '《个人信息收集与使用清单》',
    thirdParty: '《第三方共享清单》',
  },
  logoutConfirm: '确定要退出登录?',
  logoutCancel: '取消',
  logoutOk: '确定',
};

export default function SettingsIndex() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await logoutAll();
    } catch (e) {
      console.warn('[settings] logoutAll failed', e);
    }
    router.replace('/(auth)/login');
  }

  function confirmLogout() {
    // react-native-web Alert.alert fallback 到 window.alert(单按钮信息提示),
    // buttons 数组完全 ignored → onPress 永远不 fire,用户点"退出登录"看着"没反应"。
    // Web 显式走 window.confirm 拿 yes/no;Native (iOS/Android) 走 Alert.alert.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(COPY.logoutConfirm)) {
        void handleLogout();
      }
      return;
    }
    Alert.alert(COPY.logoutConfirm, undefined, [
      { text: COPY.logoutCancel, style: 'cancel' },
      { text: COPY.logoutOk, style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-surface-sunken"
      contentContainerClassName="px-md pt-md pb-xl gap-md"
    >
      <Card>
        <Row
          label={COPY.cards.accountSecurity}
          onPress={() => router.push('/(app)/settings/account-security')}
        />
      </Card>

      <Card>
        <Row label={COPY.cards.general} disabled />
        <Divider />
        <Row label={COPY.cards.notifications} disabled />
        <Divider />
        <Row label={COPY.cards.privacy} disabled />
        <Divider />
        <Row label={COPY.cards.about} disabled />
      </Card>

      <Card>
        <Row label={COPY.cards.switchAccount} disabled showChevron={false} align="center" />
        <Divider />
        <Row
          label={COPY.cards.logout}
          destructive
          showChevron={false}
          align="center"
          busy={isLoading}
          onPress={confirmLogout}
        />
      </Card>

      <View className="items-center pt-xl pb-lg gap-2">
        <Pressable
          onPress={() => router.push('/(app)/settings/legal/personal-info')}
          accessibilityRole="link"
          accessibilityLabel={COPY.legal.personalInfo}
        >
          <Text className="text-xs text-accent">{COPY.legal.personalInfo}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/settings/legal/third-party')}
          accessibilityRole="link"
          accessibilityLabel={COPY.legal.thirdParty}
        >
          <Text className="text-xs text-accent">{COPY.legal.thirdParty}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
