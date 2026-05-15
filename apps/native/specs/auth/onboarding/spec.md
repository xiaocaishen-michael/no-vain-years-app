# Feature Specification: Onboarding Page (M1.2 — displayName profile gate)

**Feature Branch**: `docs/onboarding-profile-gate`
**Created**: 2026-05-05（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md) + [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)）
**Status**: Draft（pending impl + mockup PHASE 2，docs-only PR）
**Module**: `apps/native/app/(app)/onboarding`
**Input**: User description: "新用户首登 phoneSmsAuth 成功后 displayName=null，跳 /(app)/onboarding 完善昵称才进 home；老用户已有 displayName 直跳 home。"

> 决策约束：
>
> - 后端契约见 [server spec/account/account-profile/spec.md](../../../../my-beloved-server/spec/account/account-profile/spec.md)（同 PR cycle 落地）；本 spec 仅约束前端页面行为
> - **per ADR-0017 类 1 流程**：本 PR 阶段产出 spec/plan/tasks docs + 业务流 + 占位 UI；视觉决策（精确 px / hex / 阴影 / 字重）**不进 spec / plan**，留 PHASE 2 mockup 落地后回填 plan.md UI 段
> - 路由 `apps/native/app/(app)/onboarding.tsx` — 在 `(app)` 路由组内，受 AuthGate 第一层（`!authed → /(auth)/login`）保护；本身是 profile gate 不是 auth gate
> - **register 概念在用户视角不存在**（per ADR-0016）；onboarding 是 "完善个人资料"，不是 "完成注册"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 新用户首登 → onboarding gate（Priority: P1）

新用户经 phoneSmsAuth auto-create 成功 → AuthGate 拦截到 `displayName==null` → 自动 router.replace `/(app)/onboarding` → 用户输入昵称提交 → AuthGate 再次评估 `displayName!=null` → 自动 router.replace `/(app)/`。

**Why this priority**: 主路径，所有新用户首登必经；onboarding gate 决定路由的唯一信号源（`displayName==null`）。

**Independent Test**: vitest + msw mock `/me` 返 `{displayName: null}` + `phoneSmsAuth` 返 session → 渲染 root layout → fireEvent 走 phoneSmsAuth submit → 断言 router.replace 调用为 `/(app)/onboarding`；再 mock `patchMe` 返 `{displayName: "小明"}` → 提交 → 断言 router.replace 调用为 `/(app)/`。

**Acceptance Scenarios**:

1. **Given** 用户走完 phoneSmsAuth 拿到 session，**When** AuthGate 评估状态，**Then** 调 `loadProfile()`（GET `/me`）→ store.displayName = null → AuthGate decision = `(app)/onboarding`
2. **Given** 当前在 `/(app)/onboarding` 页面，**When** 用户输入合法昵称 "小明" 后 press 提交，**Then** 调 `updateDisplayName("小明")`（PATCH `/me`）→ store.displayName = "小明" → AuthGate decision = `(app)/`
3. **Given** 提交成功，**When** AuthGate 重 evaluate，**Then** router.replace `/(app)/`；onboarding 页面卸载

---

### User Story 2 — 老用户回访（已有 displayName）（Priority: P1，并列）

已完成 onboarding 的老用户再次 phoneSmsAuth 登录 → AuthGate 评估 `displayName!=null` → 直接 router.replace `/(app)/`，**不**进 onboarding 页面。

**Why this priority**: 主路径；保证老用户每次登录不重复 onboarding。

**Independent Test**: msw mock `phoneSmsAuth` 返 session + `/me` 返 `{displayName: "老张"}` → 渲染 root layout → 走 phoneSmsAuth submit → 断言 router.replace 调用为 `/(app)/`；onboarding 页面**未渲染**。

**Acceptance Scenarios**:

1. **Given** ACTIVE 老账号 displayName="老张"，**When** phoneSmsAuth 成功 + AuthGate loadProfile，**Then** store.displayName="老张" → AuthGate decision = `(app)/`
2. **Given** 同账号已在 `/(app)/`，**When** 用户刷新页面 / 冷启 app，**Then** rehydrate 后 store.displayName 仍为 "老张"（per FR-006 persist 白名单）→ AuthGate decision = `(app)/`，不抖到 onboarding

---

### User Story 3 — 已登录态刷新 / 冷启保持（Priority: P1，并列）

