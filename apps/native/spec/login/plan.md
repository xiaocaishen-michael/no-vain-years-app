# Implementation Plan: Login Page (unified phone-SMS auth)

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-04（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md)；2026-05-03 双 tab 版 plan **整体重写**）
**Status**: ✅ Implemented — business + UI 全部落地（PR #50-54）；mockup v2 已 land 到 `design/source-v2/`
**Resolved deps**: server phone-sms-auth spec（#107 docs / #118 impl）merged；packages/api-client 已 `pnpm api:gen:dev` 拉新版（PR #54）；packages/auth `phoneSmsAuth` wrapper 已切真 API；packages/ui 已删 `PasswordField` 并新增 `WechatButton` / `AppleButton` / `LogoMark` / `ErrorRow`

> 历史回合（已全数落地）：
>
> 1. **5-04 上午 PR #49（docs-only）**：spec / plan / tasks 三件套改写，业务段完整 + UI 段 TBD；旧 design/source 标 SUPERSEDED
> 2. **5-04 下午 PR #50-54（impl）**：mockup v2 落地 → packages/ui 改造 → packages/api-client 拉真版 spec → packages/auth 切真 API → 真后端冒烟 happy 已注册 + happy 未注册自动注册两路径过

## 数据流

```text
<LoginScreen>
   │
   ├─ useLoginForm()  (apps/native/lib/hooks/use-login-form.ts) [PR #50 改写]
   │     ├─ form state machine    : idle → requesting_sms → sms_sent → submitting → (success | error)
   │     ├─ requestSms(phone)      ──→ @nvy/api-client.getAccountRegisterApi().requestSmsCode({phone}) [PR #54 删 purpose]
   │     ├─ submit(phone, code)    ──→ @nvy/auth.phoneSmsAuth(phone, code) [PR #54 切到真 getAccountAuthApi().phoneSmsAuth()]
   │     ├─ smsCountdown 60s       : useState<number> + useRef<setInterval>
   │     ├─ showPlaceholderToast(feature) : 'wechat' | 'google' | 'apple' | 'guest' | 'help'
   │     └─ navigation             : success → store.setSession (内部); AuthGate 自动 redirect (hook 不直调 router)
   │
   ├─ phone-sms-auth schema (apps/native/lib/validation/login.ts) [PR #50 改写：删 loginPasswordSchema + loginSmsSchema，新增单 phoneSmsAuthSchema]
   │     ├─ phoneSmsAuthSchema     : z.object({ phone: z.string().regex(PHONE_RE), smsCode: z.string().regex(/^\d{6}$/) })
   │     └─ mapApiError(e)          : (FetchError | ResponseError | ApiClientError | TypeError | unknown) → { kind, toast }
   │
   └─ UI 渲染（mockup v2 已落地，PR #51 className 1:1 paste；PR #52 SVG 升级）
         ├─ <LogoMark>          : ✅ 保留（PR #52 升级真 SVG，react-native-svg）
         ├─ <PhoneInput>        : ✅ 保留
         ├─ <SmsInput>          : ✅ 保留（含 60s 倒计时内联）
         ├─ <PrimaryButton>     : ✅ 保留（CTA "登录"，文案不变）
         ├─ <SuccessCheck>      : ✅ 保留
         ├─ <Spinner>           : ✅ 保留
         ├─ <ErrorRow>          : ✅ 保留（PR #51 改写）
         ├─ <SuccessOverlay>    : ✅ 保留（含 SuccessCheck + 骨架屏过渡）
         ├─ <GoogleButton>      : ✅ 保留（M1.3 placeholder → 真接入）
         ├─ <WechatButton>      : ✅ 新增 packages/ui（PR #51 + #52 真 SVG）
         ├─ <AppleButton>       : ✅ 新增 packages/ui（PR #51；iOS-only conditional 在 caller 端）
         ├─ <PasswordField>     : ✅ 删除（PR #50）
         └─ <TabSwitcher>       : ✅ 删除（PR #50）
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

**新增依赖（已落地）**：

| 来源                                                              | 用法                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `@nvy/auth.phoneSmsAuth(phone, code)`                             | 新 wrapper，替换 `loginByPassword` + `loginByPhoneSms`（PR #50 过渡 → PR #54 切真 API）                |
| `@nvy/api-client.getAccountAuthApi().phoneSmsAuth({...})`         | server PR #118 merged 后 PR #54 跑 `pnpm api:gen:dev` 自动生成（含 `AccountAuthControllerApi` + DTOs） |
| `@nvy/api-client.getAccountRegisterApi().requestSmsCode({phone})` | PR #54 删 `purpose` 字段（per server FR-004 单 Template A）                                            |

**删除的依赖（已清理）**：

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

## UI 结构（mockup v2 driven，2026-05-04 落地）

参考源码：[`./design/source-v2/LoginScreen.tsx`](./design/source-v2/LoginScreen.tsx) + [`./design/handoff.md`](./design/handoff.md)。v1 mockup 已 SUPERSEDED 留档。

### 布局

单列移动端，container `flex-1 bg-surface px-lg pb-lg`；mockup 测试宽度 360px。无栅格 / 无 desktop 适配（M1.2 mobile + RN Web 出 web bundle）。

### 区域分块

```text
LoginScreen (flex-1 bg-surface px-lg pb-lg)
├── TopBar              (h-11 px-1 flex-row items-center)
│   └── close × button  (text-2xl text-ink — close 按钮，per FR-008 / mockup v2 drift)
│
├── Header              (mt-3 items-center gap-2)
│   ├── LogoMark            (Svg 56x56，brand-500 圆角矩形 + 12 道光线 + 橙色 sun)
│   ├── h1: "欢迎回来"      (text-3xl font-bold text-ink mt-3.5 tracking-tight text-center)
│   └── subtitle           "把这一段日子，过得不虚此生。"  (text-sm text-ink-muted text-center)
│
├── Form                (mt-9 gap-3)
│   ├── PhoneInput          (h-12 border-b；+86 prefix + ▾ chevron 静态 + 1px 分隔 + TextInput)
│   ├── SmsInput            (h-12 border-b；TextInput + 右侧 send-code 按钮三态)
│   └── ErrorRow            (errorScope 决定哪个 input 旁渲染 + 文案由 mapApiError 提供)
│
├── CTA                 (mt-7)
│   └── PrimaryButton       (h-12 rounded-full shadow-cta；CTA 文案 "登录"，per FR-001)
│       状态：
│         disabled  → bg-brand-200
│         loading   → bg-brand-300 + Spinner(white) + "登录中…"
│         enabled   → bg-brand-500 active:bg-brand-600 + "登录"
│
├── flex spacer
│
├── Divider             (mt-6 flex-row items-center gap-3)
│   └── "其他登录方式"     (h-px bg-line-soft 横线 + text-[11px] text-ink-subtle 中文)
│
├── OAuth row           (mt-4 flex-row justify-center gap-10)
│   ├── WechatButton        (w-12 h-12 rounded-full bg-[#07C160] + WeChat svg glyph + "微信" label)
│   ├── GoogleButton        (w-12 h-12 rounded-full bg-surface border border-line + "G" + "Google" label)
│   └── AppleButton         (w-12 h-12 rounded-full bg-ink + Apple unicode  + "Apple" label)
│                           **caller 层 Platform.OS === 'ios' conditional render** (per FR-007)
│
├── Help link           (items-center mt-5)
│   └── "登录遇到问题"     (text-xs text-ink-muted；placeholder per FR-009)
│
└── Implicit consent    (text-center text-[11px] text-ink-subtle mt-3)
    └── "登录即表示同意 《服务条款》 与 《隐私政策》"  (隐式同意，per FR-001 + ADR-0016 决策 4)
```

### 状态视觉转移（5 + success + error 共 7 种渲染态）

| 状态 (hook)      | 视觉变化                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `idle`           | inputs editable / CTA disabled (bg-brand-200) / SmsInput 右侧 "获取验证码"                                      |
| `requesting_sms` | inputs disabled opacity-60 / CTA disabled / SmsInput 右侧 "发送中…" + Spinner(muted)                            |
| `sms_sent`       | inputs editable / CTA enabled (form valid 时) / SmsInput 右侧 "{N}s 后重发" 倒计时                              |
| `submitting`     | inputs disabled / CTA bg-brand-300 + Spinner(white) + "登录中…"                                                 |
| `error`          | errorScope 决定 PhoneInput 或 SmsInput border-err + ErrorRow 渲染对应 input 旁                                  |
| `success`        | 切到 `<SuccessOverlay>`（SuccessCheck reanimated scale-in + 骨架屏，per FR-011） → AuthGate 自动 router.replace |

### Token 映射

bundle className 100% 在 `packages/design-tokens` 内已定义；详 [`./design/handoff.md`](./design/handoff.md) § 4。**禁** inline `style={{}}` 使用 px / hex（reanimated 的复合 style 例外）。

**唯一 ad-hoc 任意值**：`bg-[#07C160]`（微信品牌绿）— 仅 WechatButton 内部使用，不进 design-tokens（品牌色 literal，非 design system token）。

### a11y 落点

每个交互组件必有 `accessibilityLabel`：

- TopBar close button：`accessibilityLabel='关闭'`
- PhoneInput / SmsInput：`accessibilityLabel='手机号' / '验证码'`
- PrimaryButton：`accessibilityRole='button'` + `accessibilityState.disabled` 跟 loading 联动
- WechatButton / GoogleButton / AppleButton：`accessibilityLabel='微信登录（即将上线）' / 'Google 登录（即将上线）' / 'Apple 登录（即将上线）'`
- ErrorRow：`accessibilityRole='alert'`（iOS / Web）+ `accessibilityLiveRegion='polite'`（Android）
- 帮助 link：`accessibilityRole='link'` + `accessibilityLabel='登录遇到问题（即将上线）'`

### 翻译期硬约束（per [`./design/handoff.md`](./design/handoff.md) § 5）

1. `w-18 h-18`（mockup line 71，SuccessCheck 圆圈）→ 替换为 `w-[72px] h-[72px]`（Tailwind 默认 spacing 无 18 档）
2. CTA 文案改为 `"登录"`（mockup v2 line 354 写 `"登录 / 注册"` 违反 ADR-0016 决策 4 negative constraint，drift 修订）
3. 协议同意 `《服务条款》《隐私政策》` 中间补 "与" 字
4. `useCountdown` 不抽出来 — 用 useLoginForm hook 已暴露的 `smsCountdown`
5. `errorScope` 由 hook 提供（'sms' | 'submit' | null），LoginScreen 接 hook 而非 caller 控制
6. AppleButton iOS-only conditional render 在 caller 层（login.tsx），不下沉 packages/ui
7. `bg-[#07C160]` 仅 WechatButton 内部 ad-hoc 任意值，其他不允许任意值

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

| 层             | 工具                                              | 覆盖范围                                                                                                                         | 状态                                                                    |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 单测（schema） | vitest                                            | `phoneSmsAuthSchema` 正负 case + `mapApiError` 各错误类型映射（含 FetchError per 昨日 PR #48）                                   | ✅（PR #50）                                                            |
| 单测（hook）   | vitest + @testing-library/react                   | `useLoginForm` 5 状态机 transition + smsCountdown + 反枚举一致响应（client 视角 happy 已注册 vs 未注册无感）+ placeholder toasts | ✅（PR #50；PR #54 删 purpose 字段对应断言）                            |
| 组件测         | @testing-library/react-native                     | packages/ui 各组件 render + onPress mock                                                                                         | ✅（PR #51 / #52 随组件落地）                                           |
| E2E            | Playwright runtime-debug.mjs（headless Chromium） | 真后端冒烟 — happy 已注册 / happy 未注册自动注册                                                                                 | ✅（PR #53 截图归档约定 + #54 phase 4 两路径过；归档于 runtime-debug/） |

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

## 风险 + 缓解（落地后回顾）

| 风险                                                      | 实际处置                                                                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 旧 PR #48 落地的 PasswordField / TabSwitcher 删除时撞依赖 | PR #50 顺序：先删 login.tsx 中的引用 → 再删 packages/ui 组件文件 → 跑全包 typecheck/test 验证 — 0 dead import                                               |
| 新 mockup vs 旧 v1 visual tokens drift                    | mockup v2 prompt 显式声明 "复用 v1 design-tokens 命名"，PR #51 落地时记录了 4 处 drift fix 到 `design/handoff.md`                                           |
| `pnpm api:gen` 拉新 spec 后旧 client class import 报错    | 实际顺序（PR #54）：server #118 merged → `pnpm api:gen:dev` → 删 packages/auth 旧 wrapper 调用 + 切到 `getAccountAuthApi().phoneSmsAuth()` → typecheck 全绿 |
