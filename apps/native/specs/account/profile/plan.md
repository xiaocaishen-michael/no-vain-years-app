# Implementation Plan: My Profile Page (`(tabs)` 接入 + 我的页骨架)

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-07(per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程)
**Status**: Draft(pending impl;PHASE 2 mockup 后回填 UI 段)
**Phase**: SDD 拆分链 A/B/C 的 **A**(my-profile);后续 PR 衔接 spec B(`account-settings-shell`)/ spec C(`delete-account-cancel-deletion-ui`)

> **per ADR-0017 类 1 流程分阶段**:本 PR docs / 下 session impl 业务流 + 占位 UI / 再下 session mockup PHASE 2 → UI 完成。本 plan UI 段为占位版(4 边界条目);mockup 落地后回填完整 UI 段。

---

## 数据流

```text
冷启 / 登录完成 / onboarding 完成
   │
   ▼
AuthGate (apps/native/app/_layout.tsx) re-evaluates state
   │
   ├─ !isAuthenticated         → router.replace('/(auth)/login')
   ├─ displayName == null      → router.replace('/(app)/onboarding')
   └─ 已 onboarded             → router.replace('/(app)/(tabs)/profile')   ← 改:原 /(app)/
   │
   ▼
(app)/(tabs)/_layout.tsx                                                    ← 新建
   │   <Tabs> (Expo Router):
   │     ├─ Screen "index"   label="首页"   → (tabs)/index.tsx
   │     ├─ Screen "search"  label="搜索"   → (tabs)/search.tsx
   │     ├─ Screen "pkm"     label="外脑"   → (tabs)/pkm.tsx
   │     └─ Screen "profile" label="我的"   → (tabs)/profile.tsx           ← 主屏(默认 landing)
   │
   ▼
(tabs)/profile.tsx 主屏布局(单一 ScrollView + sticky tabs,per CL-001 (b))
   │
   ├─ ScrollView root(stickyHeaderIndices=[indexOfSlideTabs])
   │     │
   │     ├─ TopNav row(顶 nav 三 entry)
   │     │     ├─ <Pressable onPress={noop}>≡</Pressable>           disabled per FR-005
   │     │     ├─ <View flex={1} />                                  spacer(中间空)
   │     │     ├─ <Pressable onPress={noop}>🔍</Pressable>           disabled per FR-005
   │     │     └─ <Pressable onPress={pushSettings}>⚙️</Pressable>   per FR-005
   │     │
   │     ├─ Hero region (滚动时随整页消失)
   │     │     ├─ <Pressable onPress={onAvatarPress}> 头像占位 </Pressable>   per FR-006(noop)
   │     │     ├─ <Pressable onPress={onBackgroundPress}> 背景占位 </Pressable>  per FR-006(noop)
   │     │     ├─ <Text>{store.displayName ?? '未命名'}</Text>
   │     │     └─ <Text>{COPY.followers}</Text> + <Text>{COPY.fans}</Text>     per FR-007(假数字)
   │     │
   │     ├─ SlideTabsRow ★ sticky 索引位置 ★
   │     │     ├─ <Pressable onPress={() => setActiveTab('notes')}>  笔记 </Pressable>
   │     │     ├─ <Pressable onPress={() => setActiveTab('graph')}>  图谱 </Pressable>
   │     │     └─ <Pressable onPress={() => setActiveTab('kb')}>     知识库 </Pressable>
   │     │
   │     └─ TabContent area
   │           switch (activeTab):
   │             notes → <Text>笔记内容即将推出</Text>
   │             graph → <Text>图谱内容即将推出</Text>
   │             kb    → <Text>知识库内容即将推出</Text>
   │
   ▼
ScrollView 滚动行为(per CL-001 + FR-018):
   - hero 滚出视口
   - SlideTabsRow 触顶时 sticky(钉在顶 nav 下方)
   - 内容区在 sticky tabs 下延续滚
   - 跨底 tab 切走再回 → activeTab 保持(per CL-003,Expo Router 默认不 unmount)
```

---

## 状态机

### Slide tabs activeTab(per FR-008)

```text
notes (default,冷启 reset)
  │ tap "图谱"
  ▼
graph
  │ tap "知识库"
  ▼
kb
```

- **tap 必含**(per FR-008);**swipe 可选**(per Open Question 1 决策 — 见下)
- **不 persist**(冷启回 notes);跨底 tab 切走再回**保持**(per CL-003)
- 实现:profile screen 内 `useState<'notes' | 'graph' | 'kb'>('notes')`,**不 lift 到 store**(无跨页面共享需求)

