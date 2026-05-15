// preview/ProfileScreen.preview.jsx — browser mirror of ProfileScreen.tsx
// (RN primitives + SVG come from window globals via shims.)

const stroke = (c, w = 2) => ({ stroke: c, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" });

function IconMenu({ color = "#fff" }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G {...stroke(color, 2)}>
        <Line x1={4} y1={7} x2={20} y2={7}/>
        <Line x1={4} y1={12} x2={20} y2={12}/>
        <Line x1={4} y1={17} x2={20} y2={17}/>
      </G>
    </Svg>
  );
}
function IconSearch({ color = "#fff" }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G {...stroke(color, 2)}>
        <Circle cx={11} cy={11} r={7}/>
        <Path d="M20 20 L16 16"/>
      </G>
    </Svg>
  );
}
function IconGear({ color = "#fff" }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G {...stroke(color, 1.6)}>
        <Circle cx={12} cy={12} r={3}/>
        <Path d="M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.2 5.2l2.1 2.1 M16.7 16.7l2.1 2.1 M5.2 18.8l2.1-2.1 M16.7 7.3l2.1-2.1"/>
      </G>
    </Svg>
  );
}
function IconHome({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 11 L12 4 L21 11 V20 a1 1 0 0 1-1 1 H15 V14 H9 V21 H4 a1 1 0 0 1-1-1 Z"
        {...(filled ? { fill: color } : stroke(color, 1.7))}/>
    </Svg>
  );
}
function IconCompass({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...(filled ? { fill: color } : stroke(color, 1.7))}/>
      <Path d="M15 9 L13 13 L9 15 L11 11 Z" fill={filled ? "#fff" : color}/>
    </Svg>
  );
}
function IconSpark({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <G {...(filled ? { fill: color, stroke: color, strokeWidth: 1.4, strokeLinejoin: "round" } : stroke(color, 1.7))}>
        <Path d="M12 3 L13.6 9 L20 11 L13.6 13 L12 19 L10.4 13 L4 11 L10.4 9 Z"/>
      </G>
      <Circle cx={18} cy={5} r={1.4} fill={color}/>
      <Circle cx={5} cy={18} r={1.1} fill={color}/>
    </Svg>
  );
}
function IconUser({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {filled ? (
        <G fill={color}>
          <Circle cx={12} cy={8} r={4}/>
          <Path d="M4 21 a8 8 0 0 1 16 0 Z"/>
        </G>
      ) : (
        <G {...stroke(color, 1.7)}>
          <Circle cx={12} cy={8} r={4}/>
          <Path d="M4 21 a8 8 0 0 1 16 0"/>
        </G>
      )}
    </Svg>
  );
}

function HeroBlurBackdrop() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 320" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"  stopColor="#3B5BD9"/>
          <Stop offset="55%" stopColor="#7B5BC9"/>
          <Stop offset="100%" stopColor="#D98A6B"/>
        </LinearGradient>
        <LinearGradient id="heroBlobs" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16"/>
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Rect width="360" height="320" fill="url(#heroBg)"/>
      <Circle cx="80"  cy="60"  r="90"  fill="url(#heroBlobs)"/>
      <Circle cx="290" cy="40"  r="70"  fill="url(#heroBlobs)"/>
      <Circle cx="220" cy="160" r="120" fill="url(#heroBlobs)"/>
      <Circle cx="60"  cy="220" r="80"  fill="url(#heroBlobs)"/>
    </Svg>
  );
}

function AvatarPlaceholder({ initial = "小" }) {
  return (
    <View className="rounded-full bg-white shadow-hero-ring" style={{ width: 72, height: 72, padding: 3 }}>
      <View className="flex-1 rounded-full bg-brand-500 items-center justify-center">
        <Text className="text-white text-2xl font-semibold tracking-tight">{initial}</Text>
      </View>
    </View>
  );
}

function TopNav({ onBlur }) {
  const iconColor = onBlur ? "#FFFFFF" : "#1A1A1A";
  return (
    <View
      className={`flex-row items-center justify-between px-md ${onBlur ? "bg-transparent" : "bg-surface border-b border-line-soft"}`}
      style={{ height: 48 }}
    >
      <Pressable className="items-center justify-center" style={{ width: 40, height: 40 }}>
        <IconMenu color={iconColor}/>
      </Pressable>
      <View className="flex-1"/>
      <View className="flex-row items-center gap-1">
        <Pressable className="items-center justify-center" style={{ width: 40, height: 40 }}>
          <IconSearch color={iconColor}/>
        </Pressable>
        <Pressable className="items-center justify-center" style={{ width: 40, height: 40 }}>
          <IconGear color={iconColor}/>
        </Pressable>
      </View>
    </View>
  );
}

