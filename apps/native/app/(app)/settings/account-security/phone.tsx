// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { ScrollView, Text } from 'react-native';

import { useAuthStore } from '@nvy/auth';

import { maskPhone } from '../../../../lib/format/phone';

export default function PhoneScreen() {
  const phone = useAuthStore((s) => s.phone);
  const masked = maskPhone(phone);

  return (
    <ScrollView>
      <Text>{masked}</Text>
    </ScrollView>
  );
}
