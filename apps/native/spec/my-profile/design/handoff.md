# My-Profile Mockup Handoff

> Bundle 来源：Claude Design (claude.ai/design)，2026-05-07 拿到
> Mockup prompt：[`mockup-prompt.md`](./mockup-prompt.md)（PR [#69](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/69) ship）
> 翻译期 PR：本 PR（feature/my-profile-mockup-translation）

## 1. Bundle 内容速览

| 文件                                                                   | 体积    | 作用                                                                                                                    |
| ---------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`source/ProfileScreen.tsx`](./source/ProfileScreen.tsx)               | 17.9 KB | 主组件，含 14 个 inline 子组件（7 SVG icons + Hero / Avatar / TopNav / SlideTabs / TabPlaceholder / BottomTabs / Hero） |
| [`source/ProfileScreenPreview.tsx`](./source/ProfileScreenPreview.tsx) | 5.2 KB  | 4 状态横排预览（default-notes / sticky-scrolled / graph-tab / kb-tab）                                                  |
| [`source/Profile-Preview.html`](./source/Profile-Preview.html)         | 43 KB   | HTML 原型，视觉对照用                                                                                                   |
| [`source/IOSFrame.tsx`](./source/IOSFrame.tsx)                         | 2 KB    | iOS 设备外框（设计期专用，不进 implementation）                                                                         |
| [`source/tailwind.config.js`](./source/tailwind.config.js)             | 2.5 KB  | Token 定义 — login v2 base **+ 3 新 alpha color + 1 新 boxShadow**（详见 § 4）                                          |
| [`source/assets/logo-mark.svg`](./source/assets/logo-mark.svg)         | —       | LogoMark SVG（bundle 通用资产，本页未直接用）                                                                           |
| [`source/preview/`](./source/preview/)                                 | —       | Claude Design sandbox shim（reanimated / rn / svg / tokens shim + jsx render entries），不进 implementation             |

**丢弃的 bundle 内容**（来自原 export，未落 source/）：

