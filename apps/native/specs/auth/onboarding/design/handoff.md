# Onboarding Mockup Handoff

> Bundle 来源：Claude Design (claude.ai/design)，2026-05-06 拿到
> Mockup prompt：[`mockup-prompt.md`](./mockup-prompt.md)（PR [#65](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/65) ship）
> 翻译期 PR：本 PR（feature/onboarding-mockup-translation）

## 1. Bundle 内容速览

| 文件                                                                         | 体积   | 作用                                                                                                  |
| ---------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| [`source/OnboardingScreen.tsx`](./source/OnboardingScreen.tsx)               | 12 KB  | 主组件，含 7 个 inline 子组件（5 个与 packages/ui 重复）                                              |
| [`source/OnboardingScreenPreview.tsx`](./source/OnboardingScreenPreview.tsx) | 3.7 KB | 4 状态横排预览（idle / submitting / success / error）                                                 |
| [`source/Onboarding-Preview.html`](./source/Onboarding-Preview.html)         | 36 KB  | HTML 原型，视觉对照用                                                                                 |
| [`source/IOSFrame.tsx`](./source/IOSFrame.tsx)                               | 2 KB   | iOS 设备外框（设计期专用，不进 implementation）                                                       |
| [`source/tailwind.config.js`](./source/tailwind.config.js)                   | 1.6 KB | Token 定义 — **byte-identical 于 login v2 `source-v2/tailwind.config.js`**（diff 无输出）             |
| [`source/assets/logo-mark.svg`](./source/assets/logo-mark.svg)               | —      | LogoMark SVG 资产参考；packages/ui/LogoMark.tsx 已用 react-native-svg 重写覆盖                        |
| [`source/preview/`](./source/preview/)                                       | —      | Claude Design sandbox shim（reanimated / rn / tokens shim + jsx render entries），不进 implementation |

**丢弃的 bundle 内容**（来自原 export，未落 source/）：

- LoginScreen.tsx / LoginScreenPreview.tsx / Login Preview.html / preview/Login\*.preview.jsx — login v2 已 ship（PR [#51](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/51)），design 同 thread 顺手复刻是冗余
- 顶层 README.md — Claude Design 通用 boilerplate，meta `docs/experience/claude-design-handoff.md` 已覆盖
- uploads/ 截图 — prompt 输入参考，不是产物

## 2. 组件 breakdown（T8 决策）

mockup `OnboardingScreen.tsx` 中 inline 了 **7 个子组件**。

| Mockup 子组件        | 处理                                   | 接口 cross-check                                                                                                                                                                                                                                                                                |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spinner              | **import @nvy/ui**                     | mockup props `{ size?, tone? }` ↔ packages/ui `SpinnerProps` 完全一致 ✓                                                                                                                                                                                                                         |
| SuccessCheck         | **import @nvy/ui**                     | 无 props ✓ — packages/ui 实现 `w-[72px]` arbitrary（per login v2 § 5.1 #1 NativeWind drop 防御），与 mockup `w-20`（80px）有 8px 差，以 packages/ui 为准                                                                                                                                        |
| LogoMark             | **import @nvy/ui，调用时 `size={40}`** | mockup `<LogoMark />` 隐含 size=40（source line 69 `width={40}`），packages/ui 默认 56；onboarding 视觉更简洁 → 显式传 size                                                                                                                                                                     |
| ErrorRow             | **import @nvy/ui**                     | mockup props `{ text }` ↔ packages/ui `ErrorRowProps` 完全一致 ✓                                                                                                                                                                                                                                |
| PrimaryButton        | **import @nvy/ui**（drift 接受）       | mockup 3 态视觉（`disabled=bg-brand-soft+text-brand-300` / `loading=bg-brand-300+text-white` / `active=bg-brand-500`），packages/ui 2 态（`disabled∪loading=bg-brand-300` / `active=bg-brand-500`）。**drift 政策：以 packages/ui 为准**（per ADR-0015），用户感知差异极小（disabled 状态短暂） |
| **DisplayNameInput** | **inline 在 onboarding.tsx**           | 单页 once-only；packages/ui 未来抽 generic TextInput 走单独 ADR，不夹带本 PR（per FR-012）                                                                                                                                                                                                      |
| **SuccessOverlay**   | **inline 在 onboarding.tsx**           | onboarding 专属视觉（对勾 + "完成！" + spinner + "正在进入今日时间线…"），与 login 即时跳转不同                                                                                                                                                                                                 |

**复用统计**：5 个 import @nvy/ui，2 个 inline。**翻译期必须删 mockup 这 5 段 inline 实现**（source line 30-41 / 46-62 / 67-90 / 141-150 / 155-175），以 import 替换。

## 3. 状态机覆盖

mockup 4 状态 ↔ spec FR-008 ↔ hook `useOnboardingForm` `OnboardingStatus`：

| Mockup state | Spec FR-008 | Hook status    | 视觉                                                                    |
| ------------ | ----------- | -------------- | ----------------------------------------------------------------------- |
| idle         | idle        | `'idle'`       | input 空 + CTA disabled                                                 |
| submitting   | submitting  | `'submitting'` | input 锁定 + CTA loading（Spinner + "提交中…"）                         |
| success      | success     | `'success'`    | full-screen SuccessOverlay；AuthGate 监听 store.displayName 后 redirect |
| error        | error       | `'error'`      | input border-err + ErrorRow + CTA 恢复 enabled                          |

**4/4 完全 match**，无 spec drift。Hook 状态转移由 `setDisplayName`（清 error 回 idle）+ `submit`（idle → submitting → success/error）驱动，per [`use-onboarding-form.ts`](../../../lib/hooks/use-onboarding-form.ts) line 7-8。

## 4. Token 决策记录

| 维度                           | 状态                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| tailwind.config.js vs login v2 | **byte-identical**（diff 无输出） — mockup prompt § 视觉语言 段起作用                                                    |
| 新增 token                     | **0 个** — 完全复用现有 brand / accent / ink / line / surface / ok / warn / err / spacing / radius / shadow / fontFamily |
| Hex / px 字面量                | 0 个（除 LogoMark SVG fill — packages/ui 已豁免，per LogoMark.tsx 注释 line 9-11）                                       |
| Inline style 反模式            | 1 处（mockup line 228 `style={{ fontSize: 28 }}`）→ 翻译时改为 `text-[28px]` arbitrary value（per § 5.1 #3）             |

## 5. 翻译期注意点

### 5.1 5 条通用 gotcha audit（per meta playbook § 5.1）

| #   | 检查项                                  | onboarding 落点                                                                                                                 |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 非档 spacing / radius 静默 drop         | mockup 用 gap-1.5 / gap-2 / gap-2.5 / gap-3 / gap-4 / mt-1.5 / mt-2 / mt-4 / mt-7 / mt-9 — 全部在 NativeWind v4 spacing scale ✓ |
| 2   | reanimated 包安装                       | apps/native 已含 react-native-reanimated（login v2 PR #51 已 expo install）— 无需新增                                           |
| 3   | 不规范 inline style                     | mockup line 228 `style={{ fontSize: 28 }}` → `text-[28px]`；line 40/54 reanimated 复合 props 合法 ✓                             |
| 4   | className token 是否在 design-tokens 内 | 全清单已在 packages/design-tokens — grep cross-check 无新引入                                                                   |
| 5   | flex-row gap-N 在 spacing scale 内      | gap-1.5 / gap-2 / gap-2.5 / gap-3 / gap-4 全在 NativeWind v4 默认 spacing scale ✓                                               |

### 5.2 onboarding 特定 gotcha

| #   | 检查项                                              | 详情                                                                                                                                                                                                                          |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 删 mockup 7 个 inline 中的 5 个                     | 翻译时保留 layout / `OnboardingScreen` 主函数 / `DisplayNameInput` / `SuccessOverlay`，删 Spinner / SuccessCheck / LogoMark / ErrorRow / PrimaryButton 改 import                                                              |
| 2   | mockup 主函数自管 state（demo 用）                  | mockup `OnboardingScreen` 接 `state` prop + 自维护 `name`（line 202-206）是 preview demo 用，**不要复制**。翻译版从 `useOnboardingForm` hook 拿 displayName / status / errorMessage / submit / setDisplayName / isSubmittable |
| 3   | success overlay 显示但**不跳路由**                  | mockup line 218 `if (state === "success") return <SuccessOverlay />;` 翻译保留；hook 不调 router.replace —— AuthGate 监听 store.displayName 后由 `_layout.tsx` 路由                                                           |
| 4   | BackHandler / KeyboardAvoidingView / autofocus 保留 | mockup 未涉及；现有 PHASE 1 实现 hardwareBack guard（per FR-011）+ KeyboardAvoidingView + autoFocus；翻译版**继承**                                                                                                           |
| 5   | accessibility 保留                                  | 现有 PHASE 1 含 accessibilityLabel/Hint/Role/State/LiveRegion；mockup `returnKeyType="done"` + `maxLength={32}` 叠加保留                                                                                                      |
| 6   | LogoMark `size={40}` 显式传                         | packages/ui 默认 56（mirror login），onboarding 视觉 40 — 调用 `<LogoMark size={40} />`                                                                                                                                       |
| 7   | DisplayNameInput grapheme 计数                      | mockup line 107 `[...value].length`（spread iter 计 codepoint，emoji / 中文 1 计）— 简化实现，与服务端 `[1,32]` Unicode codepoints 校验对齐                                                                                   |

## 6. Drift 政策

| 情况                                                                | 处理                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| mockup 与 packages/ui 接口一致                                      | 以 packages/ui 为准（5/5 已对齐）                                   |
| mockup 与 packages/ui 视觉细节有差（如 PrimaryButton 3 态 vs 2 态） | 以 packages/ui 为准（per ADR-0015）；handoff 记录不当 bug           |
| mockup 与 spec.md 状态机不符                                        | 以 spec 为准（4/4 一致，无冲突）                                    |
| mockup 引入新 token                                                 | 评估能否复用现有，否则 packages/design-tokens 加 + 写来源（0 新增） |

## 7. 引用

- [`spec.md`](../spec.md) — FR-001 AuthGate / FR-005 校验 / FR-006 占位 4 边界 / FR-008 状态机 / FR-011 不可跳过 / FR-012 packages/ui 抽取延后
- [`plan.md`](../plan.md) — UI 段本 PR 从占位回填完整版（T10）
- [`tasks.md`](../tasks.md) — T_mock / T8 / T9 / T10 本 PR 同步 ✅
- [`mockup-prompt.md`](./mockup-prompt.md) — Claude Design prompt（PR #65 ship）
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0016 — Unified phone-SMS auth](../../../../../docs/adr/0016-unified-mobile-first-auth.md)
- [ADR-0017 — Business flow first then mockup](../../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [meta `docs/experience/claude-design-handoff.md`](../../../../../docs/experience/claude-design-handoff.md) § 5 handoff 模板
- [login v2 handoff](../../login/design/handoff.md) — 同模式 baseline
