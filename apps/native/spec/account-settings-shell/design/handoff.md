# Account-Settings-Shell Mockup Handoff

> Bundle 来源:Claude Design (claude.ai/design),2026-05-07 拿到
> Mockup prompt:[`mockup-prompt.md`](./mockup-prompt.md)(PR [#73](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/73) docs 段已 ship)
> 翻译期 PR:本 PR(feature/account-settings-shell-mockup-translation)
> SDD 链:A(my-profile,已 ship #68/#70/#71)→ **B(本 spec,PHASE 2 翻译期)** → C(delete-account,后置)

## 1. Bundle 内容速览

| 文件                                                                     | 体积      | 作用                                                                                                                     |
| ------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`source/SettingsScreen.tsx`](./source/SettingsScreen.tsx)               | 8.1 KB    | 主组件 — 设置主页 + **4 个 reusable primitive**(StackHeader / Card / Row / Divider,export 给邻居 page 复用)+ LogoutAlert |
| [`source/AccountSecurityScreen.tsx`](./source/AccountSecurityScreen.tsx) | 1.7 KB    | 账号与安全(import primitives from SettingsScreen)— 3 cards + 反枚举守则                                                  |
| [`source/PhoneScreen.tsx`](./source/PhoneScreen.tsx)                     | 1.0 KB    | 手机号 mask 详情 — 居中大字 mono + 副标题 `已绑定手机号`(此副标题 PHASE 2 不翻译,详 § 6 drift)                           |
| [`source/LegalScreen.tsx`](./source/LegalScreen.tsx)                     | 1.0 KB    | 法规共用模板(personal-info / third-party 同模板,kind prop 切标题)                                                        |
| [`source/SettingsShellPreview.tsx`](./source/SettingsShellPreview.tsx)   | 6.8 KB    | **4 状态横排预览**(settings / account-security / phone / legal — logout-alert 状态接受 RN 系统 Alert 降级,mockup 跳过)   |
| [`source/IOSFrame.tsx`](./source/IOSFrame.tsx)                           | 2.0 KB    | iPhone 设备外框(设计期专用,不进 implementation)                                                                          |
| [`source/Settings-Preview.html`](./source/Settings-Preview.html)         | 25.6 KB   | HTML 原型,视觉对照用                                                                                                     |
| [`source/tailwind.config.js`](./source/tailwind.config.js)               | 2.5 KB    | Token 定义 — **完全沿用** my-profile PHASE 2 base(login v2 base + my-profile 4 alpha + boxShadow.hero-ring),**0 新增**   |
| [`source/assets/logo-mark.svg`](./source/assets/logo-mark.svg)           | —         | LogoMark SVG(bundle 通用资产,本 5 page 未直接用)                                                                         |
| [`source/preview/`](./source/preview/)                                   | 5 个 shim | Claude Design sandbox shim(reanimated / rn / svg / tokens shim + IOSFrame.preview),不进 implementation                   |

**丢弃的 bundle 内容**(原 export 含,未落 source/):

- `LoginScreen.tsx` / `LoginScreenPreview.tsx` / `Login Preview.html` / `preview/Login*.preview.jsx` — login v2 已 ship(PR [#51](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/51))
- `OnboardingScreen.tsx` / `OnboardingScreenPreview.tsx` / `Onboarding Preview.html` / `preview/Onboarding*.preview.jsx` — onboarding PHASE 2 已 ship(PR [#66](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/66))
- `ProfileScreen.tsx` / `ProfileScreenPreview.tsx` / `Profile Preview.html` / `preview/Profile*.preview.jsx` — my-profile PHASE 2 已 ship(PR [#70](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/70))
- `README.md` — Claude Design 通用 boilerplate(meta `docs/experience/claude-design-handoff.md` 已覆盖)
- `uploads/截屏 2026-05-04 12.31.38.png` — prompt 输入参考截图,不是产物

> Bundle export 把同 conversation 的多 spec 输出捆在一起属 Claude Design 已知行为(my-profile handoff § 1 同款)。落 source/ 时按"只取本 spec 文件"过滤。

## 2. 组件 breakdown(T12 决策)

mockup 在 `SettingsScreen.tsx` 内 inline 了 **4 个 reusable primitive** + 2 个 leaf 组件,export 给 AccountSecurityScreen / PhoneScreen / LegalScreen 通过 relative import 复用。

| Mockup 组件        | 处理                                          | 理由                                                                                                                                                                                        |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StackHeader`      | **不翻译,改用 Expo Router default header**    | PHASE 1 已 ship `<Stack.Screen options={{ title: ... }}>`,iOS 风格自动返回箭头 + 居中标题已是 native 体验;mockup 自画 header 是 design-time 替身(IOSFrame 没 Stack);保留 0 维护成本默认行为 |
| `Card`             | **抽到 `app/(app)/settings/_primitives.tsx`** | 5 page 内 4 处复用(settings × 1 + account-security × 3,第 3 张是 1-row 退出登录占位的"实际"卡)— 集中管理胜过 mockup 的"反向从 SettingsScreen export";不进 packages/ui(理由 ↓)               |
| `Row`              | **抽到 `_primitives.tsx`**                    | 5 page 内 ~12 处复用;最复杂的 primitive(label / value / disabled / destructive / showChevron / align / onPress 7 props)— 集中维护                                                           |
| `Divider`          | **抽到 `_primitives.tsx`**                    | Card 内多 row 之间用,左 16px 缩进对齐 label                                                                                                                                                 |
| `IconChevronRight` | **inline 在 `_primitives.tsx`**               | 仅 Row 内部消费,与 Row 同生命周期                                                                                                                                                           |
| `IconBack`         | **删除(不进 implementation)**                 | 仅 mockup 自画 StackHeader 用;Expo Router default header 自带返回箭头                                                                                                                       |
| `LegalFooter`      | **inline 在 `settings/index.tsx`**            | 单页 once-only,不复用                                                                                                                                                                       |
| `LogoutAlert`      | **删除(不进 implementation)**                 | PHASE 1 已用 `Alert.alert()` 系统弹窗 ship + T5 测试覆盖;mockup custom modal 是 over-design,留 PHASE 2.5 future PR(详 § 6 drift)                                                            |

### packages/ui 抽取决策

**结论:不抽 packages/ui,落 `app/(app)/settings/_primitives.tsx` 即可。**

| 评估维度                             | 结论                                                                                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本 spec 内复用度                     | Card 4×(单层 5 page 范围内);Row 12×                                                                                                                                                                 |
| 跨 spec(future)预期复用              | **低** — 后续 pkm/billing/work 等模块的"列表 + 卡片"形态大概率有更多 variant(图标 / 缩略图 / multi-line / 描述行 / switch toggle 等),现版 Card/Row 抽象不够通用;**强行抽 packages/ui 反而限制扩展** |
| my-profile / onboarding / login 先例 | 全部 0 抽 packages/ui(per spec FR-013 + my-profile handoff § 2)                                                                                                                                     |
| 改造成本(本 PR vs 抽 packages/ui)    | 本 PR 抽 `_primitives.tsx`(单文件,单仓 import)≈ 30min;抽 packages/ui 需 export entry / pnpm link / TS path / NativeWind preset 共享配置 ≈ 2-4h,无业务收益                                           |
| Premature abstraction 风险           | 高 — Repository pattern 通过抽象限定使用方式,但 Card/Row 是视觉占位 primitive,过早抽象会让后续 variant 卡接口                                                                                       |

**触发抽 packages/ui 的条件**(future):第 2 个业务 module(如 mbw-pkm / mbw-billing)出现"分组列表卡片"且 ≥ 3 行复用度时,届时把 `_primitives.tsx` 升级到 `packages/ui` + 加 variant props。

## 3. 状态机覆盖

mockup `SettingsShellPreview.tsx` 4 状态 ↔ spec.md FR-001 ~ FR-018:

| Mockup state               | Spec FR              | 视觉                                                                                                                                                         |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `settings-default`         | FR-001 ~ FR-006      | settings/index 主页 — Card 1 单行 active / Card 2 4 行 disabled / Card 3 退出登录 destructive / footer 双链接                                                |
| `account-security-default` | FR-007 + FR-018 + Q4 | account-security/index — Card 1 第一行手机号 mask `+86 138****5678` 右对齐 + chevron;实名 / 第三方绑定 / 登录设备 / 安全小知识 disabled;注销账号 destructive |
| `phone-detail`             | FR-008 + Q4          | account-security/phone 极简 — 居中 maskPhone 大字 mono + tracking-wide                                                                                       |
| `legal-personal-info`      | FR-009 / FR-011 / Q6 | legal/personal-info 占位文案居中 ink-muted                                                                                                                   |
| ~~`logout-alert`~~ (跳过)  | FR-005               | 接受 RN 系统 Alert 降级 per plan 决策 5,mockup 不画弹窗;legal/third-party 与 personal-info 共模板,1 frame 涵盖                                               |

**4/4 完全 match,无 spec drift**(legal third-party 与 personal-info 共模板属合理压缩,不算覆盖空白)。

## 4. Token 决策记录

| 维度                                          | 状态                                                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tailwind.config.js vs my-profile PHASE 2 base | **完全 byte-equal**(diff 0 行)                                                                                                                                               |
| 新增 token                                    | **0**                                                                                                                                                                        |
| 复用清单                                      | brand / accent / ink / line / surface / ok / warn / err / spacing / radius / fontFamily / boxShadow.card / boxShadow.cta — **全套** my-profile PHASE 2 base                  |
| **不消费**                                    | `hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` — my-profile 引入,本 spec 无 hero / 无沉浸式背景,不需要                                               |
| Hex / px 字面量(业务代码)                     | 0(除 SVG `stroke={color}` / Pressable `style={{ height: 52 }}` layout 维度,详 § 5)                                                                                           |
| 关键复用决策                                  | `list-divider → line-soft` / `link-text → accent`(避免与 brand-500 主 CTA 撞色;FR-009 footer)/ `card-bg → surface` / `destructive → err`(退出登录 / 注销账号文字色,暗示风险) |

**落地动作**:`packages/design-tokens/src/index.ts` 和 `apps/native/tailwind.config.ts` **0 改动**。

## 5. 翻译期注意点

### 5.1 5 条通用 gotcha audit(per meta playbook § 5.1)

| #   | 检查项                                  | account-settings-shell 落点                                                                                                                                                                                     |
| --- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 非档 spacing / radius 静默 drop         | mockup 用 `px-md` / `pt-md` / `pb-xl` / `pt-xl` / `pb-lg` / `pt-2xl` / `pt-lg` / `pb-md` / `mr-xs` / `mt-md` / `gap-md` / `gap-2` / `gap-3` / `gap-1.5` / `gap-1` — 全在 NativeWind v4 default + tokens scale ✓ |
| 2   | reanimated 包安装                       | **本 spec 无动画**(无 SlideTabs / 无 sticky scroll),不消费 reanimated ✓                                                                                                                                         |
| 3   | 不规范 inline style                     | 3 处:Row line 126 `style={{ height: 52 }}`(layout 维度,豁免)/ LogoutAlert line 165/180/188(整段不翻译,豁免)→ 翻译版仅保留 Row `style={{ height: 52 }}` 单点                                                     |
| 4   | className token 是否在 design-tokens 内 | 全部既有 token,无新增 ✓                                                                                                                                                                                         |
| 5   | flex-row gap-N 在 spacing scale 内      | `gap-md` / `gap-2` / `gap-3` / `gap-1` / `gap-1.5` 全在 NativeWind v4 default + tokens ✓                                                                                                                        |

### 5.2 account-settings-shell 特定 gotcha

| #   | 检查项                                                  | 详情                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | mockup `<StackHeader>` 与 Expo Router Stack header 冲突 | mockup 自画的 header(line 51-74)是 design-time 替身(IOSFrame 没 Stack)。**翻译版删 `<StackHeader>` 整段调用**;5 page 由 `Stack.Screen options={{ title: ... }}` 提供 default header(已 ship in PHASE 1)                                                              |
| 2   | mockup primitives "反向 export" 模式                    | mockup 让 AccountSecurityScreen `import { StackHeader, Card, Row, Divider } from "./SettingsScreen"` — 是设计阶段省事,production 应抽到 `app/(app)/settings/_primitives.tsx`,5 page 都从此 import,SettingsScreen 不再 export                                         |
| 3   | mockup `<LogoutAlert>` custom modal                     | mockup 画了自定义底部居中 modal(line 161-195),与 plan 决策 5 + PHASE 1 已 ship `Alert.alert()` 不一致。**翻译版删整段**(详 § 6 drift)                                                                                                                                |
| 4   | mockup PhoneScreen `已绑定手机号` 副标题                | mockup line 26-28 加了副标题,与 spec FR-008 + Q4 "仅 mask 显示" 不一致。**翻译版删副标题**(详 § 6 drift)                                                                                                                                                             |
| 5   | mockup `state` prop 自管 demo 模式                      | SettingsScreen `({ state }: SettingsScreenProps)` line 198 是 preview demo 用,**不要复制**。翻译版只用 `useState` + `Alert.alert()`,无 `state` prop                                                                                                                  |
| 6   | a11y 必须从 PHASE 1 完整继承                            | mockup 仅写 `accessibilityState={{ disabled }}`,未含 PHASE 1 全套 `accessibilityRole / Label / Hint`。**翻译版必须保留 PHASE 1 a11y 全套**(per spec FR-014 + T4/T5/T6/T7/T8 测试 case): `role=button` / `Label` / `disabled state` / `busy state` / `Hint`(退出登录) |
| 7   | 测试 surface 兼容性                                     | PHASE 1 测试经 `accessibilityLabel/Role` 选择器 query。翻译版 className 重写 + JSX 嵌套基本不变(Pressable / Text 仍在,只是包了一层 `<Card>` / `<Divider>`),测试**应不失效**;如失效需调测试 selector 而非业务流                                                       |
| 8   | Row prop 命名与既有 a11y 整合                           | mockup `Row({ label, value, disabled, destructive, showChevron, align, onPress })` 设计良好,翻译时再加 `accessibilityHint?: string`(退出登录用)+ `accessibilityState?` 透传(busy/disabled)                                                                           |
| 9   | iOS Stack header 中文标题省略号问题                     | mockup `《个人信息收集与使用清单》` 长 12 字符,在 iOS Stack header 居中标题处可能被压缩。Expo Router 自动加省略号 + tap 显完整;接受 default,不引入自定义 header(per § 6 drift 决策)                                                                                  |

## 6. Drift 政策

| 情况                                                                     | 处理                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| mockup `<StackHeader>` 自画 vs Expo Router default                       | **以 Expo Router default 为准**(已 ship + iOS native 体验 + 0 维护);mockup `<StackHeader>` / `<IconBack>` 整段删,不入 implementation |
| mockup `<LogoutAlert>` custom modal vs PHASE 1 `Alert.alert()`           | **以 PHASE 1 `Alert.alert()` 为准**;custom modal 留 PHASE 2.5 future PR(若有更精确的视觉控制需求);mockup 整段删                      |
| mockup PhoneScreen `已绑定手机号` 副标题 vs spec Q4 "仅 mask 显示"       | **以 spec 为准**,删副标题;PhoneScreen 保持 mockup 大字 mono + tracking-wide 视觉,但仅显 mask 不显其他文字                            |
| mockup primitives 从 SettingsScreen 反向 export vs 干净 \_primitives.tsx | **以 \_primitives.tsx 为准**(等价干净版,非 drift),5 page 都从此 import                                                               |
| mockup 与 spec.md 状态机不符                                             | 4/4 一致,无冲突                                                                                                                      |
| mockup 引入新 token                                                      | 0 新增,完全复用 my-profile PHASE 2 base                                                                                              |
| mockup `<HeroBlurBackdrop>` / 复杂动画                                   | N/A(本 spec 无 hero / 无动画)                                                                                                        |

## 7. 引用

- [`spec.md`](../spec.md) — FR-001 ~ FR-020 业务流 / SC-005 反枚举不变性 / SC-007 ~ SC-012 PHASE 1 视觉占位 4 边界 / Q4 phone mask "仅 mask 显示" / Q6 法规占位文案
- [`plan.md`](../plan.md) — 10 决策 + UI 段本 PR 从占位回填完整版(T14)
- [`tasks.md`](../tasks.md) — T_mock / T12 / T13 / T14 / T15 本 PR 同步 ✅(T15 视后端 release 状态走 msw mock 走视觉冒烟)
- [`mockup-prompt.md`](./mockup-prompt.md) — Claude Design prompt(PR [#73](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/73) docs 段已 ship)
- [my-profile handoff.md](../../my-profile/design/handoff.md) — 同 SDD 链 spec A 的 handoff,本文件沿用 7 段结构 + token base
- [my-profile mockup-prompt.md](../../my-profile/design/mockup-prompt.md) — token base 来源
- [`fix(account): replace sun-ray icon with proper gear SVG`](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/72)(`e2b933d`) — 本 spec 不重画 ⚙️ 齿轮 icon,引用 my-profile (tabs)/profile.tsx 的 standard Feather "settings" gear 路径
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [meta `docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 5 handoff 模板
