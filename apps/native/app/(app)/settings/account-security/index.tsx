import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { useAuthStore } from '@nvy/auth';

import { maskPhone } from '../../../../lib/format/phone';
import { Card, Divider, Row } from '../../../../components/settings/primitives';

const COPY = {
  phone: '手机号',
  realname: '实名认证',
  thirdPartyBinding: '第三方账号绑定',
  loginManagement: '登录管理',
  deleteAccount: '注销账号',
  securityTips: '安全小知识',
};

export default function AccountSecurityIndex() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phone);

  return (
    <ScrollView
      className="flex-1 bg-surface-sunken"
      contentContainerClassName="px-md pt-md pb-xl gap-md"
    >
      <Card>
        <Row
          label={COPY.phone}
          value={maskPhone(phone)}
          onPress={() => router.push('/(app)/settings/account-security/phone')}
        />
        <Divider />
        <Row label={COPY.realname} disabled />
        <Divider />
        <Row label={COPY.thirdPartyBinding} disabled />
      </Card>

      <Card>
        <Row
          label={COPY.loginManagement}
          onPress={() => router.push('/(app)/settings/account-security/login-management')}
        />
      </Card>

      <Card>
        <Row
          label={COPY.deleteAccount}
          destructive
          onPress={() => router.push('/(app)/settings/account-security/delete-account')}
        />
        <Divider />
        <Row label={COPY.securityTips} disabled />
      </Card>
    </ScrollView>
  );
}
