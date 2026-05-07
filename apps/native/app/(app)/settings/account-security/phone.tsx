import { ScrollView, Text } from 'react-native';

import { useAuthStore } from '@nvy/auth';

import { maskPhone } from '../../../../lib/format/phone';

export default function PhoneScreen() {
  const phone = useAuthStore((s) => s.phone);
  const masked = maskPhone(phone);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="flex-1 items-center justify-center px-lg"
    >
      <Text className="text-2xl font-semibold text-ink font-mono tracking-wide">{masked}</Text>
    </ScrollView>
  );
}
