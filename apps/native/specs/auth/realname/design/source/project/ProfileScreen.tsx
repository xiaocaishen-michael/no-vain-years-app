// ProfileScreen.tsx
// 「我的」页 — already-onboarded user landing screen.
//
// 4 zones, top-down:
//   1. Top nav (fixed; transparent over hero, surface after sticky)
//   2. Hero (photo blur + overlay + avatar + displayName + stats)
//   3. SlideTabs row (sticky on scroll past hero)
//   4. Tab content placeholder
//   + 5. Bottom tab bar (fixed)
//
// Tokens (mirror login v2): brand / accent / ink / line / surface / ok / warn /
// err / spacing / radius / shadow / fontFamily — plus 3 alpha tints added in
// tailwind.config.js for hero blur legibility:
//   hero-overlay   — 36% black scrim above blurred photo
//   white-soft     — 72% white for nav icons / divider on blur
//   white-strong   — 92% white for displayName / counts on blur
//
// State machine (mockup-only; production drives via real scroll + tab state):
//   "default-notes"   — Hero visible, SlideTabs not sticky, tab=notes
//   "sticky-scrolled" — Hero scrolled out, SlideTabs sticky under nav, tab=notes
//   "graph-tab"       — Hero visible, tab=graph
//   "kb-tab"          — Hero visible, tab=kb
//
// blur impl note: production uses expo-blur <BlurView intensity={36}>; mockup
// renders a tinted gradient stand-in via the photo placeholder + overlay.

