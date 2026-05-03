# Feature Specification: Login Page (M1.2 Phase 4 第一页 — 首页定调)

**Feature Branch**: `feat/account-login-page`
**Created**: 2026-05-03
**Status**: Draft（业务段完整，UI 结构段待 Claude Design mockup 落地后补；详 plan.md）
**Module**: `apps/native/app/(auth)/login`
**Input**: User description: "未登录用户进 app 看到的第一个页面，含密码 / 短信双 tab 登录 + 跳注册 + OAuth/忘记密码占位；定调本仓 design system（间距 / 颜色 / 字号 / 圆角 / a11y / RN Web 兼容）后再开 register / home。"

> 决策约束：
>
> - 后端契约见 [server spec](../../../my-beloved-server/spec/account/login-by-phone-sms/spec.md) + [login-by-password](../../../my-beloved-server/spec/account/login-by-password/spec.md)（已 merged）；本 spec 仅约束前端页面行为，不重复后端契约。
> - 视觉决策（精确 px / hex / 阴影 / 字重值）**不进 spec**，落 plan.md `## UI 结构` 段（mockup → 翻译）。
> - mockup 由 Claude Design（Path B per [ADR-0015](../../../docs/adr/0015-claude-design-from-m1-2.md)）单独产出，落 `apps/native/spec/login/design/`，spec.md 不直接 paste 视觉。

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 已注册用户密码登录（Priority: P1）

已注册老用户回访场景下，默认 tab 是密码登录，输入手机号 + 密码即可进主页。

**Why this priority**: 大陆主流 app 回访默认习惯（per Open Question 4，与 B 站 / 微博一致）；密码登录路径无短信成本，是流量最大的路径。

**Independent Test**: jest + @testing-library/react-native，mock `@nvy/auth.loginByPassword` 返回 `{accountId, accessToken, refreshToken}`，渲染 `<LoginScreen>` → fireEvent 输入手机号 + 密码 → press "登录" → 断言 store.session 已设置 + `router.replace('/(app)/')` 已调用。

**Acceptance Scenarios**:

1. **Given** 用户访问 `/(auth)/login`，**Then** 默认 tab = "密码登录"（per Open Question 4），手机号 + 密码 input 可见，"登录" 按钮初始 disabled（form invalid）
2. **Given** 输入合法手机号 `+8613800138000` + 密码 `Abcdefg1`，**When** "登录" 按钮 enabled 后 press，**Then** state idle → submitting；调 `loginByPassword(phone, password)`；成功后 state success；store.setSession({accountId, accessToken, refreshToken})；`router.replace('/(app)/')`
3. **Given** 用户已登录（store 含 session），**When** 直接访问 `/(auth)/login`，**Then** auth guard middleware 拦截 → `router.replace('/(app)/')`（auth guard 已在 PR #42 落地，本 spec 仅消费）

---

### User Story 2 - 已注册用户短信登录（Priority: P1，并列）

切到短信登录 tab，输入手机号 + 6 位验证码完成登录；验证码通过 `requestSmsCode(phone, purpose='login')` 触发后端发送（per [server login-by-phone-sms spec](../../../my-beloved-server/spec/account/login-by-phone-sms/spec.md) FR-001）。

**Why this priority**: 用户忘记密码或新设备首登场景下唯一可用路径；短信登录是 register 路径的对偶（注册时即可用密码不需要时下次靠短信回访）。

**Independent Test**: jest mock `@nvy/api-client.getAccountApi().requestSmsCode` + `@nvy/auth.loginByPhoneSms`，渲染 → fireEvent 切换 tab 到 "短信登录" → 输入手机号 → press "获取验证码" → 断言 requestSmsCode 调用且 purpose='login' → 输入 6 位码 + press "登录" → 断言 loginByPhoneSms 调用 + store.setSession + router.replace。

**Acceptance Scenarios**:

1. **Given** 在密码登录 tab，**When** press "短信登录" tab，**Then** state idle 不变；errorToast 清空；form 切换为 "手机号 + 获取验证码 + 验证码 + 登录"；之前密码 tab 输入的手机号保留（共享 phone state）
2. **Given** 短信 tab 输入合法手机号，**When** press "获取验证码"，**Then** 调 `requestSmsCode(phone, 'login')`；按钮变 disabled + "60s" 倒计时（`useState<number>` 每秒 -1，0 时复原）；成功不弹 toast（静默成功，per FR-009 防枚举）
3. **Given** 输入合法手机号 + 6 位码，**When** press "登录"，**Then** state submitting → success；store.setSession；router.replace('/(app)/')
4. **Given** 已注册号 + 错码 OR 未注册号 + 任意码，**When** 提交，**Then** 后端返回 `INVALID_CREDENTIALS` (HTTP 401)；前端 errorToast = "手机号或验证码错误"（**不区分**两种场景，per [server FR-011 时延 + 字节级一致防枚举](../../../my-beloved-server/spec/account/login-by-phone-sms/spec.md)）