const TABS = [
  { key: "notes", label: "笔记" },
  { key: "graph", label: "图谱" },
  { key: "kb",    label: "知识库" },
];
const TAB_W = 88;
const INDICATOR_W = 24;

function SlideTabs({ active, onChange }) {
  const idx = TABS.findIndex(t => t.key === active);
  const offset = useSharedValue(idx * TAB_W + (TAB_W - INDICATOR_W) / 2);
  React.useEffect(() => {
    offset.value = withTiming(idx * TAB_W + (TAB_W - INDICATOR_W) / 2, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [idx]);
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View className="bg-surface border-b border-line-soft">
      <View className="flex-row self-center" style={{ paddingTop: 8, position: "relative" }}>
        {TABS.map(t => {
          const on = t.key === active;
          return (
            <Pressable key={t.key} onPress={() => onChange(t.key)} className="items-center" style={{ width: TAB_W, paddingBottom: 12 }}>
              <Text className={on ? "text-base font-semibold text-ink" : "text-base font-medium text-ink-muted"}>{t.label}</Text>
            </Pressable>
          );
        })}
        <Animated.View
          style={[indicatorStyle, { position: "absolute", bottom: 0, left: 0, height: 3, width: INDICATOR_W, borderRadius: 9999, backgroundColor: "#2456E5" }]}
        />
      </View>
    </View>
  );
}

function TabPlaceholder({ tab }) {
  const copy = tab === "notes" ? "笔记内容 coming soon"
            : tab === "graph" ? "图谱内容 coming soon"
            : "知识库内容 coming soon";
  return (
    <View className="flex-1 items-center justify-center gap-3" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <View className="rounded-full bg-surface-sunken items-center justify-center" style={{ width: 56, height: 56 }}>
        <View className="rounded-full bg-line-strong" style={{ width: 24, height: 24 }}/>
      </View>
      <Text className="text-sm text-ink-muted">{copy}</Text>
    </View>
  );
}

const BOTTOM_TABS = [
  { key: "home",    label: "首页",  Icon: IconHome },
  { key: "explore", label: "搜索",  Icon: IconCompass },
  { key: "brain",   label: "外脑",  Icon: IconSpark },
  { key: "me",      label: "我的",  Icon: IconUser },
];

function BottomTabs({ active = "me" }) {
  return (
    <View className="flex-row bg-surface border-t border-line-soft" style={{ paddingTop: 6, paddingBottom: 8 }}>
      {BOTTOM_TABS.map(t => {
        const on = t.key === active;
        const color = on ? "#2456E5" : "#999999";
        return (
          <Pressable key={t.key} className="flex-1 items-center gap-1" style={{ paddingTop: 4, paddingBottom: 4 }}>
            <t.Icon color={color} filled={on}/>
            <Text className={on ? "text-[11px] font-semibold text-brand-500" : "text-[11px] text-ink-subtle"}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Hero({ displayName, followingCount, followersCount }) {
  return (
    <View className="relative overflow-hidden" style={{ height: 280 }}>
      <View style={{ position: "absolute", inset: 0 }}>
        <HeroBlurBackdrop/>
      </View>
      <View className="bg-hero-overlay" style={{ position: "absolute", inset: 0 }}/>
      <View className="flex-1 items-center justify-end px-md" style={{ paddingBottom: 32 }}>
        <AvatarPlaceholder/>
        <Text className="text-white-strong font-bold tracking-tight" style={{ fontSize: 22, marginTop: 12 }}>{displayName}</Text>
        <View className="flex-row items-center gap-md" style={{ marginTop: 8 }}>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold text-white-strong">{followingCount}</Text>
            <Text className="text-xs text-white-soft">关注</Text>
          </View>
          <View className="bg-white-soft" style={{ width: 1, height: 12 }}/>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold text-white-strong">{followersCount}</Text>
            <Text className="text-xs text-white-soft">粉丝</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ProfileScreen({ state = "default-notes", displayName = "小明", followingCount = 5, followersCount = 12 }) {
  const isSticky = state === "sticky-scrolled";
  const initialTab =
    state === "graph-tab" ? "graph" :
    state === "kb-tab"    ? "kb"    :
                            "notes";
  const [tab, setTab] = React.useState(initialTab);
  React.useEffect(() => { setTab(initialTab); }, [initialTab]);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1">
        {!isSticky ? <Hero displayName={displayName} followingCount={followingCount} followersCount={followersCount}/> : null}
        <View>
          <SlideTabs active={tab} onChange={setTab}/>
        </View>
        <View className="bg-surface" style={{ minHeight: 260 }}>
          <TabPlaceholder tab={tab}/>
        </View>
      </ScrollView>

      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <TopNav onBlur={!isSticky}/>
      </View>

      <BottomTabs active="me"/>
    </View>
  );
}

window.ProfileScreen = ProfileScreen;
