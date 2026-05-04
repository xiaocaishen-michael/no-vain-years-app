import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type SpinnerTone = 'white' | 'muted' | 'brand';

export interface SpinnerProps {
  size?: number;
  tone?: SpinnerTone;
}

export function Spinner({ size = 16, tone = 'white' }: SpinnerProps) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [r]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r.value}deg` }],
  }));

  const ring =
    tone === 'white'
      ? 'border-white/30 border-t-white'
      : tone === 'brand'
        ? 'border-brand-200 border-t-brand-500'
        : 'border-line border-t-ink-subtle';

  return (
    <Animated.View
      style={[{ width: size, height: size }, animatedStyle]}
      className={`rounded-full border-2 ${ring}`}
    />
  );
}