---

### User Story 3 - 跳转：注册 / OAuth / 忘记密码占位（Priority: P2）

用户从 login 页跳到 register 页；OAuth（微信 / 微博 / Google）+ 忘记密码按钮**存在但 placeholder**，press 后弹"M1.3 上线"toast，避免空 dead-end。

**Why this priority**: M1.2 不实现 OAuth + 密码重置，但 design system 必须为它们留位（mockup 阶段一并定调，避免 M1.3 加入时撞原有布局）。

**Independent Test**: jest mock `expo-router`，渲染 → press "注册" → 断言 `router.push('/(auth)/register')`；press OAuth / 忘记密码占位按钮 → 断言 toast "Coming in M1.3"。

**Acceptance Scenarios**:

1. **Given** login 页任意 tab，**When** press "注册" 按钮，**Then** `router.push('/(auth)/register')`（页面已存在 placeholder，per Phase 2 PR #22）
2. **Given** 任意 tab，**When** press 微信 / 微博 / Google OAuth 占位按钮，**Then** errorToast = "微信/微博/Google 登录 - Coming in M1.3"，state 不变
3. **Given** 密码 tab，**When** press "忘记密码"，**Then** errorToast = "密码重置 - Coming in M1.3"，state 不变

---

### User Story 4 - 边缘：限流 / 网络错 / 401 → refresh 透明（Priority: P2）

后端返回 429 限流 / 5xx / 网络错时给清晰 toast，不静默；access token 过期 401 由 `@nvy/api-client` 拦截器透明 refresh，组件层不感知（per PR #42）。

**Why this priority**: 边缘错误体验差是 D 类 bug 风险源；refresh 透明性是已实现的契约，本 spec 验证消费侧不破坏它。

**Independent Test**: jest mock 各错误码的 `ResponseError`，断言 errorToast 文案 + state error；refresh 透明性走 packages/api-client 已有测试（本 spec 不重复）。

**Acceptance Scenarios**:

1. **Given** 提交 login 时后端返回 429，**When** loginByPassword/Sms 抛 ResponseError(429)，**Then** state error + errorToast = "请求过于频繁，请稍后再试"；submit 按钮重新 enabled
2. **Given** 提交时网络错（fetch 抛 TypeError）或 5xx，**Then** state error + errorToast = "网络异常，请检查网络后重试"；submit 按钮重新 enabled
3. **Given** 切换 tab，**When** errorToast 不为空，**Then** errorToast 清空（避免跨 tab 错误信号污染）

---

## Functional Requirements _(mandatory)_

| ID     | 需求                                                                                                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | 默认 tab = "密码登录"（per Open Question 4）；切换 tab 不丢失 phone state（共享）；切换时 errorToast 清空                                                                                                                                                                               |
| FR-002 | 手机号格式校验：客户端用 zod regex `/^\+861[3-9]\d{9}$/`；不合法 form invalid，submit 按钮 disabled                                                                                                                                                                                     |
| FR-003 | 密码登录调 `@nvy/auth.loginByPassword(phone, password)`；密码无客户端强度校验（强度只在 register 设密时校验，per [server login-by-password FR-006](../../../my-beloved-server/spec/account/login-by-password/spec.md)）；空密码 form invalid                                            |
| FR-004 | 短信登录路径：先 `@nvy/api-client.getAccountApi().requestSmsCode(phone, purpose='login')` → 60s 倒计时 → 用户输入 6 位数字码 → `@nvy/auth.loginByPhoneSms(phone, code)`                                                                                                                 |
| FR-005 | 提交成功后：store.setSession({accountId, accessToken, refreshToken}) → `router.replace('/(app)/')`；不调 `router.push`（避免回退能回到 login 页）                                                                                                                                       |
| FR-006 | 错误统一映射（per `mapApiError` util，详 plan.md）：401 → "手机号或验证码/密码错误"；429 → "请求过于频繁，请稍后再试"；网络错 / 5xx → "网络异常，请检查网络后重试"；未知错 → "登录失败，请稍后再试"；**不区分 401 子码**（INVALID_CREDENTIALS / SMS_FAILED 等）以维持防枚举字节级一致   |
| FR-007 | OAuth (微信 / 微博 / Google) + 忘记密码按钮存在但 placeholder：press 后 toast "Coming in M1.3"；不调任何后端                                                                                                                                                                            |
| FR-008 | "注册" 按钮 → `router.push('/(auth)/register')`                                                                                                                                                                                                                                         |
| FR-009 | 短信"获取验证码"按钮：成功 / 失败均不区分 toast（成功静默 + 60s 倒计时；失败也只 toast "请求过于频繁..." 等通用错，**不暴露**"未注册"或"已注册"信号）                                                                                                                                   |
| FR-010 | 状态机 4 态 idle / submitting / success / error；submitting 期间 submit 按钮 disabled + loading 视觉；success 不展示（立即 router.replace 切走）；error 展示 errorToast；error 状态下任意 input change OR tab 切换清空 errorToast 回 idle                                               |
| FR-011 | 401 → refresh：本页已 mount auth guard middleware（PR #42），未登录态进 `/(app)/*` 自动跳 `/(auth)/login`；本页 access token 过期场景由 `@nvy/api-client.client` 拦截器透明 refresh，不在本 spec 责任范围                                                                               |
| FR-012 | a11y：所有交互 component（tab / input / button / OAuth / 忘记密码 / 注册 / 获取验证码）必有 `accessibilityLabel`；submit 按钮 disabled 时 `accessibilityState.disabled = true`；错误 toast 使用 `accessibilityLiveRegion='polite'`（Android）/ `accessibilityRole='alert'`（iOS / Web） |