用户已在 `/(app)/onboarding` 或 `/(app)/`，刷新或冷启 app 后 AuthGate 应保持当前 gate decision，**不闪 splash → login → onboarding** 多余跳转。

**Why this priority**: 体验细节；闪烁是 D 类 bug 风险源，特别 RN Web 上肉眼可见。

**Independent Test**: 模拟 store rehydrate 完成（含 displayName）→ AuthGate render → 断言 router.replace 调用次数 = 0（state 已正确，无需迁移）。

**Acceptance Scenarios**:

1. **Given** store 已 rehydrate（含 accountId / refreshToken / displayName=null），**When** AuthGate 首次 render，**Then** 直接 stay 在 `(app)/onboarding`，不触发 router.replace
2. **Given** store 已 rehydrate（含 displayName="小明"），**When** AuthGate 首次 render 在 `/(app)/`，**Then** 直接 stay，不触发 router.replace
3. **Given** rehydrate 未完成（hydration in-flight），**When** AuthGate render，**Then** 渲染 splash / loading 占位，不立即跳路由（避免错误判断 unauth）

---

### User Story 4 — 登出后再登入（Priority: P2）

用户在 `/(app)/onboarding` 或 `/(app)/` 触发 logout → store 清空（含 displayName）→ AuthGate 跳 `/(auth)/login` → 重新 phoneSmsAuth → 视新登录账号的 `/me.displayName` 决定 onboarding vs home。

**Why this priority**: 边缘但必须保证 — 登出后 displayName stale 不能影响新登录账号的 gate decision。

**Independent Test**: 手工调 store.clearSession + `useAuthStore.getState().displayName` 应为 null；新 phoneSmsAuth 后 loadProfile 重写 displayName。

**Acceptance Scenarios**:

1. **Given** 已登录用户 displayName="小明"，**When** 调 logoutLocal / logoutAll，**Then** store.displayName = null（与 accountId / accessToken / refreshToken 一并清空）
2. **Given** logout 后再以另一账号 phoneSmsAuth，**When** loadProfile 调 `/me`，**Then** store.displayName = 新账号实际值（null 或 "<已设值>"）

---

### Edge Cases

- **网络错时 loadProfile 失败**：AuthGate 不能 deadlock；fallback 路径 = stay 在当前路由 + 显示重试按钮 / 静默重试（per FR-007）
- **PATCH 提交时 401**：access token 已过期 → packages/api-client 拦截器透明 refresh（per 既有 PR #48 契约） → PATCH 自动重发；本页不感知
- **PATCH 提交时 400 INVALID_DISPLAY_NAME**：错误展示在 `<Text>` 错误位（per FR-005）；用户改 input 后重新提交
- **PATCH 提交时 429**：errorToast = "请求过于频繁，请稍后再试"；submit 按钮重新 enabled
- **iOS 软键盘遮 input**：用 `KeyboardAvoidingView` 包裹 form 区域（per RN Web 兼容点 plan.md）
- **用户在 onboarding 页 press iOS 物理 back / Android hardware back**：本期忽略（onboarding 强制不可跳过，per CL-001）；back 应 noop 或弹"请完成昵称设置"toast

---

## Functional Requirements _(mandatory)_

