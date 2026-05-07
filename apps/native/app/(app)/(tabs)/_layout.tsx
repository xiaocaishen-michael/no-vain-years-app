import { Tabs } from 'expo-router';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { tokens } from '@nvy/design-tokens';

const BOTTOM_TAB_LABELS = {
  home: '首页',
  search: '搜索',
  pkm: '外脑',
  profile: '我的',
};

const stroke = (c: string, w = 1.7) =>
  ({
    stroke: c,
    strokeWidth: w,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  }) as const;

function IconHome({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M3 11 L12 4 L21 11 V20 a1 1 0 0 1-1 1 H15 V14 H9 V21 H4 a1 1 0 0 1-1-1 Z"
        {...(focused ? { fill: color } : stroke(color))}
      />
    </Svg>
  );
}

function IconCompass({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...(focused ? { fill: color } : stroke(color))} />
      <Path d="M15 9 L13 13 L9 15 L11 11 Z" fill={focused ? '#FFFFFF' : color} />
    </Svg>
  );
}

function IconSpark({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <G
        stroke={color}
        strokeWidth={focused ? 1.4 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? color : 'none'}
      >
        <Path d="M12 3 L13.6 9 L20 11 L13.6 13 L12 19 L10.4 13 L4 11 L10.4 9 Z" />
      </G>
      <Circle cx={18} cy={5} r={1.4} fill={color} />
      <Circle cx={5} cy={18} r={1.1} fill={color} />
    </Svg>
  );
}

function IconUser({ color, focused }: { color: string; focused: boolean }) {
  if (focused) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <G fill={color}>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21 a8 8 0 0 1 16 0 Z" />
        </G>
      </Svg>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Circle cx={12} cy={8} r={4} />
        <Path d="M4 21 a8 8 0 0 1 16 0" />
      </G>
    </Svg>
  );
}

const renderIcon =
  (Icon: React.ComponentType<{ color: string; focused: boolean }>) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon color={color} focused={focused} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.brand[500],
        tabBarInactiveTintColor: tokens.colors.ink.subtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarLabel: BOTTOM_TAB_LABELS.home, tabBarIcon: renderIcon(IconHome) }}
      />
      <Tabs.Screen
        name="search"
        options={{ tabBarLabel: BOTTOM_TAB_LABELS.search, tabBarIcon: renderIcon(IconCompass) }}
      />
      <Tabs.Screen
        name="pkm"
        options={{ tabBarLabel: BOTTOM_TAB_LABELS.pkm, tabBarIcon: renderIcon(IconSpark) }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarLabel: BOTTOM_TAB_LABELS.profile, tabBarIcon: renderIcon(IconUser) }}
      />
    </Tabs>
  );
}
