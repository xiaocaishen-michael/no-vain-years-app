// preview/IOSFrame.preview.jsx — browser-loadable copy of IOSFrame.tsx
// (mirrors the RN source; imports are stripped because the shim provides them globally.)

function IOSFrame({ width = 360, height = 780, children }) {
  return (
    <View
      className="rounded-[44px] bg-ink p-2 shadow-card"
      style={{ width: width + 16, alignSelf: "flex-start" }}
    >
      <View
        className="rounded-[36px] bg-surface overflow-hidden relative"
        style={{ width, height }}
      >
        {/* status bar */}
        <View className="flex-row items-center justify-between px-7 pt-3 pb-1.5 bg-surface" style={{ zIndex: 2 }}>
          <Text className="text-xs font-semibold text-ink font-mono">9:41</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] text-ink">●●●●</Text>
            <Text className="text-[10px] text-ink">100%</Text>
          </View>
        </View>
        {/* dynamic island */}
        <View
          className="absolute rounded-full bg-ink"
          style={{ top: 8, left: "50%", transform: "translateX(-50%)", width: 96, height: 28, zIndex: 3 }}
        />
        {/* content slot */}
        <View className="flex-1">{children}</View>
        {/* home indicator */}
        <View className="items-center pb-2 pt-1 bg-surface">
          <View className="rounded-full bg-ink" style={{ width: 128, height: 4 }}/>
        </View>
      </View>
    </View>
  );
}

window.IOSFrame = IOSFrame;
