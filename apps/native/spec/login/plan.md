# Implementation Plan: Login Page

**Branch**: `feat/account-login-page`
**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-03
**Status**: 业务段完整；UI 结构段已吸收 mockup（Claude Design v2，2026-05-03 commit `3f2cddd`）；tasks.md T0-T3 完成 / T4-T5 完成 / T6-T8 进下次 PR 走 implement
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
   └─ UI 渲染（mockup-driven，per apps/native/spec/login/design/source/LoginScreen.tsx）
         ├─ <LogoMark>          : "不"字 mark，brand-500 圆角矩形 w-11 h-11
         ├─ <TabSwitcher>       : B 站风格下划线 bar（"短信登录" / "密码登录"）
         ├─ <PhoneInput>        : +86 静态 prefix（per D7 chevron 改静态）+ 下划线分隔
         ├─ <PasswordField>     : 密码输入 + 显示/隐藏 toggle（mockup 命名，spec 原称 PasswordInput）
         ├─ <SmsInput>          : SMS 6 位输入 + 右侧"获取验证码"/"60s 后重发"内联（mockup 命名，spec 原称 SmsCodeInput）
         ├─ <PrimaryButton>     : 登录 CTA（圆角胶囊，shadow-cta；loading 变 brand-300 + spinner）
         ├─ <GoogleButton>      : Google OAuth 圆形按钮（M1.2 placeholder，per D1 仅此一个）
         ├─ <ErrorRow>          : input 下方错误提示（红圆点 ! + err 色文字）
         ├─ <SuccessCheck>      : reanimated scale-in 绿色对勾
         ├─ <SuccessOverlay>    : success 短动画 ≤ 800ms（含 SuccessCheck + 骨架屏过渡）后 router.replace（per D8）
         └─ <Spinner>           : reanimated rotation，3 tone（white / muted / brand）
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

### Mockup state prop ↔ spec/hook state 映射（per D6）

mockup 的 `LoginScreen` 接受 `state` prop 取值 `default / loading / success / error`（Claude Design preview 命名）；spec / hook 内部使用 `idle / submitting / success / error`。login.tsx 渲染时一行 mapping：

```ts
const visualState = state === 'idle' ? 'default' : state === 'submitting' ? 'loading' : state; // success / error 同名
```

不改 spec 内部命名（idle/submitting 是 React form 业界惯例）；不改 mockup（来自 frozen bundle）。

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

## UI 结构（mockup-driven）

参考源码：[`./design/source/LoginScreen.tsx`](./design/source/LoginScreen.tsx) + [`./design/handoff.md`](./design/handoff.md)。

### 布局

单列移动端，container `flex-1 bg-surface px-lg pb-lg`；mockup 测试宽度 360px。无栅格 / 无 desktop 适配（M1.2 mobile-only，desktop 走 RN Web 时由根 layout 处理）。

### 区域分块

```text
LoginScreen (flex-1 bg-surface px-lg pb-lg)
├── Header           (mt-3 items-start gap-2)
│   ├── LogoMark            (w-11 h-11 rounded-xl bg-brand-500，"不"字)
│   ├── h1: "欢迎回来"      (text-3xl font-bold text-ink mt-3.5)
│   └── subtitle           "把这一段日子，过得不虚此生。"  (text-sm text-ink-muted)
│
├── Tabs             (mt-7 mb-4)
│   └── TabSwitcher        (flex-row gap-7，按下下划线 bar 跟随)
│
├── Inputs           (gap-3)
│   ├── PhoneInput         (always 渲染，含 +86 静态前缀 — per D7 chevron 改静态)
│   └── conditional:
│       ├── SmsInput       (mode === 'sms')
│       └── PasswordField  (mode === 'password')
│
├── HelperRow        (mt-3.5 flex-row justify-between)
│   └── 仅密码 tab：       "忘记密码"链接 (text-sm text-brand-500，placeholder)
│   ✗ AgreeRow            (mockup 此处含但 per D3 删除；只保留 footer 隐式同意)
│
├── CTA              (mt-5)
│   └── PrimaryButton      (h-12 rounded-full shadow-cta；loading 变 brand-300 + spinner)
│                          SMS 模式文案 "登录"（per D4，非 mockup 原文 "登录 / 注册"）
│
├── Divider          (mt-6 flex-row gap-3)
│   └── "其他登录方式"    (line-soft 横线 + 中文 11px text-ink-subtle)
│
├── OAuth row        (mt-4 flex-row justify-center gap-6)
│   └── GoogleButton       (w-12 h-12 rounded-full border border-line) — M1.2 仅此一个，per D1
│
├── flex spacer
│
└── Footer
    ├── "还没账号？创建一个"  (text-sm text-ink-muted；"创建一个" text-brand-500 → router.push register)
    └── "登录即表示同意 服务协议 与 隐私政策" (text-[11px] text-ink-subtle；隐式同意，per D3)

✗ TopBar (× / 跳过)        (mockup 顶部含但 per D2 删除整个 TopBar — login 是 auth guard 入口，无上层可关)
```

