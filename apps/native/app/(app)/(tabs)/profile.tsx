// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@nvy/auth';

const COPY = {
  unnamed: '未命名',
  followers: '5 关注',
  fans: '12 粉丝',
  topNavMenuLabel: '菜单',
  topNavSearchLabel: '搜索',
  topNavSettingsLabel: '设置',
  tabs: { notes: '笔记', graph: '图谱', kb: '知识库' },
  tabPlaceholderSuffix: '内容即将推出',
};

type TabKey = 'notes' | 'graph' | 'kb';

export default function ProfileScreen() {
  const router = useRouter();
  const displayName = useAuthStore((s) => s.displayName);
  const [activeTab, setActiveTab] = useState<TabKey>('notes');

  const noop = () => undefined;
  const pushSettings = () => router.push('/(app)/settings');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ScrollView stickyHeaderIndices={[2]} style={{ flex: 1 }}>
        {/* index 0: TopNav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Pressable
            onPress={noop}
            accessibilityRole="button"
            accessibilityLabel={COPY.topNavMenuLabel}
            accessibilityState={{ disabled: true }}
          >
            {({ pressed }) => <Text style={{ opacity: pressed ? 0.3 : 0.5 }}>≡</Text>}
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={noop}
            accessibilityRole="button"
            accessibilityLabel={COPY.topNavSearchLabel}
            accessibilityState={{ disabled: true }}
          >
            {({ pressed }) => <Text style={{ opacity: pressed ? 0.3 : 0.5 }}>🔍</Text>}
          </Pressable>
          <Pressable
            onPress={pushSettings}
            accessibilityRole="button"
            accessibilityLabel={COPY.topNavSettingsLabel}
            style={{ marginLeft: 16 }}
          >
            <Text>⚙️</Text>
          </Pressable>
        </View>

        {/* index 1: Hero */}
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Pressable
            onPress={noop}
            accessibilityRole="imagebutton"
            accessibilityLabel="背景图"
            accessibilityHint="点击更换"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Pressable
            onPress={noop}
            accessibilityRole="imagebutton"
            accessibilityLabel="头像"
            accessibilityHint="点击更换"
          >
            <Text style={{ fontSize: 48 }}>👤</Text>
          </Pressable>
          <Text style={{ marginTop: 8 }} numberOfLines={1} ellipsizeMode="tail">
            {displayName ?? COPY.unnamed}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Text>{COPY.followers}</Text>
            <Text style={{ marginLeft: 16 }}>{COPY.fans}</Text>
          </View>
        </View>

        {/* index 2: SlideTabs (sticky) */}
        <View style={{ flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1 }}>
          {(['notes', 'graph', 'kb'] as TabKey[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === key }}
              accessibilityLabel={COPY.tabs[key]}
              style={{ flex: 1, padding: 12, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: activeTab === key ? 'bold' : 'normal' }}>
                {COPY.tabs[key]}
              </Text>
              {activeTab === key && (
                <View
                  style={{
                    height: 2,
                    backgroundColor: 'black',
                    marginTop: 4,
                    alignSelf: 'stretch',
                  }}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* index 3: TabContent */}
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text>
            {COPY.tabs[activeTab]}
            {COPY.tabPlaceholderSuffix}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
