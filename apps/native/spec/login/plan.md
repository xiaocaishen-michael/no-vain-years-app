# Implementation Plan: Login Page

**Branch**: `feat/account-login-page`
**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-03
**Status**: 业务段完整；UI 结构段待 mockup 落地后补；tasks.md T0-T3 完整 / T4-T8 待 mockup 后补
**Depends**: PR #42（@nvy/auth + @nvy/api-client + auth guard 落地）+ server PRs #98 / #101（4 endpoint）

> 本 plan 切成两个回合：
>
> 1. **本次（5-03）**：业务逻辑层（zod schema / form state machine hook / 单测）+ login.tsx 最小占位接 hook —— 全部不依赖 mockup
> 2. **下次（mockup 落地后）**：吸收 mockup 决策回填 UI 结构段；packages/ui 组件 TDD-emerge；className 1:1 paste mockup → tasks T4-T8

## 数据流

```text
<LoginScreen>
   │
   ├─ useLoginForm()  (apps/native/lib/hooks/use-login-form.ts)
   │     ├─ tab state            : 'password' | 'sms'
   │     ├─ form state machine   : idle → submitting → (success | error)
   │     ├─ submitPassword(p, pw) ──→ @nvy/auth.loginByPassword
   │     ├─ submitSms(p, code)    ──→ @nvy/auth.loginByPhoneSms
   │     ├─ requestSms(p)         ──→ @nvy/api-client.getAccountRegisterApi().requestSmsCode (purpose='LOGIN')
   │     └─ navigation            : success → @nvy/auth.setSession (内部); AuthGate 自动 redirect (hook 不直调 router)
   │
   ├─ login schemas (apps/native/lib/validation/login.ts)
   │     ├─ loginPasswordSchema  : z.object({ phone: z.string().regex(PHONE_RE), password: z.string().min(1) })
   │     ├─ loginSmsSchema       : z.object({ phone: z.string().regex(PHONE_RE), smsCode: z.string().regex(/^\d{6}$/) })
   │     └─ mapApiError(e)       : (ApiClientError | ResponseError | TypeError | unknown) → { kind, toast }
   │
   └─ UI 渲染（本次仅占位；TBD：mockup 落地后 packages/ui 组件实现）
         ├─ <TabSwitcher> (TBD)
         ├─ <PhoneInput>   (TBD)
         ├─ <PasswordInput>(TBD)
         ├─ <SmsCodeInput> (TBD)
         ├─ <Button>       (TBD)
         └─ <Toast>        (TBD)
```

## 状态机

```text
idle
  │ submitPassword / submitSms invoked + form valid
  ▼
submitting
  │     ├─ api success → @nvy/auth.setSession; state success
  │     │                                               │
  │     │                                               ▼
  │     │                                          success (AuthGate 监测 isAuthenticated → router.replace('/(app)') → page unmounts)
  │     │
  │     └─ api throws → mapApiError → setErrorToast
  │                                                     │
  │                                                     ▼
  │                                                   error
  │                                                     │ user changes input OR switches tab
  │                                                     ▼
  └────────────────────────────────────────────────── idle (errorToast cleared)
```

## 错误映射（mapApiError 契约）

| 输入                                               | output.kind    | output.toast                                                       |
| -------------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| `ResponseError` w/ status 401                      | `'invalid'`    | `'手机号或验证码/密码错误'`                                        |
| `ResponseError` w/ status 429                      | `'rate_limit'` | `'请求过于频繁，请稍后再试'`                                       |
| `ResponseError` w/ status 5xx                      | `'network'`    | `'网络异常，请检查网络后重试'`                                     |
| `ResponseError` w/ status 400                      | `'invalid'`    | `'手机号或验证码/密码错误'` (form validation 已先拦下，此分支兜底) |
| `TypeError`（fetch 抛 — 网络断 / DNS 失败 / CORS） | `'network'`    | `'网络异常，请检查网络后重试'`                                     |
| `ApiClientError`（generic wrapper）                | `'unknown'`    | `'登录失败，请稍后再试'`                                           |
| 其他 / unknown                                     | `'unknown'`    | `'登录失败，请稍后再试'`                                           |

**关键不变性**（per spec FR-006 + SC-002 防枚举）：401 不细分子码，**所有 401 路径返回完全相同的 `kind`/`toast`**。这保证 "已注册号 + 错码" vs "未注册号 + 任意码" 两个场景在前端可见的字节级一致。

## 复用既有代码（PR #42）