- `LoginScreen.tsx` / `LoginScreenPreview.tsx` / `Login Preview.html` / `preview/Login*.preview.jsx` — login v2 已 ship（PR [#51](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/51)）
- `OnboardingScreen.tsx` / `OnboardingScreenPreview.tsx` / `Onboarding Preview.html` / `preview/Onboarding*.preview.jsx` — onboarding PHASE 2 已 ship（PR [#66](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/66)）
- 顶层 `README.md` — Claude Design 通用 boilerplate，meta `docs/experience/claude-design-handoff.md` 已覆盖
- `uploads/` 截图 — prompt 输入参考，不是产物

## 2. 组件 breakdown（T10 决策）

mockup `ProfileScreen.tsx` 中 inline 了 **14 个子组件**。本页 0 个抽 packages/ui，全部 inline 或丢弃；4 个 SVG glyph 抽到 `(tabs)/_layout.tsx` 用于 `tabBarIcon` prop。

| Mockup 子组件                                         | 处理                               | 理由                                                                                                          |
| ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `IconMenu` / `IconSearch` / `IconGear`                | **inline 在 `profile.tsx`**        | top nav 单页 once-only；stroke 颜色与 hero blur scroll 状态耦合（white on blur / ink on surface）             |
| `IconHome` / `IconCompass` / `IconSpark` / `IconUser` | **inline 在 `(tabs)/_layout.tsx`** | 仅 Expo Router `tabBarIcon` prop 用；mockup 自渲染 `<BottomTabs>` 不进 implementation                         |
| `HeroBlurBackdrop`                                    | **inline 在 `profile.tsx`**        | SVG gradient 占位（FR-006 photo 未实装）；M2+ 接 photo upload 时整体换 `<ImageBackground blurRadius>`         |
| `AvatarPlaceholder`                                   | **inline 在 `profile.tsx`**        | 单页 once-only；spec 仅占位（FR-006 头像点击 noop），不抽                                                     |
| `TopNav`                                              | **inline 在 `profile.tsx`**        | `onBlur` prop 与 scroll 状态紧耦合，抽 packages/ui 接口窄                                                     |
| `SlideTabs`                                           | **inline 在 `profile.tsx`**        | 3 tab key 写死 + reanimated underline + 88px 槽位—只此页用                                                    |
| `TabPlaceholder`                                      | **inline 在 `profile.tsx`**        | 占位用，未来真内容（笔记/图谱/知识库）会大改                                                                  |
| `Hero`                                                | **inline 在 `profile.tsx`**        | 单页 once-only                                                                                                |
| **`BottomTabs`**                                      | **删除（不进 implementation）**    | Expo Router `(tabs)/_layout.tsx` 已接管底 tab bar（FR-001 / PHASE 1 落地）；mockup 仅供 4 SVG icon glyph 参考 |

**复用 packages/ui**：0 个。
**新加 packages/ui**：0 个（per FR-011 占位 UI 阶段不抽组件）。
**抽到 `(tabs)/_layout.tsx`**：4 个 SVG icon glyph（IconHome / IconCompass / IconSpark / IconUser）。

## 3. 状态机覆盖

mockup 4 状态 ↔ spec.md FR-008（SlideTabs 状态机）+ FR-018（sticky 行为）+ CL-001(b)：

| Mockup state      | Spec FR              | 视觉                                                                 |
| ----------------- | -------------------- | -------------------------------------------------------------------- |
| `default-notes`   | FR-008 initial=notes | Hero 显示 + 顶 nav 透明白图标，SlideTabs 未 sticky，underline 在首位 |
| `sticky-scrolled` | FR-018 + CL-001(b)   | Hero 已滚出视口，SlideTabs 钉在顶 nav 下，顶 nav 切白底深图标        |
| `graph-tab`       | FR-008 active=graph  | activeTab=graph，underline 滑到中位（240ms easeOutCubic 动画）       |
| `kb-tab`          | FR-008 active=kb     | activeTab=kb，underline 滑到末位                                     |

**4/4 完全 match**，无 spec drift。Production 状态由 `useState<TabKey>('notes')` + `onScroll` 阈值检测驱动，mockup 的 `state` prop 仅 preview 用。

## 4. Token 决策记录

| 维度                            | 状态                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| tailwind.config.js vs login v2  | **+3 color + 1 boxShadow**（diff 输出 9 行新增）                                                                                         |
| 新增 token（color，alpha 变体） | `hero-overlay` (rgba(15,18,28,0.36)) / `white-soft` (rgba(255,255,255,0.72)) / `white-strong` (rgba(255,255,255,0.92))                   |
| 新增 token（boxShadow）         | `hero-ring` (`0 4px 16px -4px rgba(0,0,0,0.18)`) — Avatar 圆形边缘软光                                                                   |
| 复用清单                        | brand / accent / ink / line / surface / ok / warn / err / spacing / radius / fontFamily / boxShadow.card / boxShadow.cta — 全套 login v2 |
| 无新 ramp                       | brand / accent / ink / line / surface / 等 ramp 0 改动；new 4 token 全为复用 ramp 上的 alpha 变体                                        |
| Hex / px 字面量（业务代码）     | 0（除 SVG `fill={color}` / `stroke={color}` — 这是 RN-SVG drawing primitives，与 className 体系互斥，豁免，per login v2 LogoMark 先例）  |
| Inline style 反模式             | mockup `className="w-[${TAB_W}px]"` × 2 → 翻译时 hardcode `w-[88px]` / `w-[24px]`（NativeWind v4 不支持 runtime template literal）       |

**落地动作（T11 内执行）**：

1. `packages/design-tokens/src/index.ts` 加 4 token：
   - `colors['hero-overlay']` / `colors['white-soft']` / `colors['white-strong']`
   - `boxShadow['hero-ring']`
2. `apps/native/tailwind.config.ts` 已 `theme.extend.colors = tokens.colors` / `theme.extend.boxShadow = tokens.boxShadow`，**自动生效无需改**。

## 5. 翻译期注意点

### 5.1 5 条通用 gotcha audit（per meta playbook § 5.1）

| #   | 检查项                                  | my-profile 落点                                                                                                                                                                          |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 非档 spacing / radius 静默 drop         | mockup 用 `gap-1` / `gap-md`(16) / `gap-1.5` / `gap-2` / `gap-3` / `pt-1.5` / `pt-2` / `pb-3` / `pb-8` / `mt-2` / `mt-3` / `py-2xl`(48) — 全在 NativeWind v4 default + tokens scale ✓    |
| 2   | reanimated 包安装                       | `apps/native/package.json` 已含 `react-native-reanimated@~4.1.1`；mockup 用 v3 API（`useSharedValue` / `useAnimatedStyle` / `withTiming` / `Easing`）— v4 向后兼容 ✓                     |
| 3   | 不规范 inline style                     | `className="w-[${TAB_W}px]"` × 2 处（SlideTabs Pressable line 245 + indicator line 254）→ 翻译时 hardcode `w-[88px]` / `w-[24px]`；reanimated `style={indicatorStyle}` 复合 props 合法 ✓ |
| 4   | className token 是否在 design-tokens 内 | 3 新 color + 1 新 boxShadow 必须先加 packages/design-tokens（详见 § 4 落地动作）才能用                                                                                                   |
| 5   | flex-row gap-N 在 spacing scale 内      | `gap-1` / `gap-1.5` / `gap-2` / `gap-3` / `gap-md` 全在 NativeWind v4 default + tokens ✓                                                                                                 |

### 5.2 my-profile 特定 gotcha

| #   | 检查项                          | 详情                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 删 mockup `<BottomTabs>` 自渲染 | mockup line 281-305 自渲染底 tab bar 与 Expo Router `<Tabs>` paradigm 冲突。**翻译版删 `<BottomTabs>` 整段**——`(tabs)/_layout.tsx` 已接管；4 个 IconHome/Compass/Spark/User SVG glyph 抽到 `_layout.tsx` 作为 `<Tabs.Screen options={{ tabBarIcon: ({ color, focused }) => <IconX .../> }}>`                            |
| 2   | TopNav `onBlur` 切换驱动        | mockup `<TopNav onBlur={!isSticky}>` 由 `state` prop 决定。生产用 `<ScrollView onScroll={...} scrollEventThrottle={16}>` 监听 `nativeEvent.contentOffset.y > heroHeight - safeArea` 阈值切 useState bool，或 reanimated `useSharedValue` + `useAnimatedReaction` 驱动 className 切换                                    |
| 3   | Hero photo blur 占位            | mockup 用 SVG gradient stand-in (`HeroBlurBackdrop` line 146-168)；生产**保留 SVG 占位**（per FR-006 头像/背景图未实装），不引入 `expo-blur` 依赖；photo upload 接入时（M2+）再换 `<ImageBackground source={...} blurRadius={20}>`                                                                                      |
| 4   | AvatarPlaceholder initial 提取  | mockup hardcode `initial="小"`；生产从 displayName 取 first grapheme（`[...displayName][0]`，Unicode-aware，emoji/中文 1 计），fallback `'?'`；displayName 为 null/empty 时 Avatar 改用 `👤` emoji（沿用 PHASE 1 风格）                                                                                                 |
| 5   | a11y 必须从 PHASE 1 完整继承    | mockup 主函数自管 `state`（demo 用），未含 `accessibilityLabel/Role/State/Hint`。**翻译版必须保留 PHASE 1 a11y 全套**（per spec FR-014 + T5-test 8 case）：`menu/search` `disabled` 反馈 + `gear` 可点 push `/(app)/settings` + 头像/背景 `imagebutton` + a11yHint "点击更换" + SlideTabs `role=tab` + `selected` state |
| 6   | 测试 surface 兼容性             | PHASE 1 测试（`profile.test.tsx` 8 case + `__tests__/integration/my-profile-flow.test.tsx`）经 `accessibilityLabel/Role` 选择器 query。翻译版 className 重写 + JSX 嵌套基本不变，测试**不应失效**；如失效需调测试 selector（找新 wrapper）而非业务流                                                                    |
| 7   | className template literal      | mockup `w-[${TAB_W}px]` / `w-[${INDICATOR_W}px]` × 2 → hardcode `w-[88px]` / `w-[24px]`；TAB_W (88) / INDICATOR_W (24) 仍可作 const 用于 reanimated `offset.value` 计算（`idx * TAB_W + (TAB_W - INDICATOR_W) / 2`）                                                                                                    |
| 8   | mockup 主函数自管 `state` prop  | mockup `ProfileScreen({ state, ... })` 接 prop（line 350-364）是 preview demo 用，**不要复制**。翻译版只用 `useState<TabKey>('notes')` + scroll 监听，无 `state` prop                                                                                                                                                   |

## 6. Drift 政策

| 情况                                                        | 处理                                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| mockup `<BottomTabs>` 与 Expo Router `<Tabs>` paradigm 冲突 | 以 Expo Router 为准（FR-001 PHASE 1 已落地），mockup 仅取 4 SVG icon glyph   |
| mockup 与 spec.md 状态机不符                                | 以 spec 为准（4/4 一致，无冲突）                                             |
| mockup `className="w-[${...}]"` runtime template literal    | 以 NativeWind v4 静态 scan 限制为准——hardcode 字面量                         |
| mockup `state` prop 自管 demo 模式                          | 以 PHASE 1 useState + scroll 监听为准                                        |
| mockup `initial="小"` hardcode                              | 以 displayName first grapheme 提取 + `👤` fallback 为准                      |
| mockup 引入新 token                                         | 0 ramp，4 alpha+shadow 变体 — packages/design-tokens 加 + 写来源（详见 § 4） |

## 7. 引用

- [`spec.md`](../spec.md) — FR-001 AuthGate / FR-006 占位 4 边界 / FR-008 状态机 / FR-011 packages/ui 抽取延后 / FR-014 a11y / FR-018 sticky / SC-004 反枚举 / SC-006 反 ID 暴露
- [`plan.md`](../plan.md) — UI 段本 PR 从占位回填完整版（T12）
- [`tasks.md`](../tasks.md) — T_mock / T10 / T11 / T12 / T13 本 PR 同步 ✅
- [`mockup-prompt.md`](./mockup-prompt.md) — Claude Design prompt（PR [#69](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/69) ship）
- [`inspiration/notes.md`](./inspiration/notes.md) — 4 张参考截图决策记录
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [meta `docs/experience/claude-design-handoff.md`](../../../../../docs/experience/claude-design-handoff.md) § 5 handoff 模板
- [onboarding handoff](../../onboarding/design/handoff.md) — 同模式 baseline
- [login v2 handoff](../../login/design/handoff.md) — token baseline
