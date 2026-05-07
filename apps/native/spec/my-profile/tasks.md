# Tasks: My Profile Page (`(tabs)` 接入 + 我的页骨架)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2026-05-07(per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程)
**Status**: Draft(本 PR docs-only;Impl 阶段下 session;PHASE 2 mockup 后续 PR)
**Phase**: SDD 拆分链 A/B/C 的 **A**(my-profile)

> **TDD enforcement**(per [no-vain-years-app CLAUDE.md § 五](https://github.com/xiaocaishen-michael/no-vain-years-app/blob/main/CLAUDE.md)):业务 hook / store / 工具函数 / 路由决策**必须**测;纯展示 UI 不强制 TDD。每条 task 内**测试任务绑定到实现 task**。
>
> **顺序**:T_doc(本 PR docs) → T1(AuthGate 改) → T2(Tabs layout) → T3(3 placeholder pages) → T4(`(app)/index.tsx` migration) → T5(profile screen 骨架 + Hero) → T6(SlideTabs 状态机) → T7(Sticky 滚动) → T8(集成测) → T9(真后端冒烟) → T_mock+(mockup PHASE 2 占位空表)。
>
> **状态语义**:无标记 = pending;`✅` = done(自动同步纪律,per meta sdd.md § 状态层与跨 session 接续协议)。

---

## 任务清单

### Pre-impl(已完成 / 本 PR docs-only)

| #        | 层级                        | 任务                                                                          | 文件                                                             | 状态                  |
| -------- | --------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------- |
| ✅T_dep1 | [Existing AuthGate]         | onboarding spec(PR #63)落地的三态 AuthGate                                    | `apps/native/app/_layout.tsx` + `lib/auth/auth-gate-decision.ts` | ✅                    |
| ✅T_dep2 | [Existing onboarding]       | onboarding PHASE 1 已 ship + PHASE 2 mockup 已 ship                           | `apps/native/app/(app)/onboarding.tsx`                           | ✅ PR #63 + #66 + #67 |
| ✅T_dep3 | [Existing /me + logout-all] | server `/me` / `logout-all` / `delete-account` / `cancel-deletion` 全部已落地 | server M1.3 PRs #131-138                                         | ✅                    |
| T_doc1   | [Inspiration]               | 4 张参考截图 + `notes.md` 决策留痕                                            | `apps/native/spec/my-profile/design/inspiration/`                | ✅ 本 PR              |
| T_doc2   | [Spec]                      | 写 spec.md(IA + User Flow + 21 + 5 Clarifications + 18 FR + 10 SC)            | `apps/native/spec/my-profile/spec.md`                            | ✅ 本 PR              |
| T_doc3   | [Plan]                      | 写 plan.md(7 关键决策 + 文件清单 + UI 段 4 边界占位)                          | `apps/native/spec/my-profile/plan.md`                            | ✅ 本 PR              |
| T_doc4   | [Tasks]                     | 写本文件 — T1-T9 实施步骤 + T_mock+ PHASE 2 占位空表                          | `apps/native/spec/my-profile/tasks.md`                           | ✅ 本 PR              |

### Impl 阶段(下个 PR — 业务流 + 占位 UI + 真后端冒烟)

| #   | 层级                 | 任务                                                                                                                         | 文件                                                                    | 状态    |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| T1  | [AuthGate]           | AuthGate 第三态目标改 `(app)/(tabs)/profile`(per FR-002 / SC-002)                                                            | `apps/native/lib/auth/auth-gate-decision.ts` + 同 dir test              | ✅      |
| T2  | [Layout]             | 新建 `(tabs)/_layout.tsx` — Tabs × 4 配置(无图标 / `unmountOnBlur=false` / `headerShown=false`,per FR-001 / FR-012 / CL-003) | `apps/native/app/(app)/(tabs)/_layout.tsx` + test                       | ✅      |
| T3  | [Placeholder]        | 3 个 placeholder pages — `(tabs)/index.tsx` / `(tabs)/search.tsx` / `(tabs)/pkm.tsx`(per FR-003)                             | `apps/native/app/(app)/(tabs)/{index,search,pkm}.tsx`                   | pending |
| T4  | [Migration]          | 删 `(app)/index.tsx` + 全仓 grep 引用更新(per 决策 5 / SC-009)                                                               | `apps/native/app/(app)/index.tsx`(删) + grep 命中点                     | pending |
| T5  | [Profile][Skeleton]  | profile screen 骨架 + 顶 nav + Hero 区(per FR-004 / FR-005 / FR-006 / FR-007 + 决策 2 / 7)                                   | `apps/native/app/(app)/(tabs)/profile.tsx` + test                       | pending |
| T6  | [Profile][SlideTabs] | 三 slide tabs 状态机 + tap 切换 + 内容占位 + a11y(per FR-008 / FR-009 / FR-014 / SC-003)                                     | `(tabs)/profile.tsx`(扩展)+ test                                        | pending |
| T7  | [Profile][Sticky]    | ScrollView `stickyHeaderIndices` 集成(per FR-018 / CL-001 (b))                                                               | `(tabs)/profile.tsx`(扩展)                                              | pending |
| T8  | [Integration]        | 集成测 + cross-tab activeTab 保持 + logout 后 (tabs) umount(per CL-003 / SC-007 / SC-010)                                    | `__tests__/integration/my-profile-flow.test.tsx`                        | pending |
| T9  | [Smoke]              | Playwright 真后端冒烟 — 已 onboarded 用户 → (tabs)/profile → 切 slide tabs → 点 ⚙️(dev warning 接受)                         | `apps/native/runtime-debug/2026-05-XX-my-profile-business-flow/` + 截图 | pending |

### Mockup PHASE 2 阶段(再下 session PR — UI 完成)

> 占位空表;由 mockup-prompt 阶段填充。参考 onboarding tasks.md T_mock / T8-T11 的 5 任务模式(mockup-prompt → bundle / handoff → packages/ui 评估 → 改写 page → plan.md 回填 → 视觉冒烟)。

| #      | 层级           | 任务                                                                                                                   | 文件                                                               | 状态    |
| ------ | -------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| T_mock | [Mockup]       | Claude Design 出 my-profile 页 mockup(顶 nav + Hero + slide tabs + 底 tab visualization)+ bundle + handoff.md          | `design/source/` + `design/mockup-prompt.md` + `design/handoff.md` | pending |
| T10    | [packages/ui]  | 评估新组件归属(`<TopNav>` / `<SlideTabsRow>` / `<ProfileHero>` 是抽 packages/ui 还是 inline,per FR-011)                | `design/handoff.md` § 复用清单                                     | pending |
| T11    | [App]          | 改写 `(tabs)/profile.tsx` — 删 PHASE 1 PLACEHOLDER banner + 接入新组件 + token-based className + photo blur 沉浸式背景 | `(tabs)/profile.tsx`                                               | pending |
| T12    | [Plan]         | plan.md UI 段从 4 边界占位回填为完整 UI 结构                                                                           | `apps/native/spec/my-profile/plan.md` § UI 结构                    | pending |
| T13    | [Visual smoke] | 4 状态截图(default / 滚动到 sticky / 切到 graph tab / 切到 kb tab + 顶 nav 各 disabled 反馈)                           | `runtime-debug/2026-05-XX-my-profile-mockup-translation/`          | pending |
| T14    | [视觉回归]     | 视情况引入 visual regression(M2 后)                                                                                    | TBD                                                                | 🟡 评估 |

---

## T1 — AuthGate 第三态目标改

**TDD**:先改测试 case,再改实现。

### T1-test:更新 `apps/native/lib/auth/auth-gate-decision.test.ts`(若已有则改,否则新建)

| 测试 case                      | 输入(`{isAuthenticated, displayName}`) | Expect 返回值                                     |
| ------------------------------ | -------------------------------------- | ------------------------------------------------- |
| 未登录                         | `{false, null}`                        | `'/(auth)/login'`                                 |
| 未登录 + 老 displayName(stale) | `{false, '小明'}`                      | `'/(auth)/login'`                                 |
| 已登录 + displayName=null      | `{true, null}`                         | `'/(app)/onboarding'`                             |
| 已登录 + displayName="小明"    | `{true, '小明'}`                       | `'/(app)/(tabs)/profile'` ★ 改:原 `'/(app)/'`     |
| 已登录 + displayName=""        | `{true, ''}`                           | `'/(app)/onboarding'`(空字符串视为 null,既有逻辑) |

**Verify**:`pnpm --filter native test` — 第 4 case 应 RED(实现还返 `'/(app)/'`)。

### T1-impl:`apps/native/lib/auth/auth-gate-decision.ts`

```ts
// 仅改第三态返回值字符串
- return '/(app)/'
+ return '/(app)/(tabs)/profile'
```

**Verify**:`pnpm --filter native test` 全 GREEN;`pnpm typecheck` 全 GREEN。

**Commit message**:`feat(account): authgate decision target → (tabs)/profile (M1.X / spec my-profile T1)`。

---

## T2 — `(tabs)/_layout.tsx` Tabs × 4 配置

**TDD**:先 layout test 红,再实现。

### T2-test:新建 `apps/native/app/(app)/(tabs)/__tests__/_layout.test.tsx`

| 测试 case             | Expect                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| 4 Screen 注册         | render layout → 找到 4 个 `<Tabs.Screen>`(name: index/search/pkm/profile) |
| 中文 label            | 4 Screen 各自 `tabBarLabel` 中文 ("首页"/"搜索"/"外脑"/"我的")            |
| 无图标                | 4 Screen 都 `tabBarIcon === undefined`(or unset)                          |
| `unmountOnBlur=false` | 4 Screen 都 `unmountOnBlur === false` 或 unset(默认值)                    |
| `headerShown=false`   | 4 Screen 都 `headerShown === false`                                       |

**Verify**:`pnpm --filter native test` RED(\_layout.tsx 不存在)。

### T2-impl:`apps/native/app/(app)/(tabs)/_layout.tsx`

```tsx
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
    <Tabs screenOptions={{ headerShown: false, tabBarIcon: undefined }}>
      <Tabs.Screen name="index" options={{ tabBarLabel: BOTTOM_TAB_LABELS.home }} />
      <Tabs.Screen name="search" options={{ tabBarLabel: BOTTOM_TAB_LABELS.search }} />
      <Tabs.Screen name="pkm" options={{ tabBarLabel: BOTTOM_TAB_LABELS.pkm }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: BOTTOM_TAB_LABELS.profile }} />
    </Tabs>
  );
}
```

**Verify**:`pnpm --filter native test` GREEN;Expo Router file-based routing 自动识别 `(tabs)/_layout.tsx` 为 Tabs container。

**Commit message**:`feat(account): add (tabs) group with 4-tab layout (M1.X / spec my-profile T2)`。

---

## T3 — 3 个 placeholder pages

**非 TDD**(纯展示,per CLAUDE.md § 五 — 纯展示 UI 不强制 TDD)。

### T3-impl:3 个文件

`apps/native/app/(app)/(tabs)/index.tsx`(首页 placeholder)

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeTab() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>首页内容即将推出</Text>
      </View>
    </SafeAreaView>
  );
}
```

`(tabs)/search.tsx` / `(tabs)/pkm.tsx` 同样模板,文案分别 "搜索内容即将推出" / "外脑内容即将推出"。

### T3-test(可选 snapshot):

```tsx
// apps/native/app/(app)/(tabs)/__tests__/index.test.tsx 等
it('renders placeholder text', () => {
  const { getByText } = render(<HomeTab />);
  expect(getByText('首页内容即将推出')).toBeTruthy();
});
```

**Verify**:`pnpm --filter native test` GREEN;运行 dev server 切 4 tab 各自渲染。

**Commit message**:`feat(account): add 3 placeholder tabs (home/search/pkm) (M1.X / spec my-profile T3)`。

---

## T4 — 删 `(app)/index.tsx` + 全仓 grep 引用更新

### T4-grep:全仓搜索旧路径引用

```bash
# 在 apps/native/ 根
rg "['\"]/?\(app\)/['\"]"          # match '/(app)/' / "/(app)/"
rg "router\.replace.*\(app\)"       # match router.replace('/(app)/...')
rg "router\.push.*\(app\)"          # match router.push('/(app)/...')
rg "<Redirect.*\(app\)/"            # match <Redirect href='/(app)/...'>
```

**预期命中点**(per onboarding 既有):

- `apps/native/lib/auth/auth-gate-decision.ts`(T1 已改)
- 测试文件(T1-test 已改)
- `(app)/_layout.tsx`(确认无 `<Redirect href="/(app)/" />` 类硬编)

### T4-impl:

1. 删 `apps/native/app/(app)/index.tsx`(内容已迁 `(tabs)/index.tsx`)
2. 更新 grep 命中点:`'/(app)/'` → `'/(app)/(tabs)/profile'`(若是 AuthGate 路径)或 `'/(app)/(tabs)/'`(默认 tab,若是无具体目标)

### T4-verify:

```bash
rg "['\"]/?\(app\)/['\"]"   # 应无命中(全部已 update)
pnpm --filter native test    # 全绿
pnpm typecheck                # 全绿
```

**Commit message**:`refactor(account): migrate (app)/index to (tabs)/index, drop legacy home (M1.X / spec my-profile T4)`。

---

## T5 — Profile screen 骨架 + 顶 nav + Hero 区

**TDD**:先测顶 nav 三 entry + Hero displayName 渲染,再实现。

### T5-test:`apps/native/app/(app)/(tabs)/__tests__/profile.test.tsx`

| 测试 case                      | Expect                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Hero 渲染 displayName          | mock store displayName="小明" → render → `getByText('小明')`                         |
| Hero displayName=null fallback | mock store displayName=null → render → `getByText('未命名')`(per Edge Cases)         |
| Hero 关注 / 粉丝               | render → `getByText('5 关注')` + `getByText('12 粉丝')`(FR-007)                      |
| 顶 nav ⚙️ click                | mock router → fireEvent press '设置' → `router.push` called with `'/(app)/settings'` |
| 顶 nav ≡ click                 | fireEvent press '菜单' → 无 router 调用 + a11y disabled                              |
| 顶 nav 🔍 click                | fireEvent press '搜索' → 无 router 调用 + a11y disabled                              |
| 头像 / 背景 click              | fireEvent press → 无 router / 无文件选择器调用(noop placeholder per FR-006)          |
| 反枚举                         | render → `queryByText(/^\d+$/)` 不命中(无 account.id 数字泄露,SC-006)                |

**Verify**:RED(profile.tsx 不存在)。

### T5-impl:`apps/native/app/(app)/(tabs)/profile.tsx`

```tsx
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
  tabPlaceholder: '内容即将推出',
};

