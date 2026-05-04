# Implementation Plan: Login Page (unified phone-SMS auth)

**Branch**: `docs/login-spec-rewrite-adr-0016`
**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-04（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md)；2026-05-03 双 tab 版 plan **整体重写**）
**Status**: Business 段完整；UI 结构段 TBD（等 user 单独跑 Claude Design 出新版 mockup，per `docs/experience/claude-design-handoff.md` § 2.1b 合一页 prompt 模板）
**Depends**: server PR-B（phone-sms-auth spec 落地）→ M1.3 impl PR（packages/api-client 重新 gen + packages/auth 加 phoneSmsAuth wrapper + packages/ui 删 PasswordField）

> 本 plan 切成两个回合：
>
> 1. **本次（5-04 docs-only）**：spec / plan / tasks 三件套改写，业务段完整 + UI 段 TBD；旧 design/source 标 SUPERSEDED
> 2. **下次（mockup 落地后 + server impl 后）**：吸收新版 mockup 决策回填 UI 结构段；packages/ui 删 PasswordField + 加 WechatButton + AppleButton；className 1:1 paste mockup → tasks T4-Tn

## 数据流

```text
<LoginScreen>
   │
   ├─ usePhoneSmsAuthForm()  (apps/native/lib/hooks/use-phone-sms-auth-form.ts) [改写自 use-login-form.ts]
   │     ├─ form state machine    : idle → requesting_sms → sms_sent → submitting → (success | error)
   │     ├─ requestSms(phone)      ──→ @nvy/api-client.getAccountSmsCodeApi().requestSmsCode({phone}) [无 purpose]
   │     ├─ submit(phone, code)    ──→ @nvy/auth.phoneSmsAuth(phone, code) [新 wrapper，M1.3 impl 加]
   │     ├─ smsCountdown 60s       : useState<number> + useRef<setInterval>
   │     ├─ showPlaceholderToast(feature) : 'wechat' | 'google' | 'apple' | 'guest' | 'help'
   │     └─ navigation             : success → store.setSession (内部); AuthGate 自动 redirect (hook 不直调 router)
   │
   ├─ phone-sms-auth schema (apps/native/lib/validation/login.ts) [改写：删 loginPasswordSchema + loginSmsSchema，新增单 phoneSmsAuthSchema]
   │     ├─ phoneSmsAuthSchema     : z.object({ phone: z.string().regex(PHONE_RE), smsCode: z.string().regex(/^\d{6}$/) })
   │     └─ mapApiError(e)          : (FetchError | ResponseError | ApiClientError | TypeError | unknown) → { kind, toast }
   │
   └─ UI 渲染（mockup-driven，TBD：等 Claude Design v2 合一页 mockup 落地）
         ├─ <LogoMark>          : 保留 (PR #48 落地)
         ├─ <PhoneInput>        : 保留
         ├─ <SmsInput>          : 保留（含 60s 倒计时内联）
         ├─ <PrimaryButton>     : 保留（CTA "登录"，文案不变）
         ├─ <SuccessCheck>      : 保留
         ├─ <Spinner>           : 保留
         ├─ <ErrorRow>          : 保留
         ├─ <SuccessOverlay>    : 保留（含 SuccessCheck + 骨架屏过渡）
         ├─ <GoogleButton>      : 保留（M1.3 impl placeholder → 真接入）
         ├─ <WechatButton>      : ⭐ M1.3 新增（packages/ui）
         ├─ <AppleButton>       : ⭐ M1.3 新增（iOS-only conditional render 在 caller 端做）
         ├─ <PasswordField>     : 🔴 M1.3 删除（per ADR-0016 决策 2）
         └─ <TabSwitcher>       : 🔴 M1.3 评估改名 OAuthSelector 或删（per ADR-0016 Migration 表）
```

## 状态机

```text
idle
  │ requestSms(phone) called + phone valid
  ▼
requesting_sms
  │     ├─ api success → smsCountdown=60 → state sms_sent
  │     │
  │     └─ api throws → mapApiError → setErrorToast → state error
  ▼
sms_sent
  │ submit(phone, code) called + form valid
  ▼
submitting
  │     ├─ api success → @nvy/auth internal setSession; state success
  │     │                                                  │
  │     │                                                  ▼
  │     │                                             success (AuthGate 监测 isAuthenticated → router.replace('/(app)/'))
  │     │
  │     └─ api throws → mapApiError → setErrorToast
  │                                                        │
  │                                                        ▼
  │                                                      error
  │                                                        │ user changes input
  │                                                        ▼
  └────────────────────────────────────────────────── idle / sms_sent (errorToast cleared)
                                                            (state 回 sms_sent 如 smsCountdown > 0；否则回 idle)
```

**关键不变性**（per spec FR-006 + SC-002 反枚举字节级一致）：

- 401 路径**不区分**子码（server 4 分支已字节级一致返回 401，client 仅看 401 状态返回统一 toast）
- 已注册 happy vs 未注册 happy 的 client state 转移完全相同（client 无 phone-existed 分支）

