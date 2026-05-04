# Feature Specification: Login Page (M1.2 Phase 4 — unified phone-SMS auth 单页)

**Feature Branch**: `docs/login-spec-rewrite-adr-0016`
**Created**: 2026-05-04（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md)；2026-05-03 双 tab 版 spec **整体重写**，旧版 design/source mockup 标 SUPERSEDED）
**Status**: Draft（pending impl，docs-only PR；mockup 待 user 单独跑 Claude Design 重做）
**Module**: `apps/native/app/(auth)/login`
**Input**: User description: "参考大陆主流 app（网易云音乐 / 小红书 / 拼多多）登录注册合一交互；用户视角不存在'注册'，单 form 输入手机号 + SMS code 一键登录；server 自动判已注册→login / 未注册→自动创建+login。"

> 决策约束：
>
> - 后端契约见 [server spec/account/phone-sms-auth/spec.md](../../../../my-beloved-server/spec/account/phone-sms-auth/spec.md)（同 PR cycle 落地）；本 spec 仅约束前端页面行为
> - 视觉决策（精确 px / hex / 阴影 / 字重值）**不进 spec**，落 plan.md `## UI 结构` 段（mockup → 翻译）
> - 新版 mockup 由 Claude Design 单独产出（按 [`docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 2.1b 合一页 prompt 模板），落 `apps/native/spec/login/design/`；spec.md 不直接 paste 视觉
> - **路径不变**：`apps/native/spec/login/`（用户视角即"登录"，per ADR-0016 决策 1 — 无 register 心智）；`app/(auth)/login.tsx` route 不变

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 已注册用户单 form 登录（Priority: P1）

已注册大陆手机号用户回访场景下，输入手机号 + 6 位 SMS 码即可一气呵成进主页。

**Why this priority**: 主路径，所有已注册用户的回访入口；用户视角与 User Story 2 不可区分。

**Independent Test**: vitest + jest mock `@nvy/auth.phoneSmsAuth` 返回 `{accountId, accessToken, refreshToken}`，渲染 `<LoginScreen>` → fireEvent 输入手机号 → press "获取验证码" → 输入 6 位码 → press "登录" → 断言 store.session 已设置 + AuthGate 自动 redirect 到 `/(app)/`。

**Acceptance Scenarios**:

1. **Given** 用户访问 `/(auth)/login`，**Then** 页面单 form 渲染（无 tab，无密码字段）；手机号 input 可见；submit "登录" 按钮初始 disabled（form invalid）
2. **Given** 输入合法手机号 `+8613800138000`，**When** press "获取验证码"，**Then** 调 `requestSmsCode(phone)`（无 purpose 字段，per server spec FR-004）；按钮 disabled + 60s 倒计时
3. **Given** 输入合法手机号 + 6 位码 `123456`，**When** press "登录"，**Then** state idle → submitting；调 `phoneSmsAuth(phone, code)`；成功后 state success；store.setSession({accountId, accessToken, refreshToken}); AuthGate 监听 isAuthenticated 自动 router.replace `/(app)/`
4. **Given** 用户已登录（store 含 session），**When** 直接访问 `/(auth)/login`，**Then** AuthGate 拦截 → router.replace `/(app)/`（PR #48 已落地，本 spec 仅消费）

---

### User Story 2 — 未注册用户首次到访（client 视角不可区分）（Priority: P1，并列）

未注册大陆手机号用户首次到访，**操作路径与 User Story 1 完全相同** —— 输入手机号 + SMS 码 → 一气呵成进主页。client 不感知"创建账号"动作；server 自动创建 ACTIVE account（per [ADR-0016 决策 1](../../../../docs/adr/0016-unified-mobile-first-auth.md) + server phone-sms-auth FR-005）。

**Why this priority**: 大陆主流 UX 核心 — 用户无注册心智负担；与 User Story 1 字节级一致响应保证防枚举。

**Independent Test**: 同 User Story 1（client 代码无分支，从 client 视角看不出"已注册"vs"未注册"）；后端集成测试由 server spec SingleEndpointEnumerationDefenseIT 覆盖。

**Acceptance Scenarios**: 与 User Story 1 完全相同（FR-001 ~ FR-005 全适用）；client 端无需任何特殊处理。

---

### User Story 3 — 三方 OAuth + 立即体验 占位（Priority: P2）

底部三方 OAuth 按钮（微信 / Google / Apple iOS-only） + 顶部"立即体验"游客模式占位 + "登录遇到问题"帮助链接占位 — **存在但 placeholder**，press 后弹"Coming in M1.3"toast，避免空 dead-end。

**Why this priority**: M1.2 不实施真实 OAuth + 游客模式，但 design system 必须为它们留位（mockup 阶段一并定调，避免 M1.3 加入时撞原有布局）。Apple 在 Android 端**不渲染**（Platform.OS conditional render）。

**Independent Test**: jest mock `expo-router` + Platform.OS，渲染 → press 各 placeholder 按钮 → 断言 toast "Coming in M1.3"；Android 端 mock Platform.OS 为 "android" → 断言 Apple 按钮不出现在 DOM。

**Acceptance Scenarios**:

1. **Given** login 页 iOS / Web 端，**When** press 微信 / Google / Apple 圆形按钮，**Then** errorToast = "<provider> 登录 - Coming in M1.3"，state 不变，无任何 API 调用
2. **Given** login 页 Android 端，**Then** Apple 按钮不渲染（Platform.OS === 'android' 条件）；微信 / Google 按钮仍渲染
3. **Given** login 页任意端，**When** press 顶部 "立即体验" link，**Then** errorToast = "游客模式 - Coming in M2"，state 不变
4. **Given** login 页任意端，**When** press 底部 "登录遇到问题" link，**Then** errorToast = "帮助中心 - Coming in M1.3"，state 不变

---

### User Story 4 — 边缘：限流 / 网络错 / 401 refresh 透明（Priority: P2）

后端返回 429 限流 / 5xx / 网络错时给清晰 toast，不静默；access token 过期 401 由 `@nvy/api-client` 拦截器透明 refresh，组件层不感知（per PR #48）。

**Why this priority**: 边缘错误体验差是 D 类 bug 风险源；refresh 透明性是已实现的契约，本 spec 验证消费侧不破坏它。

**Independent Test**: vitest mock 各错误码的 `ResponseError` / `FetchError`（per 昨日 PR #48 落地的错误类型），断言 errorToast 文案 + state error；refresh 透明性走 packages/api-client 已有测试（本 spec 不重复）。

**Acceptance Scenarios**:

1. **Given** 提交 phoneSmsAuth 时后端返回 429，**Then** state error + errorToast = "请求过于频繁，请稍后再试"；submit 按钮重新 enabled
2. **Given** 提交时网络错（fetch 抛 `FetchError` per @nvy/api-client，cause = TypeError）或 5xx，**Then** state error + errorToast = "网络异常，请检查网络后重试"；submit 按钮重新 enabled
3. **Given** 已注册号 + 错码 OR 未注册号 + 任意码 OR FROZEN/ANONYMIZED 账号 + 任意码，**When** 提交，**Then** 后端返回 `INVALID_CREDENTIALS` (HTTP 401)；前端 errorToast = "手机号或验证码错误"（**不区分** 4 种 server 分支，per server SC-003 反枚举字节级一致）
4. **Given** 错误状态下，**When** 用户 input change，**Then** errorToast 清空；state 回 idle

---

## Functional Requirements _(mandatory)_

| ID     | 需求                                                                                                                                                                                                                                                                                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | 单 form 容器（**无 tab**，无密码 / SMS 切换）；用户操作路径单一：phone → SMS code → submit                                                                                                                                                                                                                                                                     |
| FR-002 | 手机号格式校验：客户端用 zod regex `/^\+861[3-9]\d{9}$/`；不合法 form invalid，submit 按钮 disabled；不区分大小写空格（trim 处理）                                                                                                                                                                                                                             |
| FR-003 | submit 调 `@nvy/auth.phoneSmsAuth(phone, code)`（M1.3 impl 时 packages/auth 加该 wrapper，**替换** 既有 `loginByPassword` / `loginByPhoneSms`）；server 自动判 login/register（per server phone-sms-auth FR-005）                                                                                                                                              |
| FR-004 | SMS 触发：调 `@nvy/api-client.AccountSmsCodeApi.requestSmsCode({phone})` （**无 purpose 字段**，per server phone-sms-auth FR-004）；60s 倒计时锁按钮防重复点击                                                                                                                                                                                                 |
| FR-005 | submit 成功后：`@nvy/auth.phoneSmsAuth` 内部调 `store.setSession({accountId, accessToken, refreshToken})`；`AuthGate` (apps/native/app/\_layout.tsx) 监听 `isAuthenticated` 自动 `router.replace('/(app)/')`。Hook **不直调** router                                                                                                                           |
| FR-006 | 错误统一映射（per `mapApiError` util，已含 `FetchError` 检查per 昨日 PR #48 修复）：401 → "手机号或验证码错误"；429 → "请求过于频繁，请稍后再试"；FetchError / TypeError / 5xx → "网络异常，请检查网络后重试"；未知错 → "登录失败，请稍后再试"；**不区分 401 子码**（server 单接口 4 分支字节级一致，client 仅看 401 状态）                                    |
| FR-007 | 三方 OAuth 圆形按钮 placeholder：press 弹 toast "<provider> 登录 - Coming in M1.3"；不调任何后端：<br>- 微信（绿色）：iOS / Android / Web 全平台渲染<br>- Google（多彩 G）：iOS / Android / Web 全平台渲染<br>- Apple（黑色苹果）：**iOS only**（`Platform.OS === 'ios'` 条件，per [ADR-0016 决策 4](../../../../docs/adr/0016-unified-mobile-first-auth.md)） |
| FR-008 | 顶部 close `×` 按钮（per mockup v2，2026-05-04 落地）：press 时 router.back（如有 history） / 否则 noop。**原 "立即体验" 游客模式占位已废**（mockup 落地反向修订；游客模式 M2 评估时再决定 UI 入口位置）                                                                                                                                                       |
| FR-009 | 底部 "登录遇到问题" placeholder：press 弹 toast "帮助中心 - Coming in M1.3"；不调后端                                                                                                                                                                                                                                                                          |
| FR-010 | SMS "获取验证码" 按钮：成功 / 失败均不区分 toast（成功静默 + 60s 倒计时；失败也只 toast 通用错，**不暴露**"未注册"或"已注册"信号）                                                                                                                                                                                                                             |
| FR-011 | 状态机 5 态 idle / requesting_sms / sms_sent / submitting / (success \| error)；submitting 期间 submit 按钮 disabled + loading 视觉；success 短动画 ≤ 800ms（绿色对勾 reanimated scale-in）后 AuthGate 接管切走；error 展示 errorToast；error 状态下任意 input change 清空 errorToast 回 idle                                                                  |
| FR-012 | 401 → refresh：本页已 mount AuthGate（PR #48），未登录态进 `/(app)/*` 自动跳 `/(auth)/login`；access token 过期场景由 `@nvy/api-client.client` 拦截器透明 refresh，不在本 spec 责任范围                                                                                                                                                                        |
| FR-013 | a11y：所有交互 component（input / submit / OAuth / 立即体验 / 登录遇到问题 / 获取验证码）必有 `accessibilityLabel`；submit 按钮 disabled 时 `accessibilityState.disabled = true`；错误 toast 使用 `accessibilityLiveRegion='polite'`（Android）/ `accessibilityRole='alert'`（iOS / Web）                                                                      |
| FR-014 | **删除既有逻辑**：双 tab（password / sms 切换） / `<PasswordField>` 渲染 / `loginPasswordSchema` zod / `loginByPassword` use case 调用 / "忘记密码"链接 / "创建一个"footer 链接 / 跳 register 路由 — 全部废弃（M1.3 impl PR 一并清理）                                                                                                                         |
| FR-015 | `errorScope` 双场景（per mockup v2 设计）：hook (`useLoginForm`) 维护 `errorScope: 'sms' \| 'submit' \| null` 字段；`requestSms` 抛错时 setErrorScope('sms')，`submit` 抛错时 setErrorScope('submit')；UI 据此决定哪个 input 标红边框 + ErrorRow 在哪一栏下方渲染（PhoneInput 旁还是 SmsInput 旁）；clearError / 任意 input change → setErrorScope(null)       |

---

## Success Criteria _(mandatory)_

| ID     | 标准                                                                                                                                                                                                                     | 测量方式                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| SC-001 | User Story 1-4 全部 happy path 单测通过                                                                                                                                                                                  | `pnpm --filter native test` 全绿                                                                  |
| SC-002 | 反枚举字节级一致（client 视角）：User Story 1 happy（已注册）vs User Story 2 happy（未注册）→ submit 后 state 转移 / errorToast / store.session 写入 / router.replace 调用方式完全一致；client 代码无 phone-existed 分支 | 单测断言两 case 完全 equal（含 state machine snapshot）                                           |
| SC-003 | 401 自动 refresh 透明：组件层不感知 access token 过期                                                                                                                                                                    | packages/api-client 已有测试覆盖；本 spec 仅"不破坏"约束                                          |
| SC-004 | 限流场景 (HTTP 429) 提示用户友好且不暴露后端细节                                                                                                                                                                         | 单测 mock 429 → 断言 errorToast = FR-006 定义                                                     |
| SC-005 | a11y：所有交互 component 有 accessibilityLabel + 错误用 alert role                                                                                                                                                       | 手测（浏览器 axe DevTools / iOS VoiceOver）+ ESLint react-native-a11y rule（如启用）              |
| SC-006 | placeholder 路径（OAuth / 立即体验 / 登录遇到问题）不调任何后端 API                                                                                                                                                      | 单测断言 `requestSmsCode` / `phoneSmsAuth` mock 调用次数 = 0                                      |
| SC-007 | 视觉 token 化 100%：login.tsx + 关联 packages/ui 组件零 hex / px / rgb 字面量                                                                                                                                            | grep `apps/native/app/(auth)/login.tsx` + `packages/ui/src/**` 无 `#[0-9a-f]{3,8}` / `\d+px` 命中 |
| SC-008 | Apple 按钮 Android conditional render：`Platform.OS === 'android'` 时 Apple Button 不出现在渲染树                                                                                                                        | 单测 mock `Platform.OS = 'android'` → 断言 `<AppleButton>` 不渲染；mock `'ios'` → 断言 渲染       |
| SC-009 | 三端跑通：浏览器 (RN Web) M1.2 必须；iOS / Android M2 真机渲染                                                                                                                                                           | dev 期手测 + Playwright runtime-debug.mjs（详 `docs/experience/claude-design-handoff.md` § 6）    |

---

## Out of Scope（M1.2 显式不做）

- 微信 / Google / Apple OAuth **真实流程**（M1.3）；M1.2 仅 placeholder 圆形按钮，press 弹 "Coming in M1.3" toast
- "立即体验" 游客模式真实功能（M2/M3 评估）
- "登录遇到问题" 帮助中心（M1.3）
- 中国运营商一键登录 SDK（中国移动 / 联通 / 电信免密验证；per ADR-0016 决策 5，M2+ 评估）
- 二维码扫码登录（M2+ 移动端真机时）
- 多端会话管理（"踢掉其他设备"等，M3+ 内测前）
- iOS / Android 真机渲染验证（M2.1）
- 国际化 / 多语言（M3+）
- 视觉细节（精确 px / hex / 阴影偏移 / 字重值）— 走 mockup → plan.md UI 段吸收
- **register 独立页**（per ADR-0016 决策 1，整页废弃；旧 `app/(auth)/register.tsx` placeholder 在 M1.3 impl PR 一并删除）
- **密码登录 / 忘记密码 / 修改密码**（per ADR-0016 决策 2，整套废弃）
- **邮箱登录 / 邮箱注册 / Google email-only 账号**（per ADR-0016 决策 3）

---

## Assumptions & Dependencies

- `@nvy/auth.phoneSmsAuth` wrapper 在 M1.3 impl PR 落地（替换 既有 `loginByPassword` / `loginByPhoneSms`）
- `@nvy/api-client.AccountSmsCodeApi.requestSmsCode({phone})` (无 purpose 字段) 在 server PR-B merged 后通过 `pnpm api:gen:dev` 拉取 — server PR-B 与本 spec 同 session 落地
- AuthGate / `<Redirect>` 双保险逻辑已在 PR #48 落地
- `expo-router` v6+ + `useRouter().replace()` 可用
- `Platform` from `react-native` 用于 Apple Android conditional render
- 新版 mockup 由 Claude Design 后续单独产出（按 § 2.1b 合一页 prompt 模板），落 `apps/native/spec/login/design/mockup-v2.png` + `handoff.md`；旧 v1 design bundle 标 SUPERSEDED 但保留 visual tokens（`packages/design-tokens` mirror 仍生效）

---

## Open Questions

| #   | 问                                                | 决议                                                                                                                      |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | "立即体验"游客模式具体行为                        | M2 / M3 决定（per ADR-0016 Open Questions）；M1.2 仅 placeholder toast                                                    |
| 2   | Apple 按钮 Android 端 conditional render 由谁负责 | login.tsx 用 `Platform.OS === 'ios'` 判（不下沉到 packages/ui — AppleButton 组件本身跨端可渲染，由 caller 决定）          |
| 3   | mockup v1（双 tab）design/source/ 是否删除        | 保留作历史参考（visual tokens / design-tokens 镜像仍有效）；加 design/SUPERSEDED.md 指针指向 v2                           |
| 4   | 重做 mockup 是否复用 v1 token 命名                | ✅ 复用（`packages/design-tokens` 命名 ink/line/surface/ok/warn/err/accent/brand 不变；新 mockup 仅改 layout / 区域结构） |

---

## 变更记录

- **2026-05-04**：本 spec 整体重写为 unified phone-SMS auth（per ADR-0016）。原 2026-05-03 双 tab 版本（含密码 + 短信 tab + 跳 register）整段废弃；旧 design/source mockup 标 SUPERSEDED；packages/ui 既有 12 组件保留 8（per ADR-0016 Migration 表），M1.3 impl PR 删 PasswordField + 加 WechatButton + AppleButton。
