import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Per handoff.md § 5.1: bundle used `w-18 h-18` which Tailwind's default spacing
// scale does not include. We use arbitrary `w-[72px] h-[72px]` to preserve the
// original 72px size (4.5rem). The inner circle stays at `w-12 h-12` (48px).
export function SuccessCheck() {
  const s = useSharedValue(0);

  useEffect(() => {
    s.value = withSequence(
      withTiming(1.1, { duration: 240, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 140, easing: Easing.out(Easing.cubic) }),
    );
  }, [s]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
    opacity: s.value === 0 ? 0 : 1,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-[72px] h-[72px] rounded-full bg-ok-soft items-center justify-center"
    >
      <View className="w-12 h-12 rounded-full bg-ok items-center justify-center">
        <Text className="text-white text-2xl font-bold">✓</Text>
      </View>
    </Animated.View>
  );
}