### Token 映射

bundle className 100% 在 `packages/design-tokens` 内已定义；详 [`./design/handoff.md`](./design/handoff.md) § 4 + § 5.4。**禁** inline `style={{}}` 使用 px / hex（reanimated 的复合 style 例外）。

### 状态视觉转移

| 状态 (spec / hook) | mockup state prop | 视觉变化                                                                                 |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------- |
| idle               | default           | inputs editable / CTA enabled                                                            |
| submitting         | loading           | inputs disabled / opacity-60 / CTA bg-brand-300 + spinner / SMS 模式 countdown inline    |
| error              | error             | input border `border-err` / ErrorRow 出现 / errorToast                                   |
| success            | success           | 切到 SuccessOverlay（SuccessCheck reanimated scale-in + 骨架屏）≤ 800ms → router.replace |

### RN Web 兼容点

| 维度                    | 约束                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| hover / focus 视觉      | 只在 `<Pressable>` 上 fire；`<View>` 上的 hover className 不生效             |
| borderRadius            | 不用 `%` 单位；用 `rounded-{xs,sm,md,lg,full}` Tailwind class                |
| boxShadow               | 用 design-tokens 的 `shadow-card` / `shadow-cta`，不写 `shadow-[...]` 任意值 |
| accessibilityLiveRegion | Android only；iOS / Web 用 `accessibilityRole='alert'`                       |
| KeyboardAvoidingView    | 必须包裹 form 区域；Web 端 noop                                              |

### a11y 落点

每个交互组件必有 `accessibilityLabel`：

- TabSwitcher 两 tab：`accessibilityRole='tab'` + `accessibilityState.selected`
- PhoneInput / SmsInput / PasswordField：`accessibilityLabel='手机号' / '验证码' / '密码'`
- PrimaryButton：`accessibilityRole='button'` + `accessibilityState.disabled` 跟 loading 联动
- GoogleButton / 忘记密码 / 创建一个：分别 `accessibilityLabel='Google 登录' / '忘记密码（即将上线）' / '前往注册'`
- ErrorRow：`accessibilityRole='alert'`（iOS / Web）+ `accessibilityLiveRegion='polite'`（Android）

### 翻译期硬约束（per [`./design/handoff.md`](./design/handoff.md) § 5）

1. `w-18 h-18`（mockup line 100，SuccessCheck 圆圈）→ 替换为 `w-16 h-16` 或 `w-[72px] h-[72px]`（Tailwind 默认 spacing 无 18 档）
2. reanimated v3 装包走 `pnpm exec expo install react-native-reanimated`
3. PhoneInput 的 +86 chevron `▾` 改为静态字符（无下拉，M1.2 大陆唯一，per D7）
4. SMS 模式 CTA 文案改为 "登录"（mockup 原文 "登录 / 注册"，per D4）
5. login.tsx 实施时默认 `mode = 'password'`（mockup `initialMode='sms'` 仅 preview 用，per D5 + spec FR-001）

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

| 风险                                                       | 缓解                                                                                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| mockup 与业务逻辑层假设冲突                                | ✅ resolved：mockup 用双 tab（与 hook 接口一致）；4 处 drift（D1-D4）已落 spec 修订 + 翻译期硬约束（UI 结构段末尾 5 条）   |
| Claude Design 输出的 className 与本仓 design-tokens 不匹配 | ✅ resolved：bundle className 100% 用 token 命名，已 mirror 到 `packages/design-tokens`（per 2026-05-03 commit `3f2cddd`） |
| 60s 倒计时在切 tab / unmount 时未清 timer                  | useLoginForm 内部 useEffect cleanup 必须 clearInterval；单测覆盖                                                           |