### AuthGate 三态(per spec.md FR-002 + CL-005)

```text
!isAuthenticated         → /(auth)/login
displayName == null      → /(app)/onboarding
else                     → /(app)/(tabs)/profile     ← 仅修改第三态目标
```

**关键不变性**:rehydrate 未完成时渲染 splash 不立即跳路由(沿用 onboarding spec FR-001)。

---

## 关键技术决策(plan.md 收口)

### 决策 1 — Sticky tabs + swipe 选型(Open Question 1)

**问题**:CL-001 (b) 锁定 sticky 滚动 paradigm,但具体 lib 选型未定。

| 候选                                                        | 实现                        | 评估                                                                     |
| ----------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| (a) 单 `<ScrollView>` + `stickyHeaderIndices` + 仅 tap 切换 | RN 原生 API,0 新依赖        | ✅ **采用**:占位 UI 边界 / 全裸 RN / 实现最简 / iOS/Android/Web 三端覆盖 |
| (b) `react-native-collapsible-tab-view`(第三方)             | 完整 sticky + swipe 一站式  | ❌ 占位 UI 阶段不引第三方 lib;PHASE 2 mockup 评估                        |
| (c) `<ScrollView>` + 内嵌 `react-native-pager-view`         | 自组合,处理嵌套 scroll 复杂 | ❌ prebuild + 嵌套 scroll 复杂度高                                       |

**决策**:采用 **(a)**;**swipe 行为后置 PHASE 2 mockup**(spec.md FR-008 已声明 swipe 可选)。

**实现细节**:

- `<ScrollView stickyHeaderIndices={[2]}>`(假设 children 顺序: 0=TopNav / 1=Hero / 2=SlideTabsRow / 3=TabContent)
- TopNav 是否 sticky:**否**(随 hero 一同滚出视口,占位 UI 阶段简化;PHASE 2 mockup 决定是否 TopNav 也 sticky)
- RN Web 兼容:`stickyHeaderIndices` 在 react-native-web 0.19+ 支持(M1.X 已用)

### 决策 2 — 头像 / 背景图占位资源(Open Question 3)

**问题**:占位 UI 阶段是否引入 placeholder 图片资源。

**决策**:**不引图片资源**,用裸 `<View>` + `<Text>` 占位:

- 头像:`<View>` + `<Text>👤</Text>` 内填 emoji(系统字体,无图像资源依赖)
- 背景:单一 `<View>`(无图)
- 资源在 PHASE 2 mockup 落地时一并引入(由 mockup 决定具体 PNG / SVG)

理由:占位 UI 4 边界(per ADR-0017)严禁视觉决策;图片资源涉及尺寸 / 风格 / 主题,本批次不锁。

### 决策 3 — `(tabs)/_layout.tsx` 配置

**Tabs 顺序**(决定底 tab bar 视觉顺序):

```text
首页 (index) → 搜索 (search) → 外脑 (pkm) → 我的 (profile)
```

**关键 props**:

- `tabBarIcon: undefined`(per FR-012 — 占位 UI 阶段无图标)
- `tabBarLabel`:中文 label(per FR-001)
- `unmountOnBlur: false`(默认值,per CL-003 跨 tab 切换 activeTab 保持)
- `headerShown: false`(profile screen 自带 TopNav,不用 Expo Router default header)

**SafeArea 适配**(per FR-015):

- `(tabs)/_layout.tsx` 内通过 `useSafeAreaInsets()` 处理底 tab bar 高度
- profile screen 顶部用 `<SafeAreaView edges={['top']}>` 包裹(沿用 onboarding 模式)

### 决策 4 — Settings stack 路径(per CL-002 (b))

**路径**:settings 路由放在 `apps/native/app/(app)/settings/*`(即 `(tabs)/` **之外**),Expo Router 默认在 `(tabs)` 之外的 stack 自动隐藏底 tab bar。

**spec A 范围**:**仅声明** `router.push('/(app)/settings')`;**目标实现是 spec B 范围**。

**spec A impl 期对未实现 settings 路径的处理**:

- 单测层面:断言 `router.push` 调用参数(不实际渲染目标),**测试通过**
- Playwright 真冒烟期:点 ⚙️ → router.push 触发 → Expo Router 实际行为(dev mode warning / 404 page),**接受**
- 用户实际可用:**等 spec B 落地**(同 PR cycle 内,A 先 ship 后 B 紧跟)

理由:不预占位 `(app)/settings/index.tsx`(避免 spec A 污染 spec B surface);测试通过 router.push 调用断言保证业务流验证。