import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ImageBackground } from 'react-native';
import Svg, {
  Rect,
  Circle,
  G,
  Path,
  Line,
  Polyline,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type TabKey = 'notes' | 'graph' | 'kb';
export type ProfileState = 'default-notes' | 'sticky-scrolled' | 'graph-tab' | 'kb-tab';

export interface ProfileScreenProps {
  state?: ProfileState;
  /** Hardcoded mockup data — production reads from auth context / API. */
  displayName?: string;
  followingCount?: number;
  followersCount?: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Glyphs (react-native-svg) — picked to match SF Symbols / Material vocab.
// ─────────────────────────────────────────────────────────────────────────
const stroke = (c: string, w = 2) => ({
  stroke: c,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

function IconMenu({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G {...stroke(color, 2)}>
        <Line x1={4} y1={7} x2={20} y2={7} />
        <Line x1={4} y1={12} x2={20} y2={12} />
        <Line x1={4} y1={17} x2={20} y2={17} />
      </G>
    </Svg>
  );
}

function IconSearch({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G {...stroke(color, 2)}>
        <Circle cx={11} cy={11} r={7} />
        <Path d="M20 20 L16 16" />
      </G>
    </Svg>
  );
}

function IconGear({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G {...stroke(color, 1.6)}>
        <Circle cx={12} cy={12} r={3} />
        <Path d="M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.2 5.2l2.1 2.1 M16.7 16.7l2.1 2.1 M5.2 18.8l2.1-2.1 M16.7 7.3l2.1-2.1" />
      </G>
    </Svg>
  );
}

// Bottom-tab glyphs
function IconHome({ color, filled }: { color: string; filled?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M3 11 L12 4 L21 11 V20 a1 1 0 0 1-1 1 H15 V14 H9 V21 H4 a1 1 0 0 1-1-1 Z"
        {...(filled ? { fill: color } : { ...stroke(color, 1.7) })}
      />
    </Svg>
  );
}

function IconCompass({ color, filled }: { color: string; filled?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...(filled ? { fill: color } : { ...stroke(color, 1.7) })} />
      <Path d="M15 9 L13 13 L9 15 L11 11 Z" fill={filled ? '#fff' : color} />
    </Svg>
  );
}

function IconSpark({ color, filled }: { color: string; filled?: boolean }) {
  // Externalbrain — sparkle / cluster
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <G
        {...(filled
          ? { fill: color, stroke: color, strokeWidth: 1.4, strokeLinejoin: 'round' as const }
          : { ...stroke(color, 1.7) })}
      >
        <Path d="M12 3 L13.6 9 L20 11 L13.6 13 L12 19 L10.4 13 L4 11 L10.4 9 Z" />
      </G>
      <Circle cx={18} cy={5} r={1.4} fill={color} />
      <Circle cx={5} cy={18} r={1.1} fill={color} />
    </Svg>
  );
}

function IconUser({ color, filled }: { color: string; filled?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {filled ? (
        <G fill={color}>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21 a8 8 0 0 1 16 0 Z" />
        </G>
      ) : (
        <G {...stroke(color, 1.7)}>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21 a8 8 0 0 1 16 0" />
        </G>
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero photo placeholder — gradient stand-in so we don't ship a real photo.
// Production: <ImageBackground source={user.coverPhoto} blurRadius={20}>
// ─────────────────────────────────────────────────────────────────────────
function HeroBlurBackdrop() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 320" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#3B5BD9" />
          <Stop offset="55%" stopColor="#7B5BC9" />
          <Stop offset="100%" stopColor="#D98A6B" />
        </LinearGradient>
        <LinearGradient id="heroBlobs" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="320" fill="url(#heroBg)" />
      {/* simulated bokeh / cloud pillows for the "blurred photo" feel */}
      <Circle cx="80" cy="60" r="90" fill="url(#heroBlobs)" />
      <Circle cx="290" cy="40" r="70" fill="url(#heroBlobs)" />
      <Circle cx="220" cy="160" r="120" fill="url(#heroBlobs)" />
      <Circle cx="60" cy="220" r="80" fill="url(#heroBlobs)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Avatar placeholder — gradient ring around an empty state silhouette
// ─────────────────────────────────────────────────────────────────────────
function AvatarPlaceholder({ initial = '小' }: { initial?: string }) {
  return (
    <View className="w-[72px] h-[72px] rounded-full bg-white p-[3px] shadow-hero-ring">
      <View className="flex-1 rounded-full bg-brand-500 items-center justify-center">
        <Text className="text-white text-2xl font-semibold tracking-tight">{initial}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Top nav — transparent on hero, white surface when sticky
// ─────────────────────────────────────────────────────────────────────────
function TopNav({ onBlur }: { onBlur: boolean }) {
  const iconColor = onBlur ? '#FFFFFF' : '#1A1A1A';
  return (
    <View
      className={`flex-row items-center justify-between h-12 px-md ${onBlur ? 'bg-transparent' : 'bg-surface border-b border-line-soft'}`}
    >
      {/* left */}
      <Pressable hitSlop={10} className="w-10 h-10 items-center justify-center">
        <IconMenu color={iconColor} />
      </Pressable>
      {/* spacer */}
      <View className="flex-1" />
      {/* right */}
      <View className="flex-row items-center gap-1">
        <Pressable hitSlop={10} className="w-10 h-10 items-center justify-center">
          <IconSearch color={iconColor} />
        </Pressable>
        <Pressable hitSlop={10} className="w-10 h-10 items-center justify-center">
          <IconGear color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SlideTabs — animated underline indicator (reanimated v3)
// ─────────────────────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string }[] = [
  { key: 'notes', label: '笔记' },
  { key: 'graph', label: '图谱' },
  { key: 'kb', label: '知识库' },
];

const TAB_W = 88; // each tab occupies a fixed slot width
const INDICATOR_W = 24;

function SlideTabs({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const idx = TABS.findIndex((t) => t.key === active);
  // indicator x-offset = tab-slot-x + (slot-width − indicator-width)/2
  const offset = useSharedValue(idx * TAB_W + (TAB_W - INDICATOR_W) / 2);

  useEffect(() => {
    offset.value = withTiming(idx * TAB_W + (TAB_W - INDICATOR_W) / 2, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [idx, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View className="bg-surface border-b border-line-soft">
      <View className="flex-row self-center pt-2">
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              className={`w-[${TAB_W}px] items-center pb-3`}
            >
              <Text
                className={
                  on ? 'text-base font-semibold text-ink' : 'text-base font-medium text-ink-muted'
                }
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
        <Animated.View
          style={indicatorStyle}
          className={`absolute bottom-0 left-0 h-[3px] w-[${INDICATOR_W}px] rounded-full bg-brand-500`}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab content placeholders
// ─────────────────────────────────────────────────────────────────────────
function TabPlaceholder({ tab }: { tab: TabKey }) {
  const copy =
    tab === 'notes'
      ? '笔记内容 coming soon'
      : tab === 'graph'
        ? '图谱内容 coming soon'
        : '知识库内容 coming soon';
  return (
    <View className="flex-1 items-center justify-center py-2xl gap-3">
      <View className="w-14 h-14 rounded-full bg-surface-sunken items-center justify-center">
        <View className="w-6 h-6 rounded-full bg-line-strong" />
      </View>
      <Text className="text-sm text-ink-muted">{copy}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Bottom tab bar (4 items, "我的" active)
// ─────────────────────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { key: 'home', label: '首页', Icon: IconHome },
  { key: 'explore', label: '搜索', Icon: IconCompass },
  { key: 'brain', label: '外脑', Icon: IconSpark },
  { key: 'me', label: '我的', Icon: IconUser },
] as const;

function BottomTabs({ active = 'me' }: { active?: string }) {
  return (
    <View className="flex-row bg-surface border-t border-line-soft pt-1.5 pb-2">
      {BOTTOM_TABS.map((t) => {
        const on = t.key === active;
        const color = on ? '#2456E5' : '#999999';
        return (
          <Pressable key={t.key} className="flex-1 items-center gap-1 py-1">
            <t.Icon color={color} filled={on} />
            <Text
              className={
                on ? 'text-[11px] font-semibold text-brand-500' : 'text-[11px] text-ink-subtle'
              }
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero block — backdrop + scrim + avatar + name + stats
// ─────────────────────────────────────────────────────────────────────────
function Hero({
  displayName,
  followingCount,
  followersCount,
}: {
  displayName: string;
  followingCount: number;
  followersCount: number;
}) {
  return (
    <View className="h-[280px] relative overflow-hidden">
      {/* photo blur backdrop */}
      <View className="absolute inset-0">
        <HeroBlurBackdrop />
      </View>
      {/* scrim for legibility */}
      <View className="absolute inset-0 bg-hero-overlay" />
      {/* gradient fade to surface at bottom (rendered as overlapping bands) */}
      <View className="absolute left-0 right-0 bottom-0 h-12 bg-surface opacity-0" />

      {/* content (sits below top nav which is absolute) */}
      <View className="flex-1 items-center justify-end pb-8 px-md">
        <AvatarPlaceholder />
        <Text className="text-[22px] font-bold text-white-strong mt-3 tracking-tight">
          {displayName}
        </Text>
        <View className="flex-row items-center gap-md mt-2">
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold text-white-strong">{followingCount}</Text>
            <Text className="text-xs text-white-soft">关注</Text>
          </View>
          <View className="w-px h-3 bg-white-soft" />
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold text-white-strong">{followersCount}</Text>
            <Text className="text-xs text-white-soft">粉丝</Text>
          </View>
        </View>
      </View>

      {/* soft fade-to-white at the very bottom edge */}
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 bottom-0 h-6 bg-surface opacity-30"
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
export default function ProfileScreen({
  state = 'default-notes',
  displayName = '小明',
  followingCount = 5,
  followersCount = 12,
}: ProfileScreenProps) {
  // derive tab + sticky from state
  const isSticky = state === 'sticky-scrolled';
  const initialTab: TabKey = state === 'graph-tab' ? 'graph' : state === 'kb-tab' ? 'kb' : 'notes';

  const [tab, setTab] = React.useState<TabKey>(initialTab);
  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <View className="flex-1 bg-surface">
      {/* === Body === */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-2xl"
        scrollEventThrottle={16}
        // Mockup hint — production toggles isSticky from real onScroll.
      >
        {!isSticky ? (
          <Hero
            displayName={displayName}
            followingCount={followingCount}
            followersCount={followersCount}
          />
        ) : null}
        {/* SlideTabs row (always rendered; sticky in production via stickyHeaderIndices) */}
        <View>
          <SlideTabs active={tab} onChange={setTab} />
        </View>
        {/* Tab content */}
        <View className="bg-surface min-h-[260px]">
          <TabPlaceholder tab={tab} />
        </View>
      </ScrollView>

      {/* === Top nav (absolute over hero, surface when sticky) === */}
      <View className="absolute top-0 left-0 right-0">
        <TopNav onBlur={!isSticky} />
      </View>

      {/* === Bottom tab bar === */}
      <BottomTabs active="me" />
    </View>
  );
}
