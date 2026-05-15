# Implementation Plan: Onboarding Page (displayName profile gate)

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-05（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md) + [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)）
**Status**: Draft（pending impl + mockup PHASE 2，docs-only PR）
**Pending deps**: server `docs/account-profile-onboarding` PR merged → server impl PR merged → `pnpm api:gen:dev` 拉新 OpenAPI spec（含 `AccountProfileControllerApi.getMe / patchMe`）

> **per ADR-0017 类 1 流程分阶段**：本 PR docs / 下 session impl 业务流 + 占位 UI / 再下 session mockup PHASE 2 → UI 完成。本 plan UI 段为占位版（4 边界条目）；mockup 落地后回填完整 UI 段。

## 数据流

```text
phoneSmsAuth submit (既有 useLoginForm hook，本 spec 不改)
   │
   ▼
@nvy/auth.phoneSmsAuth(phone, code)  [packages/auth/src/usecases.ts]
   │
   ├─ 调 getAccountAuthApi().phoneSmsAuth({phone, code})
   │  → store.setSession({accountId, accessToken, refreshToken})
   │
   └─ **新增** ：调 loadProfile()  ──→ getAccountProfileApi().getMe()
                                       → store.setDisplayName(displayName | null)
   │
   ▼
AuthGate (apps/native/app/_layout.tsx) re-evaluates state
   │
   ├─ !isAuthenticated         → router.replace('/(auth)/login')
   ├─ isAuthenticated && displayName == null  → router.replace('/(app)/onboarding')
   └─ isAuthenticated && displayName != null  → router.replace('/(app)/')

Onboarding page (apps/native/app/(app)/onboarding.tsx)
   │
   ├─ useOnboardingForm()  [新建 apps/native/lib/hooks/use-onboarding-form.ts]
   │     ├─ form state machine : idle → submitting → (success | error)
   │     ├─ submit(displayName) ──→ @nvy/auth.updateDisplayName(displayName)
   │     │                          → store.setDisplayName(displayName)
   │     ├─ AuthGate listens isAuthenticated + displayName → 自动 router.replace('/(app)/')
   │     └─ error → setErrorMessage(...)
   │
   ├─ displayName zod schema  [新建 apps/native/lib/validation/onboarding.ts]
   │     └─ displayNameSchema : trim + Unicode codepoint count + 字符集 regex
   │
   └─ UI 渲染（PHASE 1 占位 — 4 边界，per FR-006）
         ├─ <View> root container
         ├─ <Text> 标题 "完善个人资料"（裸 RN，无 className 视觉）
         ├─ <TextInput> displayName 输入
         ├─ <Pressable> 提交按钮
         └─ <Text> 状态 / 错误展示位
```

## 状态机

```text
idle
  │ submit(displayName) called + form valid
  ▼
submitting
  │     ├─ updateDisplayName 成功 → store.setDisplayName → AuthGate 接管 router.replace('/(app)/')
  │     │                                                  │
  │     │                                                  ▼
  │     │                                             success (本页面卸载)
  │     │
  │     └─ updateDisplayName throw → mapApiError → setErrorMessage
  │                                                       │
  │                                                       ▼
  │                                                     error
  │                                                       │ user changes input
  │                                                       ▼
  └────────────────────────────────────────────────── idle (errorMessage cleared)
```

**关键不变性**：

- success 路径**不主动调** router.replace；由 AuthGate 监听 store.displayName 变化自动 redirect（与 login 页 PR #48 same pattern）
- 401 路径不到达本 hook（packages/api-client 拦截器透明 refresh，per 既有契约）
- 占位 UI 阶段**无 success overlay 动画**（per FR-008）；mockup PHASE 2 决定是否加

## 错误映射（mapApiError 复用契约）

复用 `apps/native/lib/validation/login.ts.mapApiError`（既有），**不**为 onboarding 单独定义新 mapper。新增映射：

| 输入                                                                 | output.kind    | output.toast                             |
| -------------------------------------------------------------------- | -------------- | ---------------------------------------- |
| `ResponseError` w/ status 400 + body.code === `INVALID_DISPLAY_NAME` | `'invalid'`    | `'昵称不合法，请重试'`                   |
| `ResponseError` w/ status 429                                        | `'rate_limit'` | `'请求过于频繁，请稍后再试'`             |
| `ResponseError` w/ status 5xx                                        | `'network'`    | `'网络异常，请重试'`                     |
| `FetchError` / `TypeError`（裸网络错）                               | `'network'`    | `'网络异常，请重试'`                     |
| `ResponseError` w/ status 401                                        | （不到此层）   | — packages/api-client 拦截器透明 refresh |
| 其他 / unknown                                                       | `'unknown'`    | `'提交失败，请稍后重试'`                 |