### 决策 5 — `/(app)/index.tsx` 迁移

**问题**:现有 `apps/native/app/(app)/index.tsx`(home 占位)与新建 `(tabs)/index.tsx`(首页 tab)冲突。

**决策**:**删除** `(app)/index.tsx` + 内容迁到 `(tabs)/index.tsx`(per FR-003 + SC-009)。

**风险**:外部 link 直跳 `/(app)/`(无具体 tab path)的用户进入路径 → Expo Router 默认 redirect 到 `(tabs)/index`(首页 tab)。但 AuthGate 第三态目标已改为 `(tabs)/profile`(per FR-002),所以 cold-start 用户实际进入 profile tab,不会触发 `(app)/` redirect。

**grep 守**:全仓 grep `/(app)/'` / `replace('/(app)/'` / `push('/(app)/'` 引用 → 全部更新为 `/(app)/(tabs)/profile`(或具体 tab)。

### 决策 6 — 路由文件变更清单

**新建**:

- `apps/native/app/(app)/(tabs)/_layout.tsx` — Tabs layout,4 个 Screen 配置
- `apps/native/app/(app)/(tabs)/index.tsx` — 首页 placeholder(`// PHASE 1 PLACEHOLDER` + `<Text>首页内容即将推出</Text>`)
- `apps/native/app/(app)/(tabs)/search.tsx` — 搜索 placeholder
- `apps/native/app/(app)/(tabs)/pkm.tsx` — 外脑 placeholder
- `apps/native/app/(app)/(tabs)/profile.tsx` — 我的页主屏(本 spec 主产出)

**改**:

- `apps/native/lib/auth/auth-gate-decision.ts` — 第三态目标 `'/(app)/'` → `'/(app)/(tabs)/profile'`
- `apps/native/app/(app)/_layout.tsx` — 确认 Stack 内 onboarding + (tabs) 共存(per spec.md IA);可能不需改(Expo Router file-based 自动路由)

**删**:

- `apps/native/app/(app)/index.tsx`(内容迁 (tabs)/index.tsx)

### 决策 7 — 文案集中(per FR-013)

profile screen / placeholder pages 顶部统一 const(便于未来 i18n 抽离):

```ts
const COPY = {
  topNavMenuLabel: '菜单', // a11y label,UI 不显示
  topNavSearchLabel: '搜索',
  topNavSettingsLabel: '设置',
  followers: '5 关注',
  fans: '12 粉丝',
  tabs: { notes: '笔记', graph: '图谱', kb: '知识库' },
  tabPlaceholder: '内容即将推出',
  unnamed: '未命名', // displayName=null fallback(per Edge Cases)
};
```

bottomTabs label 在 `(tabs)/_layout.tsx` 内独立 const:

```ts
const BOTTOM_TAB_LABELS = { home: '首页', search: '搜索', pkm: '外脑', profile: '我的' };
```

---

## 复用既有代码

| 来源                                                                   | 用法                                      | 状态              |
| ---------------------------------------------------------------------- | ----------------------------------------- | ----------------- |
| `@nvy/auth.useAuthStore`                                               | profile screen 读 displayName(per FR-006) | 🟢 不变           |
| AuthGate(`apps/native/app/_layout.tsx`,既有 + onboarding 扩)           | 第三态目标更新(per FR-002)                | 🟡 改 1 字符串    |
| `apps/native/lib/auth/auth-gate-decision.ts`                           | 决策函数                                  | 🟡 改第三态返回值 |
| `expo-router.useRouter()` + `<Tabs>` + `<Stack>`                       | `(tabs)` group + nav                      | 🟢 不变           |
| `react-native-safe-area-context`                                       | SafeAreaView / useSafeAreaInsets          | 🟢 不变           |
| `@nvy/api-client.getAccountProfileApi().getMe()`(既有,onboarding 已用) | 不直接调,displayName 已 in store          | 🟢 不变           |

**新增依赖**:**无**(per 决策 1 (a) — 不引第三方 swipe / sticky lib)。

---

## RN Web 兼容点(per `.claude/nativewind-mapping.md` 既有 gotcha)

PHASE 1 占位 UI 阶段使用裸 RN component,gotcha 影响最小化:

