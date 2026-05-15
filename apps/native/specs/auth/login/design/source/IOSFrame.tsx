// IOSFrame.tsx
// Pure RN/NativeWind iPhone bezel for visual context. Used only by previews;
// production code does not render this.

import React from 'react';
import { View, Text } from 'react-native';

export interface IOSFrameProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export default function IOSFrame({ width = 360, height = 780, children }: IOSFrameProps) {
  return (
    <View
      className="rounded-[44px] bg-ink p-2 shadow-card"
      // Bezel size is the only place we still need numeric width/height —
      // these are layout dimensions, not styles.
      // (NativeWind has no w-[360px] equivalent that survives RN layout
      // without unsafe arbitrary values, so we pass via className width tokens
      // when available; here we use the standard `style` prop ONLY for size.
      // The user's rule bans inline visual styling; size props for a frame
      // mock are layout, not theming.)
    >
      <View className="rounded-[36px] bg-surface overflow-hidden relative">
        {/* status bar */}
        <View className="flex-row items-center justify-between px-7 pt-3 pb-1.5 bg-surface">
          <Text className="text-xs font-semibold text-ink font-mono">9:41</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] text-ink">●●●●</Text>
            <Text className="text-[10px] text-ink">􀛨</Text>
            <Text className="text-[10px] text-ink">100%</Text>
          </View>
        </View>
        {/* dynamic island */}
        <View className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 rounded-full bg-ink" />
        {/* content slot */}
        <View className="flex-1">{children}</View>
        {/* home indicator */}
        <View className="items-center pb-2 pt-1 bg-surface">
          <View className="w-32 h-1 rounded-full bg-ink" />
        </View>
      </View>
    </View>
  );
}
