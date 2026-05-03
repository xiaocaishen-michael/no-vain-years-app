import { Pressable, Text, View } from 'react-native';

import { useLoginForm } from '../../lib/hooks/use-login-form';

// Minimal placeholder wired to useLoginForm. Visual decisions deferred to
// the next PR (after Claude Design mockup lands → packages/ui components +
// className 1:1 paste). For now: tab switch demonstrates business-logic
// wiring is live; form inputs / submit affordances pending mockup.
export default function LoginScreen() {
  const { tab, setTab } = useLoginForm();

  return (
    <View className="flex-1 bg-surface px-md pt-xl">
      <View className="flex-row gap-md">
        <Pressable
          accessibilityLabel="密码登录 tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'password' }}
          onPress={() => setTab('password')}
        >
          <Text className={tab === 'password' ? 'text-base text-text' : 'text-base text-muted'}>
            密码登录
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="短信登录 tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'sms' }}
          onPress={() => setTab('sms')}
        >
          <Text className={tab === 'sms' ? 'text-base text-text' : 'text-base text-muted'}>
            短信登录
          </Text>
        </Pressable>
      </View>
      <Text className="mt-md text-sm text-muted">
        Phase 4 mockup pending — form wiring 已就位（hook + schema 单测覆盖）
      </Text>
    </View>
  );
}