| 维度                                 | 约束                                                                                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stickyHeaderIndices`                | react-native-web 0.19+ 支持(M1.X 已用);若 Web bundle 行为差异(已知 web 上 sticky 实现是 `position: sticky` CSS,native 上是 native 实现),冒烟测验证 Web bundle 渲染                      |
| Pressable 触摸反馈                   | RN Web 上 Pressable 默认 cursor:pointer 会自动加;native 端用 `pressed` state 改 opacity(占位 UI 阶段:`{({pressed}) => <View style={[styles.base, pressed && styles.pressed]} />}` 模式) |
| Tabs.Screen `unmountOnBlur=false`    | iOS / Android / Web 行为一致(默认值)                                                                                                                                                    |
| router.replace 在 hydration 前       | AuthGate 已守 `navigationRef.isReady()`(既有);rehydrate 中渲染 splash(沿用 onboarding 模式)                                                                                             |
| ScrollView nested 在 SafeAreaView 内 | Web bundle 上 Safe Area 用 CSS env(safe-area-inset-\*),native 端走 react-native-safe-area-context;统一用 `useSafeAreaInsets()`                                                          |

mockup PHASE 2 落地后引入 className / token 时再回填 NativeWind 兼容点(hover / borderRadius / boxShadow 等)。

---

## UI 结构（PHASE 2 mockup 落地，per ADR-0017 类 1 流程）

**Mockup 来源**：[`design/mockup-prompt.md`](./design/mockup-prompt.md) → Claude Design 产出 [`design/source/`](./design/source/) → [`design/handoff.md`](./design/handoff.md) 翻译期决策。

**视觉前提**：tailwind.config.js +3 alpha color (`hero-overlay` / `white-soft` / `white-strong`) + 1 boxShadow (`hero-ring`)；ramp 0 改动；0 抽 packages/ui，14 子组件全 inline 或丢弃。

### 区域分块（自上而下）

| 区域                                                          | 实现                                                                                                                                                          | 关键 className                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TopNav（absolute over hero / surface 后 sticky）              | `<View className="absolute top-0 left-0 right-0">` 内 `<TopNav onBlur={!isSticky} onSettingsPress={...} />`                                                   | `flex-row items-center justify-between h-12 px-md` + 条件 `bg-transparent` ↔ `bg-surface border-b border-line-soft`  |
| Hero（沉浸式 photo blur + scrim + Avatar + 名字 + 关注/粉丝） | `<View className="h-[280px] relative overflow-hidden">` 含 `<HeroBlurBackdrop />` (SVG gradient stand-in) + scrim + `<AvatarPlaceholder />` + name + stats 行 | `h-[280px] relative overflow-hidden` / `bg-hero-overlay` / `text-[22px] font-bold text-white-strong tracking-tight`  |
| SlideTabs（sticky `stickyHeaderIndices=[1]`）                 | `<View className="bg-surface border-b border-line-soft">` 含 3 Pressable + `<Animated.View>` underline                                                        | `bg-surface border-b border-line-soft` / `w-[88px] items-center pb-3` / `h-[3px] w-[24px] rounded-full bg-brand-500` |
| TabContent（占位）                                            | `<View className="bg-surface min-h-[260px]">` 内 `<TabPlaceholder tab={activeTab} />`                                                                         | `bg-surface min-h-[260px]` / `py-2xl gap-3` / `text-sm text-ink-muted`                                               |
| 底 tab bar（由 Expo Router `(tabs)/_layout.tsx` 接管）        | `<Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: brand[500], tabBarInactiveTintColor: ink.subtle }}>` × 4 Screen 各带 SVG `tabBarIcon`      | screenOptions tint colors 来自 `@nvy/design-tokens`                                                                  |

整页容器 `<SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: tokens.colors.surface.DEFAULT }}>` 包于内层 `<ScrollView stickyHeaderIndices={[1]} scrollEventThrottle={16} onScroll={...}>`。TopNav 用 absolute layer 浮于 ScrollView 之上（避免 sticky 切换时的渲染冲突）。

### 状态视觉转移（4 状态 ↔ scrollY × activeTab）

| 状态              | scrollY 区间               | activeTab | TopNav                                                                         | SlideTabs underline                          |
| ----------------- | -------------------------- | --------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| `default-notes`   | `< STICKY_THRESHOLD` (224) | `notes`   | `bg-transparent` + 白图标（`tokens.colors.surface.DEFAULT`）                   | translateX(32) — 首位                        |
| `sticky-scrolled` | `≥ STICKY_THRESHOLD`       | `notes`   | `bg-surface border-b border-line-soft` + 深图标（`tokens.colors.ink.DEFAULT`） | translateX(32) — 首位                        |
| `graph-tab`       | 任意                       | `graph`   | 同 scroll 状态                                                                 | translateX(120) — 中位（240ms easeOutCubic） |
| `kb-tab`          | 任意                       | `kb`      | 同 scroll 状态                                                                 | translateX(208) — 末位                       |

> `STICKY_THRESHOLD = HERO_HEIGHT - 56 = 224px`（hero 几乎滚出视口、留 nav 高度 buffer 时切换 onBlur）。指示条 `offset = idx × TAB_W (88) + (TAB_W - INDICATOR_W (24)) / 2 = idx × 88 + 32`。

### Token 映射（实际使用清单）

| 维度       | className                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface    | `bg-surface` / `bg-surface-sunken` / `bg-white`（Avatar ring）/ `bg-transparent`（TopNav on blur）                                                                                                                           |
| Brand      | `bg-brand-500`（Avatar bg + underline）                                                                                                                                                                                      |
| Hero alpha | `bg-hero-overlay` / `text-white-strong` / `text-white-soft` / `bg-white-soft`（分隔线）                                                                                                                                      |
| Padding    | `px-md`(16) / `pb-3` / `pb-8` / `pt-2` / `p-[3px]`（Avatar ring）/ `py-2xl`(48) / `gap-md`(16) / `gap-1` / `gap-3`                                                                                                           |
| Margin     | `mt-2` / `mt-3`                                                                                                                                                                                                              |
| Size       | `h-12`（TopNav）/ `h-[280px]`（Hero）/ `w-[72px] h-[72px]`（Avatar）/ `w-10 h-10`（icon hit area）/ `w-[88px]`（tab slot）/ `w-[24px] h-[3px]`（underline）/ `w-14 h-14` / `w-6 h-6` / `w-px h-3`（分隔线）/ `min-h-[260px]` |
| Border     | `border-b` / `border-line-soft`                                                                                                                                                                                              |
| Font 字号  | `text-base` / `text-sm` / `text-xs` / `text-2xl`（Avatar initial）/ `text-[22px]`（displayName arbitrary）                                                                                                                   |
| Font 颜色  | `text-ink` / `text-ink-muted` / `text-white`（Avatar initial）/ `text-white-strong` / `text-white-soft`                                                                                                                      |
| Font 修饰  | `font-bold` / `font-semibold` / `font-medium` / `tracking-tight`                                                                                                                                                             |
| Layout     | `flex-1` / `flex-row` / `items-center` / `justify-center` / `justify-between` / `justify-end` / `self-center` / `absolute` / `inset-0` / `top-0 left-0 right-0` / `bottom-0 left-0` / `relative` / `overflow-hidden`         |
| Shadow     | `shadow-hero-ring`（Avatar ring soft光）                                                                                                                                                                                     |
| Radius     | `rounded-full`                                                                                                                                                                                                               |

**全清单已在 `packages/design-tokens`** — 4 新 token（`hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring`）已加入；ramp 0 改动。

### 复用 packages/ui 组件清单（per handoff.md § 2）

| 组件                                                  | 来源                            | 备注                                                                                |
| ----------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `IconMenu` / `IconSearch` / `IconGear`                | inline 在 `(tabs)/profile.tsx`  | top nav 单页 once-only；stroke color 与 hero blur scroll 状态耦合                   |
| `IconHome` / `IconCompass` / `IconSpark` / `IconUser` | inline 在 `(tabs)/_layout.tsx`  | Expo Router `tabBarIcon` prop 用                                                    |
| `HeroBlurBackdrop`                                    | inline 在 `(tabs)/profile.tsx`  | SVG gradient stand-in；M2+ photo upload 时整体替换为 `<ImageBackground blurRadius>` |
| `AvatarPlaceholder`                                   | inline 在 `(tabs)/profile.tsx`  | displayName first grapheme + `👤` fallback；点击 noop（FR-006）                     |
| `TopNav` / `SlideTabs` / `TabPlaceholder` / `Hero`    | inline 在 `(tabs)/profile.tsx`  | 单页 once-only                                                                      |
| ~~`BottomTabs`~~（mockup 内）                         | **删除（不进 implementation）** | Expo Router `(tabs)/_layout.tsx` 接管底 tab bar；mockup 仅供 4 SVG icon glyph 参考  |

**0 抽 packages/ui，0 复用既有 packages/ui**（per FR-011 占位 UI 阶段不抽组件，PHASE 2 也未抽——单页 once-only + 与 scroll 状态耦合不适合通用化）。

### Hex / px 字面量豁免范围（per handoff.md § 4）

- **SVG drawing primitives**（`<Stop stopColor="#3B5BD9" />` 等）：豁免 — RN-SVG 体系与 className 互斥，per login v2 LogoMark 先例
- **HeroBlurBackdrop 渐变 5 hex**：临时占位（FR-006 photo 未实装），M2+ 接 photo upload 整体替换
- 业务代码 className 0 hex / 0 px 字面量（除上述 SVG 内）

---

## a11y 落点(per FR-014)

| 元素                               | a11y props                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 顶 nav `<Pressable>≡</Pressable>`  | `accessibilityRole='button'` + `accessibilityLabel='菜单'` + `accessibilityState={{disabled: true}}`                   |
| 顶 nav `<Pressable>🔍</Pressable>` | `accessibilityRole='button'` + `accessibilityLabel='搜索'` + `accessibilityState={{disabled: true}}`                   |
| 顶 nav `<Pressable>⚙️</Pressable>` | `accessibilityRole='button'` + `accessibilityLabel='设置'`                                                             |
| Hero 头像 `<Pressable>`            | `accessibilityRole='imagebutton'` + `accessibilityLabel='头像'` + `accessibilityHint='点击更换'`                       |
| Hero 背景 `<Pressable>`            | `accessibilityRole='imagebutton'` + `accessibilityLabel='背景图'` + `accessibilityHint='点击更换'`                     |
| Slide tab `<Pressable>` × 3        | `accessibilityRole='tab'` + `accessibilityState={{selected: activeTab === <key>}}` + `accessibilityLabel={<key 文案>}` |
| 底 tab(由 Expo Router 自动)        | `tabBarAccessibilityLabel` per Tabs.Screen(中文 label 自带)                                                            |

---

## 测试策略

| 层                                | 工具                                           | 覆盖范围                                                                                                                                                                                                                                    | 阶段                    |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 单测(AuthGate)                    | vitest + @testing-library/react                | 三态决策 9 子 case(replace 既有 6 → 9,因第三态目标改 + 新增 deep link 拦截 case);rehydrate 不抖(per SC-007)                                                                                                                                 | PR-impl                 |
| 单测(`auth-gate-decision`)        | vitest                                         | 第三态返回值 = `'/(app)/(tabs)/profile'`;表驱动 case `[isAuthenticated, displayName] → expectedPath`                                                                                                                                        | PR-impl                 |
| 单测(`(tabs)/profile.tsx` 顶 nav) | vitest + @testing-library/react-native(rtl-rn) | ⚙️ click → `router.push` 调用断言;≡ / 🔍 click → 无 router 调用 + a11y disabled state(per US4 / US5)                                                                                                                                        | PR-impl                 |
| 单测(slide tabs 状态机)           | vitest + rtl-rn                                | tap 三 tab 切换 + active 视觉指示 + a11y `selected` 切换(per SC-003 / US3)                                                                                                                                                                  | PR-impl                 |
| 单测(hero 区)                     | vitest + rtl-rn                                | 渲染 displayName(从 mock store);头像 / 背景 onPress noop(无副作用);关注 / 粉丝固定文案                                                                                                                                                      | PR-impl                 |
| 单测(`(tabs)/_layout.tsx`)        | vitest                                         | 4 Screen 注册;label 中文;`tabBarIcon: undefined`                                                                                                                                                                                            | PR-impl                 |
| 集成测(整页)                      | vitest + rtl-rn                                | profile screen mount → render hero + slide tabs + 顶 nav + 底 tab(by Expo Router 自动);跨 tab 切换 activeTab 保持(per CL-003 / SC-003)                                                                                                      | PR-impl                 |
| 集成测(sticky 滚动)               | vitest + rtl-rn                                | fireEvent 'scroll' on ScrollView → SlideTabsRow 应保持视觉位置(具体断言方式 plan.md 决,`stickyHeaderIndices` 单测覆盖度有限,可能依赖 manual / Playwright)                                                                                   | PR-impl + Playwright    |
| E2E(真后端冒烟)                   | Playwright `runtime-debug.mjs`                 | 已 onboarded 用户 → AuthGate decision = (tabs)/profile → profile screen 渲染 → 切 slide tabs → 点 ⚙️ → router.push '/(app)/settings'(目标 spec B 未实现期间 dev warning 接受);截图归档 `runtime-debug/2026-05-XX-my-profile-business-flow/` | PR-impl 末尾            |
| 视觉回归(PHASE 2)                 | (工具 TBD)                                     | mockup vs 实际渲染像素对比                                                                                                                                                                                                                  | PR-impl-mockup(PHASE 2) |

### 关键测试 case 清单(完整覆盖 SC-001 ~ SC-010)

| SC     | 覆盖测试                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-001 | 全 8 User Story happy path 单测                                                                                                                                        |
| SC-002 | AuthGate 三态 9 case(`auth-gate-decision.test.ts` 表驱动)                                                                                                              |
| SC-003 | activeTab 三态切换 6 case(`profile.test.tsx` 表驱动:[notes/graph/kb] × [tap/swipe(若启用)])                                                                            |
| SC-004 | grep `(tabs)/profile.tsx` + `(tabs)/_layout.tsx` + 3 placeholder 文件,断言无 hex/px/rgb 字面量(`#`/`rgb`/`px` 字符串 grep);`@nvy/ui` import 仅限既有(Spinner 等)无新增 |
| SC-005 | Playwright 冒烟脚本 runtime-debug                                                                                                                                      |
| SC-006 | grep profile.tsx 内 `accountId` 仅作 store key 访问(不出现在 `<Text>{accountId}>`)                                                                                     |
| SC-007 | rehydrate 测 — store 已 hydrated 含 displayName → AuthGate 首次 render → router.replace 调用次数 = 0                                                                   |
| SC-008 | grep `tabBarIcon` 应为 undefined / 未设置                                                                                                                              |
| SC-009 | git diff 验证 `(app)/index.tsx` 删 + `(tabs)/index.tsx` 新增                                                                                                           |
| SC-010 | 集成测 logout 后 profile screen umount 干净 — `logoutLocal()` → store 清空 → AuthGate 跳 login → (tabs) tree umount(`useEffect` cleanup 验证)                          |