| ID     | 需求                                                                                                                                                                                                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | AuthGate 三态决策（替换 PR #48 既有 2 态）：`!isAuthenticated → /(auth)/login` / `isAuthenticated && displayName == null → /(app)/onboarding` / `isAuthenticated && displayName != null → /(app)/`；rehydrate 未完成时渲染 splash 不立即跳路由                                                                                    |
| FR-002 | session store 扩展（`packages/auth/src/store.ts`）：新增 `displayName: string \| null` 字段 + `setDisplayName(name: string \| null)` action；persist 中间件白名单纳入 displayName（与 accountId / refreshToken 同 persist；accessToken 仍 in-memory）                                                                             |
| FR-003 | usecases 扩展（`packages/auth/src/usecases.ts`）：`loadProfile(): Promise<void>` 调 `getAccountProfileApi().getMe()` → 写 store.displayName；`updateDisplayName(name: string): Promise<void>` 调 `getAccountProfileApi().patchMe({displayName: name})` → 写 store.displayName                                                     |
| FR-004 | `phoneSmsAuth` wrapper 完成后**自动**调 `loadProfile()`（注入到既有 wrapper 末尾）；保证 setSession + setDisplayName 在同一异步流内完成，AuthGate 拿到的 state 一致                                                                                                                                                               |
| FR-005 | DisplayName 客户端校验（zod schema，镜像 server FR-005）：trim 后 Unicode 码点数 ∈ [1, 32]；允 CJK + emoji + 拉丁 + 数字 + 常见标点；禁控制字符（U+0000-U+001F、U+007F-U+009F）、零宽字符（U+200B-U+200F、U+FEFF）、行分隔符（U+2028、U+2029）；失败 form invalid，submit 按钮 disabled                                           |
| FR-006 | 占位 UI 4 边界（per ADR-0017 类 1 强制纪律）：路由 `/onboarding` ✓ / 单 `<TextInput>` 输入 displayName / 单 `<Pressable>` submit / 状态指示 + 错误展示 `<Text>`；**全裸 RN，禁引 packages/ui**；page 顶 `// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.` banner                                        |
| FR-007 | 错误映射（复用既有 `mapApiError`）：401 → AuthGate 拦截 + 走 refresh 透明路径（不展示给用户，per packages/api-client 既有契约）；400 INVALID_DISPLAY_NAME → input 旁 `<Text>` "昵称不合法，请重试"；429 → `<Text>` "请求过于频繁，请稍后再试"；网络错 / 5xx → `<Text>` "网络异常，请重试"；未知 → `<Text>` "提交失败，请稍后重试" |
| FR-008 | 状态机 4 态：`idle → submitting → (success \| error)`；submitting 期间 submit 按钮 disabled + loading 视觉（**裸 RN 不抽组件**：用 `<Text>提交中...</Text>` + `disabled` 即可，per FR-006）；success 即 `setDisplayName(name)` 完成 → AuthGate 接管 router.replace；error 状态下任意 input change 清空错误回 idle                 |
| FR-009 | logout 路径清理：`logoutLocal` / `logoutAll` / `clearSession` 必须**同步**清空 store.displayName（per User Story 4）                                                                                                                                                                                                              |
| FR-010 | a11y：`<TextInput>` `accessibilityLabel='昵称'` + `accessibilityHint='1 至 32 字符，支持中文、字母、数字、emoji'`；submit 按钮 `accessibilityRole='button'` + disabled 时 `accessibilityState.disabled = true`；错误 `<Text>` `accessibilityRole='alert'`（iOS / Web）+ `accessibilityLiveRegion='polite'`（Android）             |
| FR-011 | onboarding 强制不可跳过（per CL-001）：iOS / Android hardware back 在本页 noop；`<TopBar>` close `×` 按钮**不渲染**（占位 UI 阶段无 close 入口；mockup PHASE 2 决定是否加）                                                                                                                                                       |
| FR-012 | 不引入 packages/ui 抽组件（per FR-006 占位 UI 边界）；mockup PHASE 2 落地时再评估是否新建 `<DisplayNameInput>` / `<OnboardingScreen>` 等                                                                                                                                                                                          |

---

## Success Criteria _(mandatory)_

| ID     | 标准                                                                                                                                                                                                   | 测量方式                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| SC-001 | User Story 1-4 全部 happy path 单测通过                                                                                                                                                                | `pnpm --filter native test` + `pnpm --filter @nvy/auth test` 全绿  |
| SC-002 | AuthGate 三态决策表覆盖：3 态 × `inOnboarding`/`inApp`/`inAuth` 路径 = 9 子 case 单测断言（store mock 不同 state → 断言 router.replace 行为）                                                          | vitest 表驱动测试                                                  |
| SC-003 | 反枚举不变性（client 视角）：phoneSmsAuth 响应解析路径**不读 displayName** — `packages/auth/src/usecases.ts` 中 `phoneSmsAuth` 函数体 grep `displayName` 无命中（displayName 仅由 `loadProfile` 读取） | grep 静态分析                                                      |
| SC-004 | DisplayName 客户端校验镜像 server FR-005：表驱动单测 8 case（empty / whitespace / 控制字符 / 零宽 / 33 长度 / 32 CJK / emoji-only / 混合合法）通过                                                     | vitest                                                             |
| SC-005 | 占位 UI 0 视觉决策：`apps/native/app/(app)/onboarding.tsx` 不含 hex / px / rgb 字面量 / `packages/ui` import / 复杂样式属性（除 `flex` / `padding` 等基础布局）                                        | grep 静态分析 + manual review                                      |
| SC-006 | logout 后 displayName 清空：单测 mock 流程（设 displayName → logoutLocal → 断言 store.displayName === null）                                                                                           | vitest                                                             |
| SC-007 | rehydrate 不抖：模拟冷启 → AuthGate 首次 render 在已正确路由（如 `/(app)/onboarding` 或 `/(app)/`）→ 断言 router.replace 调用次数 = 0                                                                  | vitest                                                             |
| SC-008 | 真后端冒烟（占位 UI + 业务流，无视觉）：runtime-debug Playwright 跑 happy 新用户 → onboarding submit → home，截图归档                                                                                  | 手动跑 + 归档 `runtime-debug/2026-05-XX-onboarding-business-flow/` |

