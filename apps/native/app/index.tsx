import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder home page. Replaced by features/account flows in Phase 4.
//
// Intentionally uses plain RN primitives (not Tamagui's <YStack>/<Text>) for
// scaffold-stage smoke. TamaguiProvider in app/_layout.tsx confirms config
// loads + babel plugin compiles. Real Tamagui prop usage emerges with
// packages/ui components when Phase 4 pages need them.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>no-vain-years</Text>
      <Text style={styles.subtitle}>Tamagui provider mounted</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