type TabKey = 'notes' | 'graph' | 'kb';

export default function ProfileScreen() {
  const router = useRouter();
  const displayName = useAuthStore((s) => s.displayName);
  const [activeTab, setActiveTab] = useState<TabKey>('notes');

  const noop = () => {
    /* placeholder per FR-005 / FR-006 */
  };
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
            {COPY.tabPlaceholder}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Verify**:T5-test 全 GREEN;`pnpm --filter native test` 通过;dev server 切 (tabs)/profile 渲染。

**Commit message**:`feat(account): profile screen skeleton (top nav + hero + slide tabs scaffold) (M1.X / spec my-profile T5)`。

---

## T6 — SlideTabs 状态机 + a11y(扩展 T5)

**TDD**:扩展 T5-test。

### T6-test 追加 case:

| 测试 case                      | Expect                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| activeTab 切换 (notes → graph) | render → press '图谱' → tab content 显示 "图谱内容即将推出"                                   |
| activeTab 切换 (graph → kb)    | press '知识库' → 显示 "知识库内容即将推出"                                                    |
| activeTab 切换 (kb → notes)    | press '笔记' → 显示 "笔记内容即将推出"                                                        |
| a11y selected 同步             | press '图谱' → '图谱' tab `accessibilityState.selected=true`;'笔记' / '知识库' selected=false |
| 重复 press 同 tab              | press '笔记' 两次 → activeTab 仍 'notes',无副作用                                             |

### T6-impl:

T5 实现已包含完整 activeTab + a11y 切换。本 task 主要是 test 追加 + 验证。

**Verify**:全 GREEN。

**Commit message**:`test(account): slide tabs state machine + a11y (M1.X / spec my-profile T6)`。

---

## T7 — Sticky 滚动行为(扩展 T5)

**非 TDD 单测**(stickyHeaderIndices 行为依赖 RN runtime,单测难直接断言;通过 Playwright 冒烟测覆盖)。

### T7-impl:

T5 实现已包含 `stickyHeaderIndices={[2]}`(SlideTabsRow 索引)。本 task 主要验证滚动行为正确,可能需调 ScrollView 内层 children 顺序 / margin。

### T7-verify:

dev server 跑起,manual 滚动验证:

- hero 滚出视口
- SlideTabsRow 触顶钉住(钉在顶 nav 下方)
- 内容区延续滚动

**Commit message**:`feat(account): sticky tabs scroll behavior (M1.X / spec my-profile T7)`。

---

## T8 — 集成测(cross-tab activeTab 保持 + logout umount)

### T8-test:`apps/native/app/__tests__/integration/my-profile-flow.test.tsx`

| 测试 case                        | Expect                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Cold-start landing(已 onboarded) | rehydrate 完成 + displayName="小明" → render → URL 在 `(tabs)/profile`,无 router.replace(SC-007)                                     |
| Cross-tab activeTab 保持         | render profile → 切 activeTab 到 graph → 模拟点底 tab "首页" → 再点底 tab "我的" → activeTab 仍 graph(CL-003 / SC-003)               |
| Logout 后 (tabs) umount          | render in (tabs)/profile → call `logoutLocal()` → AuthGate 跳 login → assert (tabs) tree umount + `useEffect` cleanup 已执行(SC-010) |
| Logout 后 displayName 清空       | call `logoutLocal()` → assert `useAuthStore.getState().displayName === null`(沿用 onboarding SC-006)                                 |

**Verify**:`pnpm --filter native test` 全 GREEN;集成测覆盖 CL-003 / SC-007 / SC-010 关键不变性。

### T8-grep:静态分析(同 task 内执行,覆盖 SC-004 / SC-006 / SC-008)

```bash
# SC-004:占位 UI 0 视觉决策
rg -n "#[0-9a-fA-F]{3,8}\\b|rgb\\s*\\(|[0-9]+px\\b" apps/native/app/\(app\)/\(tabs\)/profile.tsx apps/native/app/\(app\)/\(tabs\)/_layout.tsx apps/native/app/\(app\)/\(tabs\)/index.tsx apps/native/app/\(app\)/\(tabs\)/search.tsx apps/native/app/\(app\)/\(tabs\)/pkm.tsx
# 期望:0 命中(允许 0 / 1 / 2 等基础数值,不允许 hex/rgb/px 字面量)

# SC-006:反枚举不变性
rg -n "accountId" apps/native/app/\(app\)/\(tabs\)/profile.tsx
# 期望:仅作 store key 访问(`useAuthStore(s => s.accountId)` 类),不出现在 `<Text>{accountId}>` render

# SC-008:底 tab 无图标
rg -n "tabBarIcon" apps/native/app/\(app\)/\(tabs\)/_layout.tsx
# 期望:0 命中(或显式 undefined)

# FR-011:不引 packages/ui 新组件
rg -n "from '@nvy/ui'" apps/native/app/\(app\)/\(tabs\)/
# 期望:0 命中(占位 UI 阶段)
```

如有命中,task RED → 移除字面量(SC-004) / 移除 render(SC-006) / 删 tabBarIcon(SC-008) / 移除 import(FR-011)。

**Commit message**:`test(account): my-profile integration (cross-tab persist + logout umount) (M1.X / spec my-profile T8)`。

---

## T9 — Playwright 真后端冒烟

### T9-impl:`apps/native/runtime-debug/2026-05-XX-my-profile-business-flow/`

**双 bundle 验证**(per plan.md 风险段 — `stickyHeaderIndices` 在 RN Web vs native 行为差异):

- **Web bundle**(Playwright + chromium 优先):覆盖滚动 / sticky / cross-tab persist
- **Native bundle**(iOS / Android 模拟器,manual 跑):仅滚动 + sticky 关键路径手动检查;native runtime smoke 不强制每个 PR 跑(per CLAUDE.md 测试范围)

```text
runtime-debug/2026-05-XX-my-profile-business-flow/
├── README.md           # 跑法 + 双 bundle 验证清单 + dev warning(settings 路径不存在)说明
├── run.mjs              # Playwright 脚本(Web bundle)
├── 01-login-arrived.png
├── 02-cold-start-tabs-profile.png      # AuthGate 默认 landing
├── 03-active-tab-graph.png             # 切到图谱
├── 04-sticky-tabs-scrolled.png         # 滚到 sticky 状态(Web bundle:position:sticky CSS)
├── 05-bottom-tab-home.png              # 切底 tab 到首页(占位)
├── 06-back-to-profile-graph-persist.png # 切回我的 → activeTab 仍 graph
└── 07-native-sticky-manual.txt         # Native 模拟器 sticky 手动验证 notes(若有差异记录)
```

### T9-script(`run.mjs`)逻辑:

1. boot dev server(假定外部已启动)
2. boot Playwright + chromium
3. Login(phone-sms-auth happy path,沿用 onboarding 既有 mock)→ AuthGate 跳 (tabs)/profile
4. screenshot 02:cold-start landing
5. tap "图谱" → screenshot 03
6. scroll 到 sticky → screenshot 04
7. tap 底 tab "首页" → screenshot 05
8. tap 底 tab "我的" → screenshot 06(验证 activeTab 仍 graph)
9. tap ⚙️ → router.push '/(app)/settings'(目标缺失 dev warning,但 router.push call 已 fire — **接受** per 决策 4)

### T9-verify:

manual 检查 6 张截图 + console 无 critical error;dev warning(settings 路径不存在)记录在 README.md 中说明 "spec B 落地后此 warning 消失"。

**Commit message**:`test(account): my-profile real backend smoke (M1.X / spec my-profile T9)`。

---

## 总览

| Phase             | task 数 | 估时   | 输出                                                   |
| ----------------- | ------- | ------ | ------------------------------------------------------ |
| 本 PR(docs-only)  | 4       | 已完成 | spec.md / plan.md / tasks.md / inspiration/            |
| Impl PR           | 9       | 8-12h  | 业务流 + 占位 UI + 集成测 + Playwright 冒烟            |
| Mockup PHASE 2 PR | 5+      | TBD    | mockup-prompt + bundle + 改写 page + plan.md UI 段回填 |

---

## 变更记录

- **2026-05-07**:本 tasks 首次创建。基于 spec.md(round 1 clarify 已完成)+ plan.md(7 关键决策)拆 9 个 impl tasks(T1-T9)+ 4 个 docs tasks(T_doc1-4)+ 5 个 mockup tasks(T_mock / T10-T14)占位空表。每 task 30min-2h,TDD 节奏(测试绑定到实现)。
- **2026-05-07 +1**:`/speckit.analyze` round 1 — 修复 5 项一致性发现:FR-017 wording 同步 plan 决策 2(无图片资源,emoji + View);T9 加 Web + native 双 bundle 验证(per plan 风险);T5 代码示意 `inset:0` 改 `top/right/bottom/left:0`(跨端兼容);Edge Cases 补 Android hardware back in tabs;T8 加 grep 静态分析子段覆盖 SC-004 / SC-006 / SC-008 / FR-011。
