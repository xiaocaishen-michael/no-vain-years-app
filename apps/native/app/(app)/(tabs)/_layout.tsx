// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Tabs } from 'expo-router';

const BOTTOM_TAB_LABELS = {
  home: '首页',
  search: '搜索',
  pkm: '外脑',
  profile: '我的',
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ tabBarLabel: BOTTOM_TAB_LABELS.home }} />
      <Tabs.Screen name="search" options={{ tabBarLabel: BOTTOM_TAB_LABELS.search }} />
      <Tabs.Screen name="pkm" options={{ tabBarLabel: BOTTOM_TAB_LABELS.pkm }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: BOTTOM_TAB_LABELS.profile }} />
    </Tabs>
  );
}