| 来源                                                                                                             | 用法                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@nvy/auth.loginByPassword(phone, password)`                                                                     | US1 提交路径                                                                                                                         |
| `@nvy/auth.loginByPhoneSms(phone, smsCode)`                                                                      | US2 提交路径                                                                                                                         |
| `@nvy/auth.useAuthStore`（Zustand store + persist）                                                              | `useAuthStore.getState().setSession(...)` 由 useLoginForm 间接通过上面 use case 调用（store 写入是 use case 内部副作用，本页不直调） |
| `@nvy/api-client.getAccountRegisterApi().requestSmsCode({ requestSmsCodeRequest: { phone, purpose: 'LOGIN' } })` | US2 短信触发；purpose enum 'login' / 'register' 二选一（per server FR-001）                                                          |
| `@nvy/api-client.ResponseError` / `ApiClientError`                                                               | mapApiError 入参类型                                                                                                                 |
| `expo-router.useRouter()`                                                                                        | router.replace / router.push                                                                                                         |
| auth guard middleware（apps/native/app/\_layout.tsx，PR #42）                                                    | 已 mount 全局，本页不重复实现                                                                                                        |

**非依赖**（已确认）：

- React Hook Form + zod resolver 已装（packages.json 含 `react-hook-form` + `@hookform/resolvers` + `zod`）
- jest + @testing-library/react-native 已装（apps/native/package.json）

## RN Web 兼容点（per [.claude/nativewind-mapping.md](../../../.claude/nativewind-mapping.md) 已知 gotcha）

| 维度                    | 约束                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| hover / focus 视觉      | 只在 `<Pressable>` 上 fire；`<View>` 上的 hover className 不生效                |
| borderRadius            | 不用 `%` 单位（RN Web 报 warning）；用 `rounded-{sm,md,lg,full}` Tailwind class |
| boxShadow               | 用 design-tokens 定义的 shadow class，不写 `shadow-[...]` 任意值                |
| accessibilityLiveRegion | Android only；iOS / Web 用 `accessibilityRole='alert'`                          |
| KeyboardAvoidingView    | 必须包裹 form 区域，避免 iOS 软键盘遮 input；Web 端无影响（noop）               |

## UI 结构

> **TBD：等 Claude Design mockup 落地（参见 `apps/native/spec/login/design/mockup-v1.png` + `handoff.md`）。**
>
> mockup 出后回本段，由 UI UX Pro Max skill 跑一遍 review，含：
>
> | 子段                          | 内容（mockup 落地后回填）                                                        |
> | ----------------------------- | -------------------------------------------------------------------------------- |
> | 布局                          | 单列 / 双列 / 栅格；最大宽度（含 desktop 大屏不铺满）                            |
> | 区域                          | header / form / action / footer + 每区域用 `@nvy/ui` 哪些组件                    |
> | 间距 / 颜色 / 字号 token 映射 | 全部 Tailwind class（`p-md` / `bg-brand-500` / `text-base`）；禁 inline px / hex |
> | 状态机                        | idle / submitting / error 视觉转移（loading spinner 位置 / error toast 位置）    |
> | 边缘 case                     | 长手机号 / 国际号兼容（M1.2 仅大陆）/ 软键盘弹出布局                             |
> | RN Web 兼容点                 | 同上节，落到具体组件 prop                                                        |
> | a11y                          | accessibilityLabel / role / focus 顺序 / tab order                               |
>
> **禁入**（mockup 落地时）：精确 px / hex 颜色 / 阴影偏移 / 字重绝对值 — 全部走 design-tokens（"换皮"零成本）。

## 测试策略

| 层             | 工具                                                                          | 覆盖范围                                                                       |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 单测（schema） | jest                                                                          | zod schema 正负 case + mapApiError 各错误类型映射                              |
| 单测（hook）   | jest + @testing-library/react-hooks（或 @testing-library/react 19 hook test） | useLoginForm 状态机所有 transition + tab 切换 + form invalid → submit 不调 api |
| 组件测（TBD）  | @testing-library/react-native                                                 | login.tsx 渲染 + tab 切换 + form 提交（mockup 落地后补 packages/ui 组件测）    |
| E2E（TBD）     | 手测（expo dev server 浏览器 + iOS simulator）                                | 完整 5 条 acceptance scenario                                                  |

**本次 PR 不覆盖**：组件测 + E2E（等 mockup 落地后下一 PR）。

## 不在本 plan 范围

- mockup 视觉决策（间距 / 颜色 / 字号 / 圆角具体值）— 由 Claude Design 单独产出
- packages/ui 组件实现（TabSwitcher / PhoneInput / PasswordInput / SmsCodeInput / Button）— mockup 落地后 TDD-emerge
- register 页 / home 页 — login 页定调 design system 后开
- 国际化 / 多语言 — M3+
- 真机 iOS / Android 渲染验证 — M2.1
- "踢掉其他设备" / "退出所有设备"按钮（在 home 页，本 spec 不涉及）

## Phase 风险与缓解

| 风险                                                                            | 缓解                                                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| mockup 与业务逻辑层假设冲突（如 mockup 设计了"无 tab 单页双 form 同屏"）        | 业务层 hook 设计兼容：`useLoginForm` 暴露 `tab + setTab`；mockup 决定不要 tab 时只用 password 路径 + 点按钮切 sms 即可，hook 接口不变 |
| Claude Design 输出的 className 与本仓 design-tokens 不匹配（用了非 token 化值） | handoff.md 必须列出"实际用到的 token 名称"；不匹配的 class 在 review 阶段拒绝                                                         |
| 60s 倒计时在切 tab / unmount 时未清 timer                                       | useLoginForm 内部 useEffect cleanup 必须 clearInterval；单测覆盖                                                                      |