---

## Out of Scope（M1.2 显式不做）

- **mockup / 视觉完成**（per ADR-0017 类 1 流程，PHASE 2 后置）— 占位 UI 阶段不做精确间距 / 颜色 / 字号 / 阴影 / 自定义动画
- **`packages/ui` 抽组件**（如 `<DisplayNameInput>` / `<OnboardingScreen>`）— PHASE 2 决定
- **avatar 上传 / 头像组件**（per server CL-003，M2+ 评估）
- **DisplayName 唯一性 / 抢注规则**（per server CL-002 拒绝）
- **Onboarding skip / "稍后再设置"**（per server CL-001 + FR-011 拒绝）
- **DisplayName 修改频率限制 UI / 历史改名记录**（M2+ 评估）
- **iOS / Android 真机渲染验证**（M2.1）
- **国际化**（M3+）
- **bio / nickname / 性别 / 生日等其他 profile 字段**（M2+ 视产品需求）

---

## Assumptions & Dependencies

- **server PR `docs/account-profile-onboarding`** 已 merged → impl PR merged → OpenAPI spec 含 `GET/PATCH /api/v1/accounts/me`（**前置阻塞**：本 spec 的 impl 阶段需先跑 `pnpm api:gen:dev` 拉新 client）
- `@nvy/api-client.getAccountProfileApi()` factory 由 OpenAPI generator 产出（server impl PR 合并后自动有）
- AuthGate / `<Redirect>` 双保险逻辑已在 PR #48 落地（本 spec 扩展为三态）
- `expo-router` v6+ + `useRouter().replace()` 可用（既有）
- `react-hook-form` + `zod` 已在仓内（既有）
- mockup PHASE 2 由 Claude Design 后续单独产出（按 [`docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 2.1b 合一页 prompt 模板），落 `apps/native/specs/auth/onboarding/design/source-v1/`；本 PR **不**等 mockup

---

## Open Questions

| #   | 问                                     | 决议                                                                                                                        |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | onboarding 是否可跳过                  | ❌ 不可跳（per server CL-001 + FR-011）；M2+ 真有需求再评估 skip 入口                                                       |
| 2   | DisplayName 是否要求 unique            | ❌ 不要求（per server CL-002）；多账号同名合法                                                                              |
| 3   | avatar 是否本期                        | ❌ 不本期（per server CL-003）；推迟 M2+ 与对象存储 / 头像 service 一并评估                                                 |
| 4   | DisplayName 校验细则                   | ✅ [1,32] Unicode 码点 + trim + 禁控制 / 零宽 / 行分隔（per server CL-004 / FR-005，client 镜像）                           |
| 5   | onboarding 页面 close `×` 按钮是否渲染 | 🟡 PHASE 1 占位**不**渲染（FR-011）；PHASE 2 mockup 决定（如 mockup 含 close = 给到 noop / "请完成"toast 实现）             |
| 6   | onboarding 提交后过渡动画              | 🟡 PHASE 1 占位**无**动画（直接 router.replace）；PHASE 2 mockup 决定 success overlay 等视觉                                |
| 7   | iOS / Android hardware back 行为       | ✅ noop（per FR-011）；用 `BackHandler.addEventListener('hardwareBackPress', () => true)` Android；iOS 默认无 hardware back |

---

## 变更记录

- **2026-05-05**：本 spec 首次创建（per ADR-0016 onboarding 流程后续 + ADR-0017 SDD 类 1 业务流先行）。基于 server `spec/account/account-profile/spec.md`（同 PR cycle 落地）的 FR-005 displayName 校验规则镜像。Open Question 5 / 6（close 按钮 / 过渡动画）留 PHASE 2 mockup 决定。