`mapApiError` 既有签名足够，加 1 个 `INVALID_DISPLAY_NAME` 子码 case 即可（既有已含 401 / 429 / network）。

## 复用既有代码

| 来源                                                       | 用法                                                                                  | M1.2 状态                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `@nvy/auth.useAuthStore`                                   | store + persist + setSession + clearSession（本 spec 扩 `displayName` 字段 + setter） | 🟡 扩展（FR-002）                       |
| `@nvy/auth.phoneSmsAuth(phone, code)`                      | login wrapper（本 spec 在末尾注入 `loadProfile()` 调用）                              | 🟡 扩展（FR-004）                       |
| `@nvy/api-client.ResponseError / FetchError`               | mapApiError 入参类型                                                                  | 🟢 不变                                 |
| `expo-router.useRouter()`                                  | router.replace（实际由 AuthGate 调，hook 不直调）                                     | 🟢 不变                                 |
| AuthGate（apps/native/app/\_layout.tsx，PR #48）           | 已 mount 全局；扩 2 态 → 3 态决策                                                     | 🟡 扩展（FR-001）                       |
| React Hook Form + zod resolver                             | form 管理                                                                             | 🟢 不变                                 |
| `mapApiError`（既有，apps/native/lib/validation/login.ts） | 错误文案统一                                                                          | 🟡 加 1 个 case（INVALID_DISPLAY_NAME） |

**新增依赖**（待 server impl + `pnpm api:gen:dev` 后落地，本 PR docs 阶段不引入）：

| 来源                                     | 用法                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `@nvy/api-client.getAccountProfileApi()` | 由 OpenAPI generator 产出，含 `getMe()` / `patchMe(DisplayNameUpdateRequest)` |
| `@nvy/api-client.AccountProfileResponse` | response DTO（accountId / displayName / status / createdAt）                  |

## RN Web 兼容点（per [`.claude/nativewind-mapping.md`](../../../.claude/nativewind-mapping.md) 既有 gotcha）

PHASE 1 占位 UI 阶段使用裸 RN component，gotcha 影响最小化：

| 维度                           | 约束                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| KeyboardAvoidingView           | 必须包裹 form 区域，避免 iOS 软键盘遮 input；Web 端 noop                                                        |
| accessibilityLiveRegion        | Android only；iOS / Web 用 `accessibilityRole='alert'`（per FR-010）                                            |
| router.replace 在 hydration 前 | AuthGate 已守 `navigationRef.isReady()`（既有 PR #48）；rehydrate 中渲染 splash 不立即跳路由（FR-001 / SC-007） |
| iOS / Android hardware back    | `BackHandler.addEventListener` Android 拦截返 true（noop）；iOS 默认无 hardware back（per FR-011）              |

mockup PHASE 2 落地后引入 className / token 时再回填 NativeWind 兼容点（hover / borderRadius / boxShadow 等）。

## UI 结构（PHASE 2 mockup 落地，per ADR-0017 类 1 流程）

**Mockup 来源**：[`design/mockup-prompt.md`](./design/mockup-prompt.md) → Claude Design 产出 [`design/source/`](./design/source/) → [`design/handoff.md`](./design/handoff.md) 翻译期决策。

**视觉前提**：tailwind.config.js byte-identical 于 login v2，0 新增 token；5/7 子组件复用 @nvy/ui，2/7 inline。

### 区域分块（自上而下）

| 区域                                                | 实现                                                                                                       | 关键 className                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 顶部 spacer（无 close × / skip / 返回，per FR-011） | `<View className="flex-row items-center h-11" />`                                                          | `h-11`                                                                                                        |
| Header（LogoMark + 标题 + 副标题，居中）            | `<View className="mt-4 items-center gap-3">` 内 `<LogoMark size={40} />` + 标题 `<Text>` + 副标题 `<Text>` | `mt-4 items-center gap-3` / `text-[28px] font-bold tracking-tight` / `text-sm text-ink-muted leading-relaxed` |
| Form（DisplayNameInput + 可选 ErrorRow）            | `<View className="mt-9">` 内 `<DisplayNameInput />` + 条件 `<ErrorRow />`                                  | `mt-9`                                                                                                        |
| CTA（PrimaryButton）                                | `<View className="mt-7"><PrimaryButton ... /></View>`                                                      | `mt-7`                                                                                                        |
| Bottom spacer（撑开）                               | `<View className="flex-1" />`                                                                              | `flex-1`                                                                                                      |
| Footer 提示（"昵称可在「设置」中随时修改"）         | `<Text>` 居中、低对比度                                                                                    | `text-center text-[11px] text-ink-subtle mb-2`                                                                |