---

## Constitution / 边界 Check

- ✅ AuthGate 三态决策不破(仅改第三态目标字符串,per FR-002 / SC-002)
- ✅ 占位 UI 0 视觉决策(per ADR-0017 类 1 + FR-010 + SC-004)
- ✅ 不引 packages/ui 新抽组件(per FR-011)
- ✅ 不引第三方 swipe / sticky lib(per 决策 1 (a))
- ✅ 反枚举不变性:profile screen 不读 / 渲染 account.id 数字(per SC-006)
- ✅ 跨模块边界:本 spec 仅依赖 `@nvy/auth`(displayName 读)+ `expo-router`,**不**直接 import `@nvy/api-client`(loadProfile 由 onboarding 既有 wrapper 完成)
- ✅ logout 路径不影响 (tabs) 结构(per SC-010 — `logoutLocal/logoutAll` 触发 AuthGate 跳 login,(tabs) tree umount 干净)

---

## 反模式(明确避免)

- ❌ 在 `(tabs)/profile.tsx` 内 import `@nvy/ui` 抽组件(破坏 ADR-0017 占位 UI 4 边界)
- ❌ 占位 UI 阶段写视觉细节(精确间距 / 颜色 / 字号 / 阴影 / photo blur / 自定义动画) — 留 mockup PHASE 2
- ❌ 引入 `react-native-pager-view` / `react-native-collapsible-tab-view` 第三方 lib(per 决策 1)
- ❌ 顶 nav ≡ / 🔍 实际触发 navigation(disabled handler,per FR-005 / US5)
- ❌ 头像 / 背景占位用图片资源(用 `<View>` + `<Text>` 占位,per 决策 2)
- ❌ AuthGate 第三态硬编多个 tab(默认进 my profile,per CL-005)
- ❌ profile screen 内调 `useAuthStore.setSession` / `setDisplayName`(本 spec 仅读,不写)
- ❌ `(tabs)/profile.tsx` 内 `<Text>{accountId}</Text>`(反枚举不变性 SC-006)
- ❌ 在 `(app)/(tabs)/settings/*` 路由建 settings(应在 `(app)/settings/*`,per CL-002 / 决策 4)
- ❌ 预占位 `(app)/settings/index.tsx`(不污染 spec B surface,per 决策 4)
- ❌ slide tabs activeTab lift 到 store(本 spec 无跨页面共享需求,本地 useState 即可,per 决策 1)

