// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAuthStore } from '@nvy/auth';

import { maskPhone } from '../../../../lib/format/phone';

const COPY = {
  phone: '手机号',
  realname: '实名认证',
  thirdPartyBinding: '第三方账号绑定',
  loginDevices: '登录设备与授权管理',
  deleteAccount: '注销账号',
  securityTips: '安全小知识',
};

const DISABLED_OPACITY = 0.5;

export default function AccountSecurityIndex() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phone);

  return (
    <ScrollView>
      {/* Card 1: 手机号 / 实名认证 disabled / 第三方账号绑定 disabled */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/account-security/phone')}
          accessibilityRole="button"
          accessibilityLabel={COPY.phone}
        >
          <Text>{COPY.phone}</Text>
          <Text>{maskPhone(phone)}</Text>
          <Text>›</Text>
        </Pressable>
        {(['realname', 'thirdPartyBinding'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={undefined}
            accessibilityRole="button"
            accessibilityLabel={COPY[key]}
            accessibilityState={{ disabled: true }}
            style={{ opacity: DISABLED_OPACITY }}
          >
            <Text>{COPY[key]}</Text>
            <Text>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Card 2: 登录设备与授权管理 disabled */}
      <View>
        <Pressable
          onPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={COPY.loginDevices}
          accessibilityState={{ disabled: true }}
          style={{ opacity: DISABLED_OPACITY }}
        >
          <Text>{COPY.loginDevices}</Text>
          <Text>›</Text>
        </Pressable>
      </View>

      {/* Card 3: 注销账号 / 安全小知识 disabled */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/account-security/delete-account')}
          accessibilityRole="button"
          accessibilityLabel={COPY.deleteAccount}
        >
          <Text>{COPY.deleteAccount}</Text>
          <Text>›</Text>
        </Pressable>
        <Pressable
          onPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={COPY.securityTips}
          accessibilityState={{ disabled: true }}
          style={{ opacity: DISABLED_OPACITY }}
        >
          <Text>{COPY.securityTips}</Text>
          <Text>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
