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

## UI 结构（PHASE 1 占位版，pending mockup PHASE 2）

**per ADR-0017 类 1 强制纪律**：本节**不**做视觉决策（间距 / 颜色 / 字号 / 阴影 / 动画 / 自定义样式属性）；mockup 由用户单独跑 Claude Design 产出后回填本段为完整 UI 结构。

### 4 边界占位条目（FR-006）

| 边界            | 占位实现                                             | mockup PHASE 2 决定                                             |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| **路由**        | `apps/native/app/(app)/onboarding.tsx` ✓             | 不变（路由不重做）                                              |
| **输入**        | 单 `<TextInput placeholder="昵称">` 裸 RN            | 间距 / 字号 / 边框样式 / 验证态视觉 / placeholder 文案润色      |
| **提交**        | 单 `<Pressable>` 裸 RN，含 `<Text>提交</Text>`       | 按钮形状 / disabled / loading / success 视觉 / hover-press 反馈 |
| **状态 / 错误** | `<Text>` 状态指示（`提交中...` / `成功` / 错误信息） | 错误位排布 / 颜色 / 图标 / 动画 / a11y alert 容器               |

### 占位代码示意（不是最终 impl，仅约束 4 边界形态）

```tsx
// apps/native/app/(app)/onboarding.tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.

import { TextInput, Pressable, Text, View, KeyboardAvoidingView } from 'react-native';
import { useOnboardingForm } from '~/lib/hooks/use-onboarding-form';

export default function OnboardingScreen() {
  const { displayName, setDisplayName, submit, status, errorMessage } = useOnboardingForm();
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>完善个人资料</Text>
        <TextInput
          accessibilityLabel="昵称"
          accessibilityHint="1 至 32 字符"
          placeholder="昵称"
          value={displayName}
          onChangeText={setDisplayName}
          editable={status !== 'submitting'}
        />
        <Pressable onPress={submit} disabled={status === 'submitting' || !displayName}>
          <Text>{status === 'submitting' ? '提交中...' : '提交'}</Text>
        </Pressable>
        {errorMessage && (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
            {errorMessage}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
```

> **样式属性白名单**（占位 UI 仅可用）：`flex / padding / margin` 基础布局原语；`<Text>` 不带 className / fontSize / color；不引 `packages/ui`；不引 `@nvy/design-tokens` className。
>
> mockup PHASE 2 落地后**整段重写**为 NativeWind className 风格（per [ADR-0014](../../../../docs/adr/0014-nativewind-tailwind-universal.md) + login 页同模式）。

### Token 映射（PHASE 2 占位）

PHASE 1 不引入 token 映射；PHASE 2 mockup 落地后回填本段（参考 login 页 plan.md UI 段 `### Token 映射` 写法）。

### a11y 落点（PHASE 1 已实施）

每个交互组件必有 `accessibilityLabel`：

- TextInput：`accessibilityLabel='昵称'` + `accessibilityHint='1 至 32 字符，支持中文、字母、数字、emoji'`
- Pressable submit：`accessibilityRole='button'` + `accessibilityState.disabled` 跟 status 联动
- Error Text：`accessibilityRole='alert'`（iOS / Web）+ `accessibilityLiveRegion='polite'`（Android）

PHASE 2 mockup 落地后审视是否新增 a11y 维度（如 form section 标签 / submit success 反馈语音）。

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