---

## 风险 + 缓解

| 风险                                                  | 缓解                                                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(tabs)` group 引入对现有 onboarding flow 影响        | onboarding 仍在 `(app)/onboarding`(`(app)/_layout.tsx` Stack 内,与 `(tabs)` 平行);AuthGate 第二态目标不变(per 决策 6)                                                                                                           |
| `(app)/index.tsx` 删除遗漏外部引用                    | 全仓 grep `(app)/'` / `replace('/(app)/'` / `push('/(app)/'` 引用 → 同 PR 更新所有命中(per 决策 5)                                                                                                                              |
| `stickyHeaderIndices` 在 RN Web 上行为差异            | Playwright Web bundle 冒烟测覆盖;若 native vs web 行为不一致(已知 web 用 `position: sticky` CSS,native 是 native impl),**接受**视觉差异(占位 UI 阶段);PHASE 2 mockup 落地若需对齐,引入 `react-native-collapsible-tab-view` 评估 |
| swipe 不实现可能用户期望落空                          | spec.md US3 acceptance scenario 已标"若启用";冒烟测仅验 tap 切换;Open Question 1 留 PHASE 2 决                                                                                                                                  |
| 路由跳转目标 `/(app)/settings` 在 spec B 实现前不存在 | 单测层面 router.push 调用断言通过;Playwright 冒烟期 dev warning 接受;**spec A 落地后紧跟 spec B**(线性依赖,per spec.md SDD 拆分链);用户实际可用是 spec B 落地后                                                                 |
| AuthGate rehydrate 中误判跳路由                       | 沿用 onboarding spec FR-001 逻辑(rehydrate 未完成渲染 splash 不跳);SC-007 测试守                                                                                                                                                |
| 跨 tab 切换 activeTab 状态意外丢失                    | Expo Router Tabs 默认 `unmountOnBlur=false`;CL-003 / SC-003 测试守;若 Expo SDK 升级行为变化,SDK major 升级需走"dedicated session"(per memory)                                                                                   |
| 底 tab bar 视觉占位用户体验差(无图标 / 单 label)      | spec.md FR-012 已声明 PHASE 2 mockup 决定图标系统;PHASE 1 占位 UI 边界要求                                                                                                                                                      |
| Sticky tabs + 内容区滚动手势冲突                      | 单 ScrollView 实现自然无冲突(无嵌套 scroll);PHASE 2 若引入 collapsible-tab-view 需重新评估                                                                                                                                      |