整页容器 `<View className="flex-1 bg-surface px-lg pb-lg">` 包于 `<KeyboardAvoidingView>`。

### 状态视觉转移（4 状态 ↔ hook `OnboardingStatus`）

| status       | input 视觉                                        | CTA 视觉                                                             | 错误位                             | overlay                                                              |
| ------------ | ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `idle`       | `border-line` + 计数 0/32                         | `bg-brand-300` disabled（form 空 → `!isSubmittable`）                | 隐藏                               | —                                                                    |
| `submitting` | `border-brand-500`（focused） + `opacity-60` 锁定 | `bg-brand-300` + Spinner + "提交中…"                                 | 隐藏                               | —                                                                    |
| `success`    | —                                                 | —                                                                    | —                                  | full-screen `<SuccessOverlay>`（SuccessCheck + "完成！" + 进入提示） |
| `error`      | `border-err` + 计数同上                           | 恢复 `bg-brand-500` enabled（hook 清回 idle 由 setDisplayName 触发） | `<ErrorRow text={errorMessage} />` | —                                                                    |

> PrimaryButton drift accepted — per [`handoff.md § 6`](./design/handoff.md#6-drift-政策)，packages/ui 当前 2 态（`disabled∪loading=bg-brand-300`），mockup 设计 3 态视觉细节差异以代码为准。

### Token 映射（实际使用清单）

| 维度      | className                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Surface   | `bg-surface`                                                                                                                                                       |
| Padding   | `px-lg`（24）/ `pb-lg`（24）/ `pl-2`（8）                                                                                                                          |
| Margin    | `mt-1.5` / `mt-2` / `mt-4` / `mt-7` / `mt-9` / `mb-2`                                                                                                              |
| Gap       | `gap-2` / `gap-3` / `gap-4`                                                                                                                                        |
| Size      | `h-11` / `h-12` / `pb-20`                                                                                                                                          |
| Border    | `border-b` / `border-line` / `border-brand-500`（focused） / `border-err`（errored）                                                                               |
| Font 字号 | `text-base` / `text-sm` / `text-xs` / `text-xl` / `text-[28px]`（标题 arbitrary）/ `text-[11px]`（footer arbitrary）                                               |
| Font 颜色 | `text-ink` / `text-ink-muted` / `text-ink-subtle` / `text-err` / `text-white`                                                                                      |
| Font 修饰 | `font-bold` / `font-semibold` / `font-medium` / `font-mono` / `font-sans` / `tracking-tight` / `text-center` / `leading-relaxed` / `leading-snug` / `leading-none` |
| Layout    | `flex-1` / `flex-row` / `items-center` / `justify-center`                                                                                                          |
| Effect    | `opacity-60`                                                                                                                                                       |

**全清单已在 `packages/design-tokens`** — grep cross-check 无新引入。

### 复用 packages/ui 组件清单（per handoff.md § 2）

| 组件               | 来源        | 备注                                                           |
| ------------------ | ----------- | -------------------------------------------------------------- |
| `Spinner`          | `@nvy/ui`   | size=12 / 15 两种使用（CTA loading + SuccessOverlay 进入提示） |
| `SuccessCheck`     | `@nvy/ui`   | 仅 SuccessOverlay 内                                           |
| `LogoMark`         | `@nvy/ui`   | 显式 `size={40}`（onboarding 专属，packages/ui 默认 56）       |
| `ErrorRow`         | `@nvy/ui`   | error 状态条件渲染                                             |
| `PrimaryButton`    | `@nvy/ui`   | drift accepted（disabled 视觉差）                              |
| `DisplayNameInput` | inline 本页 | once-only；未来通用 TextInput 走单独 ADR（per FR-012）         |
| `SuccessOverlay`   | inline 本页 | onboarding 专属视觉（与 login 即时跳转不同）                   |

### a11y 落点

| 元素                          | a11y props                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| TextInput                     | `accessibilityLabel="昵称"` + `accessibilityHint="1 至 32 字符，支持中文、字母、数字、emoji"` + `returnKeyType="done"` + `maxLength={32}` |
| PrimaryButton（来自 @nvy/ui） | `accessibilityRole="button"` + `accessibilityState={{ disabled, busy: !!loading }}` + `accessibilityLabel={label}` packages/ui 内置       |
| ErrorRow（来自 @nvy/ui）      | `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` packages/ui 内置                                                         |

PHASE 2 不新增 a11y 维度（mockup 未带新需求，hook 不变）。

## 测试策略

| 层                  | 工具                            | 覆盖范围                                                                                                    | 阶段                        |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------- |
| 单测（store）       | vitest                          | `useAuthStore.setDisplayName` + `clearSession` 清空 displayName + persist 白名单 rehydrate                  | PR-impl-1（业务流）         |
| 单测（usecases）    | vitest + msw                    | `loadProfile` happy / 401 / 网络错；`updateDisplayName` happy / 400 / 429 / 网络错 / 401（透明 refresh）    | PR-impl-1                   |
| 单测（schema）      | vitest                          | `displayNameSchema` 8 case（per SC-004 spec）正负                                                           | PR-impl-1                   |
| 单测（hook）        | vitest + @testing-library/react | `useOnboardingForm` 4 状态机 transition + 错误清理 + a11y state                                             | PR-impl-1                   |
| 单测（AuthGate）    | vitest + @testing-library/react | 三态决策表 9 case（per SC-002）+ rehydrate 不抖（per SC-007）                                               | PR-impl-1                   |
| 组件测              | @testing-library/react-native   | onboarding.tsx render + 提交流程 + 错误展示                                                                 | PR-impl-1                   |
| E2E（真后端冒烟）   | Playwright `runtime-debug.mjs`  | happy 新用户 → onboarding submit → home 路径，截图归档 `runtime-debug/2026-05-XX-onboarding-business-flow/` | PR-impl-1 末尾              |
| 视觉回归（PHASE 2） | （工具 TBD）                    | mockup vs 实际渲染像素对比                                                                                  | PR-impl-2（mockup PHASE 2） |

## Constitution / 边界 Check

- ✅ phoneSmsAuth response 不读 displayName（client 反枚举不变性，per SC-003）
- ✅ AuthGate 三态决策不调 phoneSmsAuth response 字段（仅消费 store.displayName）
- ✅ 占位 UI 0 视觉决策（per ADR-0017 类 1 + FR-006 + SC-005）
- ✅ 不引 packages/ui（per FR-006 + FR-012）
- ✅ DisplayName 校验镜像 server FR-005（per spec FR-005 / SC-004）
- ✅ 不引入新 dep（仅扩既有 store / usecases / mapApiError）
- ✅ logout 清 displayName（per FR-009 + SC-006）

## 反模式（明确避免）

- ❌ 在 phoneSmsAuth wrapper 内部读取 response 中的 `displayName`（破坏 ADR-0016 反枚举不变性）
- ❌ 在 onboarding 页面 import `@nvy/ui` 抽组件（破坏 ADR-0017 类 1 占位 UI 4 边界）
- ❌ 在占位 UI 阶段写视觉细节（间距 / 颜色 / 字号 / 阴影 / 自定义动画）— 该工作留给 mockup PHASE 2
- ❌ AuthGate 直接调 `getAccountProfileApi().getMe()`（应通过 `@nvy/auth.loadProfile()` 间接调，保持 store 唯一变更入口）
- ❌ Hook 内部直接 `router.replace`（应让 AuthGate 监听 store 变化触发，与 login 页同模式）
- ❌ persist 中间件白名单**不**纳入 displayName（rehydrate 时重新 loadProfile 太慢 + 闪烁）— FR-002 显式纳入
- ❌ logout 清空 session 时**忘**清 displayName（旧值会污染下一个登录账号的 gate decision）— FR-009 + SC-006 守

## 风险 + 缓解

| 风险                                                | 缓解                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| server PR 未合并前先做 app impl，OpenAPI spec drift | T0 任务前置：等 server PR 合并 + `pnpm api:gen:dev` 拉新 client；CI typecheck 兜底     |
| AuthGate 三态决策在 rehydrate 中误判跳路由          | FR-001 显式声明 rehydrate 未完成时渲染 splash 不跳；SC-007 测试守                      |
| logout 残留 displayName 污染下一个账号              | FR-009 + SC-006；store.clearSession 实现内 inline 清 displayName，单测断言             |
| mockup PHASE 2 落地后整段重写 onboarding.tsx 撞依赖 | PHASE 1 占位 UI 严格 4 边界 + 不引 packages/ui，mockup 落地时整段 paste 不连带删旧组件 |
| PATCH 透明 refresh 401 链路覆盖不到                 | packages/api-client 拦截器既有契约 + 单测 mock 401 → refresh 流程                      |
| onboarding 页面 hardware back deadlock（用户卡死）  | FR-011 + manual 测；back noop + 显式 toast 提示"请完成昵称设置"                        |