---

## Success Criteria _(mandatory)_

| ID     | 标准                                                                                                                  | 测量方式                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| SC-001 | US1-3 全部 happy path 单测通过                                                                                        | `pnpm --filter native test` 全绿                                                                  |
| SC-002 | 防枚举字节级一致：US2.4 场景下 errorToast 文案 / state 转移在"已注册号 + 错码" vs "未注册号 + 任意码"两情况下完全一致 | 单测断言两 case state + errorToast 完全相等（含 string equality）                                 |
| SC-003 | 401 自动 refresh 透明：组件层不感知 access token 过期                                                                 | packages/api-client 已有测试覆盖；本 spec 仅"不破坏"约束                                          |
| SC-004 | 限流场景 (HTTP 429) 提示用户友好且不暴露后端细节                                                                      | 单测 mock 429 → 断言 errorToast 文案 = FR-006 定义                                                |
| SC-005 | a11y：所有交互 component 有 accessibilityLabel + 错误用 alert role                                                    | 手测（浏览器 axe DevTools / iOS VoiceOver）+ ESLint react-native-a11y rule（如启用）              |
| SC-006 | 切换 tab / OAuth placeholder / 忘记密码 placeholder 路径不调任何后端 API                                              | 单测断言 `requestSmsCode` / `loginByPassword` / `loginByPhoneSms` mock 调用次数 = 0               |
| SC-007 | 视觉 token 化 100%：login.tsx + 关联 packages/ui 组件零 hex / px / rgb 字面量                                         | grep `apps/native/app/(auth)/login.tsx` + `packages/ui/src/**` 无 `#[0-9a-f]{3,8}` / `\d+px` 命中 |

---

## Out of Scope（M1.2 显式不做，per [meta plan § 不在本 plan 范围](../../../docs/plans/sdd-github-spec-kit-https-github-com-gi-drifting-rossum.md)）

- 微信 / 微博 / Google OAuth 真实流程（M1.3）
- 忘记密码 / 密码重置（M1.3）
- 二维码扫码登录（M2+ 移动端真机时）
- 多端会话管理（"踢掉其他设备"等）
- iOS / Android 真机渲染验证（M2.1）
- 国际化 / 多语言（M3+）
- spec.md 内的视觉决策（mockup 落地时由 Claude Design 输出 → plan.md UI 段吸收）

---

## Assumptions & Dependencies

- `@nvy/auth.loginByPassword` / `loginByPhoneSms` 已在 PR #42 落地（packages/auth/src/usecases.ts）
- `@nvy/api-client.getAccountApi().requestSmsCode` typed 客户端已在 PR #42 落地（packages/api-client/src/generated/）
- auth guard middleware 已在 PR #42 落地（apps/native/app/\_layout.tsx）
- `expo-router` v6+ + `useRouter().replace()` 可用
- 后端 4 个 endpoint 已在 server PRs #98 / #101 落地
- mockup 由 Claude Design 后续单独产出，落 `apps/native/spec/login/design/mockup-v1.png` + `handoff.md`

---

## Open Questions（已确认 — 2026-05-01 EOD + 2026-05-03 spec 阶段）

| #   | 问                                                        | 决议                                                                                                                             |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 登录页默认 tab？                                          | ✅ 密码登录（per [meta plan § Open Question 4](../../../docs/plans/sdd-github-spec-kit-https-github-com-gi-drifting-rossum.md)） |
| 2   | 切换 tab 时 phone input 是否保留？                        | ✅ 保留（提升 UX，避免重复输入；FR-001）                                                                                         |
| 3   | OAuth / 忘记密码空 dead-end vs placeholder？              | ✅ placeholder + toast "Coming in M1.3"（FR-007，避免空按钮假死）                                                                |
| 4   | 错误码是否区分 INVALID_CREDENTIALS vs SMS_FAILED 等子码？ | ❌ 不区分，统一 401 → "手机号或验证码/密码错误"（防枚举字节级一致，FR-006 + SC-002）                                             |
| 5   | 短信"获取验证码"按钮 disabled 时倒计时显示位置？          | TBD：plan.md UI 段 / mockup 决定                                                                                                 |