---

## 与 spec B / spec C 的衔接边界

| 边界                  | 本 spec(A)                                   | spec B(account-settings-shell)                                                   | spec C(delete-account-cancel-deletion-ui) |
| --------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| ⚙️ 入口               | ✅ `router.push('/(app)/settings')` 调用声明 | ✅ 实现 `(app)/settings/_layout.tsx` + `(app)/settings/index.tsx`(设置 list)     | —                                         |
| 设置 → 账号与安全     | —                                            | ✅ 实现 list + push `/(app)/settings/account-security`                           | —                                         |
| 账号与安全 → 注销账号 | —                                            | ✅ 注销入口 `<Pressable>` push `/(app)/settings/account-security/delete-account` | ✅ 实现注销 UI(SMS + 6 位码 + 双确认)     |
| 解封 UI               | —                                            | —                                                                                | ✅ phone-sms-auth login flow 拦截弹窗     |
| 退出登录              | —                                            | ✅ 设置页底部 → `logoutAll()`(既有)+ 跳 login                                    | —                                         |

**spec A → B → C 是线性依赖**:每个 spec 落地一个独立 PR,顺序合并;本 spec 不预占位 spec B / C 的 surface(per 决策 4)。

---

## 变更记录

- **2026-05-07**:本 plan 首次创建。基于 spec.md round 1 clarify(CL-001 ~ CL-005)落 7 项关键技术决策(swipe + sticky 选型 / 占位资源 / 路由文件清单 / settings 路径 / `(app)/index.tsx` 迁移 / 文案集中 / 状态本地化)。UI 段标占位(per ADR-0017 类 1 流程),mockup 落地后回填。
- **2026-05-07 +1**:PHASE 2 mockup translation 落地(T_mock / T10 / T11 / T12)。UI 段从占位版重写为 PHASE 2 完整版(5 zone 分块 / 状态视觉转移 / token 映射 / 复用清单)。tailwind tokens 加 4 项(`hero-overlay` / `white-soft` / `white-strong` + boxShadow.`hero-ring`)。**SC-008 PHASE 1 → PHASE 2 supersede**:原 grep `tabBarIcon === undefined`(占位)改为断言 4 SVG glyph factory + brand-500/ink-subtle tint colors;`_layout.test.tsx` 同步。SC-004 hex/px 字面量豁免范围扩展为"SVG drawing primitives"(per handoff.md § 4 + login v2 LogoMark 先例)。组件归属 0 抽 packages/ui(14 子组件全 inline 或丢弃),BottomTabs 不进 implementation(Expo Router 接管)。