## 错误映射（mapApiError 契约）

| 输入                                                                              | output.kind    | output.toast                                                   |
| --------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------- |
| `ResponseError` w/ status 401                                                     | `'invalid'`    | `'手机号或验证码错误'`                                         |
| `ResponseError` w/ status 429                                                     | `'rate_limit'` | `'请求过于频繁，请稍后再试'`                                   |
| `ResponseError` w/ status 5xx                                                     | `'network'`    | `'网络异常，请检查网络后重试'`                                 |
| `ResponseError` w/ status 400                                                     | `'invalid'`    | `'手机号或验证码错误'`（form validation 已先拦下，此分支兜底） |
| `FetchError`（@nvy/api-client 包装的网络错，cause = TypeError；昨日 PR #48 修复） | `'network'`    | `'网络异常，请检查网络后重试'`                                 |
| `TypeError`（裸网络错，旧路径兼容）                                               | `'network'`    | `'网络异常，请检查网络后重试'`                                 |
| `ApiClientError`（generic wrapper）                                               | `'unknown'`    | `'登录失败，请稍后再试'`                                       |
| 其他 / unknown                                                                    | `'unknown'`    | `'登录失败，请稍后再试'`                                       |

**删除的错误码**（旧 spec 含，新模式废）：

- `'invalid'` 文案不再含 "密码" 字样（"手机号或验证码/密码错误" → "手机号或验证码错误"）
- 不再有 `INVALID_CREDENTIALS` / `WEAK_PASSWORD` / `PHONE_ALREADY_REGISTERED` 子码区分

## 复用既有代码

| 来源                                                              | 用法                                              | M1.2 状态                                   |
| ----------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `@nvy/auth.useAuthStore`（Zustand store + persist）               | store.setSession 由 phoneSmsAuth wrapper 内部调用 | 🟢 不变                                     |
| `@nvy/api-client.ResponseError` / `FetchError` / `ApiClientError` | mapApiError 入参类型                              | 🟢 不变（昨日 PR #48 已 export FetchError） |
| `expo-router.useRouter()`                                         | router.replace（实际由 AuthGate 调，hook 不直调） | 🟢 不变                                     |
| AuthGate middleware（apps/native/app/\_layout.tsx，PR #48）       | 已 mount 全局                                     | 🟢 不变                                     |
| React Hook Form + zod resolver                                    | form 管理                                         | 🟢 不变（packages.json 已含）               |
| `react-native.Platform`                                           | Apple Android conditional render（per FR-007）    | 🟢 标准 RN API                              |

**新增依赖（M1.3 impl 时落地）**：

| 来源                                                        | 用法                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `@nvy/auth.phoneSmsAuth(phone, code)`                       | 新 wrapper，替换 `loginByPassword` + `loginByPhoneSms`；packages/auth M1.3 impl PR 加 |
| `@nvy/api-client.AccountSmsCodeApi.requestSmsCode({phone})` | 通过 `pnpm api:gen:dev` 拉 server 新 spec 自动生成（server PR-B merged 后）           |

**删除的依赖（M1.3 impl 时清理）**：

- `@nvy/auth.loginByPassword` / `loginByPhoneSms` → 被 `phoneSmsAuth` 取代（删旧 wrapper）
- `@nvy/api-client.AccountRegisterControllerApi`（包含旧 `requestSmsCode(phone, purpose)` 定义）→ generator 自动删
- `@nvy/api-client.AuthControllerApi`（包含 `loginByPhoneSms` / `loginByPassword`）→ generator 自动删

## RN Web 兼容点（per [`.claude/nativewind-mapping.md`](../../../.claude/nativewind-mapping.md) 已知 gotcha）

| 维度                           | 约束                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| hover / focus 视觉             | 只在 `<Pressable>` 上 fire；`<View>` 上的 hover className 不生效                                 |
| borderRadius                   | 不用 `%` 单位（RN Web 报 warning）；用 `rounded-{xs,sm,md,lg,full}` Tailwind class               |
| boxShadow                      | 用 design-tokens 定义的 shadow class（`shadow-card` / `shadow-cta`），不写 `shadow-[...]` 任意值 |
| accessibilityLiveRegion        | Android only；iOS / Web 用 `accessibilityRole='alert'`                                           |
| KeyboardAvoidingView           | 必须包裹 form 区域，避免 iOS 软键盘遮 input；Web 端无影响（noop）                                |
| Platform.OS conditional render | Apple Button 在 caller 层（login.tsx）用 `Platform.OS === 'ios'` 判，不下沉到 packages/ui        |

## UI 结构

