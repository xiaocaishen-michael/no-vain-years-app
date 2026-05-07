// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { logoutAll } from '@nvy/auth';

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

const DISABLED_OPACITY = 0.5;

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
    Alert.alert(COPY.logoutConfirm, undefined, [
      { text: COPY.logoutCancel, style: 'cancel' },
      { text: COPY.logoutOk, style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <ScrollView>
      {/* Card 1 — account-security */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/account-security')}
          accessibilityRole="button"
          accessibilityLabel={COPY.cards.accountSecurity}
        >
          <Text>{COPY.cards.accountSecurity}</Text>
          <Text>›</Text>
        </Pressable>
      </View>

      {/* Card 2 — 4 disabled placeholders */}
      <View>
        {(['general', 'notifications', 'privacy', 'about'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={undefined}
            accessibilityRole="button"
            accessibilityLabel={COPY.cards[key]}
            accessibilityState={{ disabled: true }}
            style={{ opacity: DISABLED_OPACITY }}
          >
            <Text>{COPY.cards[key]}</Text>
            <Text>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Card 3 — switchAccount disabled / logout */}
      <View>
        <Pressable
          onPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={COPY.cards.switchAccount}
          accessibilityState={{ disabled: true }}
          style={{ opacity: DISABLED_OPACITY }}
        >
          <Text>{COPY.cards.switchAccount}</Text>
        </Pressable>
        <Pressable
          onPress={confirmLogout}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={COPY.cards.logout}
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
          style={{ opacity: isLoading ? DISABLED_OPACITY : 1 }}
        >
          <Text>{COPY.cards.logout}</Text>
        </Pressable>
      </View>

      {/* Footer — 双链接 */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/legal/personal-info')}
          accessibilityRole="link"
          accessibilityLabel={COPY.legal.personalInfo}
        >
          <Text style={{ color: 'blue' }}>{COPY.legal.personalInfo}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/settings/legal/third-party')}
          accessibilityRole="link"
          accessibilityLabel={COPY.legal.thirdParty}
        >
          <Text style={{ color: 'blue' }}>{COPY.legal.thirdParty}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
