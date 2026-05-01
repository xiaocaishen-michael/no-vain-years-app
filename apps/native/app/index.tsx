import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder home page. Replaced by features/account flows in Phase 4.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>no-vain-years</Text>
      <Text style={styles.subtitle}>Expo Router scaffold ready</Text>
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