> **TBD**：等新版 Claude Design mockup 落地（参见 `apps/native/spec/login/design/`）。
>
> 旧 v1 mockup（双 tab + password / sms 切换）已 SUPERSEDED；新版 mockup 须重做（per `docs/experience/claude-design-handoff.md` § 2.1b 合一页 prompt 模板）。
>
> 新 mockup 必含元素（per spec FR-001 / FR-007 / FR-008 / FR-009）：
>
> - 顶部：右上 "立即体验" 游客模式占位 link（M1.2 不实施，仅 UI 占位）
> - 中央：项目 logo + 副标题
> - 单 form 容器（无 tab）：
>   - PhoneInput（+86 静态 prefix + 手机号输入）
>   - SmsInput（6 位数字 + 60s 倒计时内联 "获取验证码" → "{N}s 后重发"）
>   - PrimaryButton（CTA 文案 "登录"）
> - Divider "其他登录方式"
> - 三方 OAuth 横排（圆形 icon-only）：
>   - 微信（绿色，全平台）
>   - Google（多彩 G，全平台）
>   - Apple（黑色，**iOS-only conditional render**）
> - 底部：
>   - "登录即表示同意《服务条款》《隐私政策》"（隐式同意，不需 checkbox）
>   - "登录遇到问题" link（M1.2 不实施，仅 UI 占位）
>
> mockup 落地后回本段 + 由 `UI UX Pro Max` skill 跑一遍 review 再 commit。

**禁入**（per `docs/experience/claude-design-handoff.md` § 2.1b）：

- ❌ "注册" 字样（任何位置）
- ❌ "还没账号？" / "立即注册" / "新用户注册" 引导文案
- ❌ 密码输入框
- ❌ 邮箱输入框
- ❌ "忘记密码" 链接
- ❌ tab / segmented control 切换登录方式
- ❌ "中国移动 / 联通 / 电信 提供认证服务" 运营商 SDK 文案

## Token 映射

复用既有 `packages/design-tokens`（PR #48 落地，from v1 mockup）：brand-{50..900} / brand-soft / accent / ink / line / surface / ok / warn / err；spacing xs/sm/md/lg/xl/2xl/3xl；radius xs/sm/md/lg/full；shadow card/cta；font sans (Inter + Noto Sans SC + PingFang)。

新 v2 mockup 不引入新 token（视觉语言保持 v1 baseline；改的仅是 layout / 区域结构）。

## 测试策略

| 层             | 工具                                                         | 覆盖范围                                                                                            |
| -------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 单测（schema） | vitest + jest                                                | `phoneSmsAuthSchema` 正负 case + `mapApiError` 各错误类型映射（含 FetchError per 昨日 PR #48）      |
| 单测（hook）   | vitest + @testing-library/react                              | `usePhoneSmsAuthForm` 5 状态机所有 transition + smsCountdown + 反枚举一致响应 + placeholder toasts  |
| 组件测（TBD）  | @testing-library/react-native                                | login.tsx 渲染 + Platform.OS Apple conditional + form 提交（mockup 落地后补 packages/ui 组件测）    |
| E2E（TBD）     | 手测（expo dev server 浏览器）+ Playwright runtime-debug.mjs | 完整 4 状态截图（happy / 401 / 429 / network） — per `docs/experience/claude-design-handoff.md` § 6 |

**本次 docs PR 不覆盖**：组件测 + E2E（等 mockup + impl 落地后下一 PR）。

## Constitution / 边界 Check

- ✅ phone-sms-auth 单 endpoint（无 client 端 phone 已注册预查）— 反枚举设计哲学一致
- ✅ Hook 不感知 register/login 区分（client 视角 SC-002）
- ✅ Apple Android conditional render 在 caller（login.tsx），不下沉 packages/ui
- ✅ 视觉决策不进 spec.md，落 plan.md UI 结构段 + design/handoff.md
- ✅ 不引入 ad-hoc 视觉 token（hex / px / rgb 字面量），SC-007 grep 守

## 反模式（明确避免）

- ❌ Hook 内部根据 phone 是否已注册选不同流程（违反 unified 设计哲学）
- ❌ Client 调"phone 已注册查询"接口（暴露反枚举信号）
- ❌ Apple Button 组件在 packages/ui 内部做 Platform.OS 判（应该跨端可渲染，conditional 由 caller 决定）
- ❌ 删 packages/ui PasswordField 但保留 import（dead import）
- ❌ 写 `Platform.OS === 'ios' ? <AppleButton /> : null` 时把整个 OAuth row container 一起 conditional（应只对 Apple 单按钮 conditional）

## 风险 + 缓解

| 风险                                                                      | 缓解                                                                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 旧 PR #48 落地的 PasswordField / TabSwitcher 在 M1.3 impl PR 删除时撞依赖 | M1.3 PR 计划：先删 login.tsx 中的引用 → 再删 packages/ui 组件文件 → 跑全包 typecheck/test 验证（per memory `feedback_repo_wide_scan_on_rename.md`） |
| 新 mockup vs 旧 v1 visual tokens drift                                    | 新 mockup prompt 显式声明 "复用 v1 design-tokens 命名"（per `claude-design-handoff.md` § 2.1b）                                                     |
| `pnpm api:gen` 拉新 spec 后旧 client class import 报错                    | M1.3 impl PR 顺序：先 server PR-B merged → 在 app 仓 `pnpm api:gen:dev` → 删 packages/auth 旧 wrapper + login.tsx 旧 import → 加新 wrapper          |
