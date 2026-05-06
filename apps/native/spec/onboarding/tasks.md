# Tasks: Onboarding Page (displayName profile gate)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2026-05-05（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md) + [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)）
**Status**: ✅ PHASE 1 Implemented（PR [#63](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/63) — 业务流 + 占位 UI + 真后端冒烟）；✅ PHASE 2 Translated（mockup-prompt PR [#65](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/65) + PR [#66](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/66) — bundle 落 source / handoff / T8-T10）；✅ PHASE 2 Visual Smoke（本 PR — T_smoke 4 状态截图）

> **TDD enforcement**（per [no-vain-years-app CLAUDE.md § 五](https://github.com/xiaocaishen-michael/no-vain-years-app/blob/main/CLAUDE.md)）：业务 hook / store / 工具函数**必须**测；纯展示 UI 不强制 TDD。每条 task 内**测试任务绑定到实现 task**。
>
> **顺序**：T0（前置 server PR + sync-api-types）→ T1-T2（store + usecases 业务逻辑）→ T3（zod schema）→ T4（hook）→ T5（AuthGate 三态）→ T6（占位 UI）→ T7（真后端冒烟）→ T8+（mockup PHASE 2 占位空表）。

---

## 任务清单

### 已完成（依赖前置）

| #        | 层级                    | 任务                                                       | 文件                                              | 状态       |
| -------- | ----------------------- | ---------------------------------------------------------- | ------------------------------------------------- | ---------- |
| ✅T_dep0 | [server]                | server `docs/account-profile-onboarding` SDD 三件套        | `my-beloved-server/spec/account/account-profile/` | ✅ PR #125 |
| ✅T_dep1 | [Existing AuthGate]     | PR #48 落地的 AuthGate 2 态版 + rehydrate 守               | `apps/native/app/_layout.tsx`                     | ✅         |
| ✅T_dep2 | [Existing phoneSmsAuth] | PR #54 切到真 `getAccountAuthApi().phoneSmsAuth()` wrapper | `packages/auth/src/usecases.ts`                   | ✅         |

### 本次（5-05 docs-only）

| #        | 层级    | 任务                                                             | 文件                                   | 状态        |
| -------- | ------- | ---------------------------------------------------------------- | -------------------------------------- | ----------- |
| ✅T_doc1 | [Spec]  | 写本仓 onboarding spec.md（FR 镜像 server FR-005 / Open Q 5 题） | `apps/native/spec/onboarding/spec.md`  | ✅（本 PR） |
| ✅T_doc2 | [Plan]  | 写 plan.md 数据流 / 状态机 / 错误映射 / UI 段 4 边界占位         | `apps/native/spec/onboarding/plan.md`  | ✅（本 PR） |
| ✅T_doc3 | [Tasks] | 写本文件 — T0-T7 实施步骤 + T8+ mockup PHASE 2 占位空表          | `apps/native/spec/onboarding/tasks.md` | ✅（本 PR） |

### Impl 阶段（PR [#63](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/63) — 业务流 + 占位 UI）✅

| #     | 层级            | 任务                                                                                                                                   | 文件                                                                                                                           | 状态                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ T0 | [API client]    | server impl PR merged → `pnpm api:gen:dev` 拉新 spec → 新增 `AccountProfileControllerApi.getMe / patchMe` + DTOs                       | `packages/api-client/src/generated/`                                                                                           | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T1 | [Auth store]    | `packages/auth/src/store.ts` 加 `displayName: string \| null` + `setDisplayName` action + persist 白名单 + clearSession 清 displayName | `packages/auth/src/store.ts` + `__tests__/store.test.ts`                                                                       | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T2 | [Auth usecases] | 加 `loadProfile()` + `updateDisplayName(name)`；改 `phoneSmsAuth` 末尾注入 `loadProfile()`                                             | `packages/auth/src/usecases.ts` + `__tests__/usecases.test.ts`                                                                 | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T3 | [Schema]        | 新建 `apps/native/lib/validation/onboarding.ts`：`displayNameSchema` zod；扩 `mapApiError` 加 `INVALID_DISPLAY_NAME` 子码 case         | `apps/native/lib/validation/onboarding.ts` + `onboarding.test.ts`；`apps/native/lib/validation/login.ts.mapApiError` 加 1 case | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T4 | [Hook]          | 新建 `apps/native/lib/hooks/use-onboarding-form.ts`：4 状态机 + submit + errorMessage 清理                                             | `apps/native/lib/hooks/use-onboarding-form.ts` + `use-onboarding-form.test.ts`                                                 | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T5 | [AuthGate]      | 改写 `apps/native/app/_layout.tsx` AuthGate 为三态决策（per FR-001）+ rehydrate 不抖（per SC-007）                                     | `apps/native/app/_layout.tsx` + `_layout.test.tsx`（如有 / 否则新建）                                                          | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T6 | [App]           | 新建 `apps/native/app/(app)/onboarding.tsx`：占位 UI 4 边界（per FR-006 + plan UI 段示意代码）；裸 RN，`// PHASE 1 PLACEHOLDER` banner | `apps/native/app/(app)/onboarding.tsx`                                                                                         | ✅ PR #63                                                                                                                                                                                                                                                                                                                                                                                                       |
| ✅ T7 | [真后端冒烟]    | `runtime-debug.mjs` 跑 happy 新用户 phoneSmsAuth → onboarding submit → home；DB 验 display_name 列写入；截图归档                       | `apps/native/runtime-debug/2026-05-05-onboarding-business-flow/`                                                               | ✅ 4 张截图归档：[01 login](../../runtime-debug/2026-05-05-onboarding-business-flow/01-login-initial.png) / [02 form ready](../../runtime-debug/2026-05-05-onboarding-business-flow/02-login-form-ready.png) / [03 onboarding](../../runtime-debug/2026-05-05-onboarding-business-flow/03-onboarding-arrived.png) / [04 home](../../runtime-debug/2026-05-05-onboarding-business-flow/04-after-submit-home.png) |

### Mockup PHASE 2 阶段（再下 session PR — UI 完成）

| #          | 层级           | 任务                                                                                                                                                                                                                                                                                                                                                                      | 文件                                                                                                                                | 状态                                                     |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| ✅ T_mock  | [Mockup]       | Claude Design 出 onboarding 页 mockup（按 [`docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 2.1b prompt 模板）+ bundle 落 `design/source/` + 写 `design/handoff.md` 7 段                                                                                                                                               | `apps/native/spec/onboarding/design/source/` + `design/mockup-prompt.md` + `design/handoff.md`                                      | ✅ PR #65 (mockup-prompt) + 本 PR (source/ + handoff.md) |
| ✅ T8      | [packages/ui]  | 评估子组件归属（per FR-012）：5 复用 `@nvy/ui`（Spinner / SuccessCheck / LogoMark / ErrorRow / PrimaryButton）+ 2 inline（DisplayNameInput / SuccessOverlay 单页 once-only）                                                                                                                                                                                              | `apps/native/spec/onboarding/design/handoff.md` § 2                                                                                 | ✅ 本 PR — 不新增 packages/ui 组件                       |
| ✅ T9      | [App]          | 改写 `apps/native/app/(app)/onboarding.tsx`：删 PHASE 1 PLACEHOLDER banner + 5 个组件 import @nvy/ui + DisplayNameInput / SuccessOverlay inline + 整页 layout 1:1 paste + 保留现有 hook / BackHandler / a11y 接入                                                                                                                                                         | `apps/native/app/(app)/onboarding.tsx`                                                                                              | ✅ 本 PR                                                 |
| ✅ T10     | [Plan]         | plan.md UI 段从 4 边界占位回填为完整 UI 结构（区域分块 / 状态视觉转移 / Token 映射 / packages/ui 复用清单 / a11y 落点）                                                                                                                                                                                                                                                   | `apps/native/spec/onboarding/plan.md`                                                                                               | ✅ 本 PR                                                 |
| ✅ T_smoke | [Visual smoke] | onboarding 页 4 状态截图（idle / submitting / success / error）：`page.route` 拦 PATCH `/me`，submitting=hold+abort+waitDone 三段式锁住请求，success=mock 200 + `displayName=null` 防 AuthGate 跳转，error=mock 400 `INVALID_DISPLAY_NAME`；DB display_name 保持 null 零污染（参照 PHASE 1 [`run.mjs`](../../runtime-debug/2026-05-05-onboarding-business-flow/run.mjs)） | [`runtime-debug/2026-05-06-onboarding-mockup-translation/`](../../runtime-debug/2026-05-06-onboarding-mockup-translation/README.md) | ✅ 本 PR                                                 |
| 🔲 T11     | [视觉回归]     | 视情况引入 visual regression（M2 后）                                                                                                                                                                                                                                                                                                                                     | TBD                                                                                                                                 | 🟡 评估                                                  |

---

## T0 — 等 server impl PR + `pnpm api:gen:dev` 拉新 client

**前置**：server `docs/account-profile-onboarding` PR 合并 → server impl PR 合并 → 后端 dev server 跑起 `mvn spring-boot:run -pl mbw-app`。

**操作**：

```bash
cd no-vain-years-app
pnpm api:gen:dev   # 通过 http://localhost:8080/v3/api-docs 拉 spec
```

**验证**：

```bash
git status -- packages/api-client/src/generated/
# 期望：
#   - 新增 AccountProfileControllerApi.ts (含 getMe / patchMe methods)
#   - 新增 AccountProfileResponse / DisplayNameUpdateRequest DTOs
#   - 既有 AccountAuthControllerApi.ts / AccountSmsCodeApi.ts 不变（per server SC-003 反枚举不变性）

pnpm -r typecheck
# 此时全绿（新 API 只是新增，无破坏既有调用）
```

提交单 commit：`feat(api-client): regenerate from server account-profile spec`。

---

## T1 — Auth store 加 displayName 字段

**TDD**：先写 unit test，再实现。

### T1-test：扩展 `packages/auth/src/__tests__/store.test.ts`

| 测试 case                       | 输入                                 | Expect                                                                    |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| 初始 displayName === null       | 新建 store                           | `useAuthStore.getState().displayName === null`                            |
| setDisplayName 正常             | call `setDisplayName("小明")`        | state.displayName === "小明"                                              |
| setDisplayName(null) 清空       | call `setDisplayName(null)`          | state.displayName === null                                                |
| clearSession 同步清 displayName | 设 displayName="小明" → clearSession | state.displayName === null（accountId / refreshToken / accessToken 也清） |
| persist 白名单含 displayName    | 模拟 persist 序列化 → rehydrate      | rehydrated state.displayName == 上次写入值                                |

**Verify**：`pnpm --filter @nvy/auth test` 全 RED。

### T1-impl：`packages/auth/src/store.ts`

- 加 `displayName: string \| null` 字段（initial = null）
- 加 `setDisplayName(name: string \| null)` action
- `clearSession` 实现内 inline 清 displayName（与 accountId / refreshToken / accessToken 一并）
- `persist` 中间件 partialize 白名单加 `displayName`（与 accountId / refreshToken 一组）

**Verify**：T1-test 全 GREEN。

---

## T2 — Auth usecases 加 loadProfile + updateDisplayName

**TDD**：先写 unit test，再实现。

### T2-test：扩展 `packages/auth/src/__tests__/usecases.test.ts`

| 测试 case                              | Mock 配置                                                                                           | Expect                                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| loadProfile happy                      | `getAccountProfileApi().getMe()` 返 `{accountId, displayName: "小明", status: "ACTIVE", createdAt}` | store.displayName === "小明"                                                                            |
| loadProfile null displayName           | response.displayName === null                                                                       | store.displayName === null                                                                              |
| loadProfile 401                        | mock throw ResponseError(401)                                                                       | 透明 refresh 路径（既有契约）；不写 store                                                               |
| loadProfile 网络错                     | throw FetchError                                                                                    | re-throw；不写 store                                                                                    |
| updateDisplayName happy                | `patchMe({displayName: "小明"})` 返 success                                                         | store.displayName === "小明"                                                                            |
| updateDisplayName 400 INVALID          | throw ResponseError(400, body.code='INVALID_DISPLAY_NAME')                                          | re-throw；不写 store                                                                                    |
| updateDisplayName 429                  | throw ResponseError(429)                                                                            | re-throw；不写 store                                                                                    |
| phoneSmsAuth 末尾自动调 loadProfile    | mock phoneSmsAuth + getMe success                                                                   | store.accountId / displayName 都被写入                                                                  |
| phoneSmsAuth happy 但 loadProfile 失败 | mock phoneSmsAuth success + getMe throw 网络错                                                      | session 已 set；displayName 仍为初始 null（fallback：AuthGate 跳 `(app)/onboarding` — per FR-001 决策） |

**Verify**：测试全 RED。

### T2-impl：`packages/auth/src/usecases.ts`

- 加 `loadProfile(): Promise<void>` — 调 `getAccountProfileApi().getMe()` → `useAuthStore.getState().setDisplayName(response.displayName ?? null)`；401 透明 refresh 路径既有；网络错 re-throw（不污染 store）
- 加 `updateDisplayName(name: string): Promise<void>` — 调 `getAccountProfileApi().patchMe({displayName: name})` → `setDisplayName(response.displayName)`；400 / 429 / 网络错 re-throw
- 改 `phoneSmsAuth` 函数体末尾：`setSession(...)` 后 `await loadProfile().catch(() => {/* swallow; AuthGate fallback */})`（per T2-test 第 9 case）

**Verify**：T2-test 全 GREEN。

---

## T3 — DisplayName zod schema + mapApiError 扩展

**TDD**：先写 schema test，再实现。

### T3-test：新建 `apps/native/lib/validation/onboarding.test.ts`

| 测试 case                | 输入            | Expect                      |
| ------------------------ | --------------- | --------------------------- |
| empty rejected           | `""`            | parse fail                  |
| whitespace-only rejected | `"   "`         | parse fail（trim 后 empty） |
| 33-char rejected         | 33 ASCII        | parse fail                  |
| 32 CJK accepted          | 32 个汉字       | parse OK                    |
| emoji-only accepted      | `"🎉🌸"`        | parse OK                    |
| 控制字符 rejected        | 含 BEL `""`     | parse fail                  |
| 零宽 rejected            | 含 `"​"`        | parse fail                  |
| 行分隔 rejected          | 含 `" "`        | parse fail                  |
| trim leading/trailing    | `"  小明  "`    | parse OK + value === "小明" |
| 混合合法                 | `"小明_2026🎉"` | parse OK                    |

扩 `apps/native/lib/validation/login.test.ts` 的 mapApiError 测试：

- 加 case：`ResponseError(400, body.code='INVALID_DISPLAY_NAME')` → `{kind: 'invalid', toast: '昵称不合法，请重试'}`

**Verify**：测试全 RED。

### T3-impl：

新建 `apps/native/lib/validation/onboarding.ts`：

```ts
import { z } from 'zod';

const FORBIDDEN_CHAR_RE = /[ --​-‏﻿  ]/;

export const displayNameSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(1, '昵称至少 1 字符')
      .refine((s) => !FORBIDDEN_CHAR_RE.test(s), '昵称含不可见字符')
      .refine((s) => Array.from(s).length <= 32, '昵称最长 32 字符'),
  );
```

注意 `Array.from(s).length` 计 Unicode 码点（emoji surrogate pair 为 1，CJK 为 1，per FR-005）；`.length` 直读会把 emoji 算 2 不正确。

扩 `apps/native/lib/validation/login.ts` 的 `mapApiError`：在 401/429/network/unknown 之间加 400 + `body.code === 'INVALID_DISPLAY_NAME'` 分支。

**Verify**：T3-test 全 GREEN。

---

## T4 — useOnboardingForm hook

**TDD**：先写 hook test，再实现。

### T4-test：新建 `apps/native/lib/hooks/use-onboarding-form.test.ts`

| 测试 case                     | 操作                                                               | Expect                                                                    |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 初始 status === idle          | 渲染 hook                                                          | `result.current.status === 'idle'`                                        |
| 输入合法昵称 → submit happy   | setDisplayName("小明") + submit() + mock updateDisplayName resolve | status: idle → submitting → success（短暂）；store.displayName === "小明" |
| submit 时 form invalid → noop | setDisplayName("") + submit()                                      | updateDisplayName mock 调 0 次；status idle                               |
| submit 400                    | mock updateDisplayName throw 400 INVALID                           | status idle → submitting → error；errorMessage === '昵称不合法，请重试'   |
| submit 429                    | mock 429                                                           | errorMessage === '请求过于频繁，请稍后再试'                               |
| submit 网络错                 | mock FetchError                                                    | errorMessage === '网络异常，请重试'                                       |
| 错误后改 input → 清错         | submit 出错 + setDisplayName("新值")                               | errorMessage === null + status === idle                                   |

**Verify**：测试全 RED。

### T4-impl：新建 `apps/native/lib/hooks/use-onboarding-form.ts`

- 用 `react-hook-form` + zod resolver 接 `displayNameSchema`
- 状态机 4 态（idle / submitting / success / error）；用 useState
- submit 调 `@nvy/auth.updateDisplayName(name)`；catch → mapApiError → setErrorMessage
- 错误清理：watch displayName change → 若有 errorMessage 则 setErrorMessage(null) + setStatus('idle')
- a11y：暴露 `accessibilityState.disabled` 信号（status === 'submitting' || form invalid）

**Verify**：T4-test 全 GREEN。

---

## T5 — AuthGate 三态决策

**TDD**：先扩 \_layout.test.tsx 表驱动测试。

### T5-test：扩 / 新建 `apps/native/app/_layout.test.tsx`

表驱动测试 9 case：

| isAuthenticated | displayName | inAuthGroup | inOnboarding | 期望 router.replace                                               |
| --------------- | ----------- | ----------- | ------------ | ----------------------------------------------------------------- |
| false           | null        | true        | false        | （noop，已在 login）                                              |
| false           | null        | false       | false        | `/(auth)/login`                                                   |
| false           | null        | false       | true         | `/(auth)/login`（onboarding 在 (app) 路由组，未 auth 应跳 login） |
| true            | null        | true        | false        | `/(app)/onboarding`（已登录但 displayName 缺，强 gate）           |
| true            | null        | false       | false        | `/(app)/onboarding`（在 (app)/ 但 displayName 缺，跳 onboarding） |
| true            | null        | false       | true         | （noop，已在 onboarding）                                         |
| true            | "小明"      | true        | false        | `/(app)/`（已登录已有 displayName，离开 (auth)）                  |
| true            | "小明"      | false       | false        | （noop，已在 (app)/）                                             |
| true            | "小明"      | false       | true         | `/(app)/`（已有 displayName 不该停 onboarding）                   |

加 1 case：rehydrate 中（`hasHydrated === false`）渲染 splash + 不调 router.replace（per SC-007）。

**Verify**：测试全 RED。

### T5-impl：改 `apps/native/app/_layout.tsx` AuthGate

- 读 `isAuthenticated` + `displayName` from store
- 读 `useSegments()` 判 inAuthGroup / inOnboarding（path 含 'onboarding'）
- decision tree per FR-001 三态
- rehydrate 守：用 zustand `useAuthStore.persist.hasHydrated()` + 既有 `navigationRef.isReady()` 双守
- 渲染 splash component（裸 RN `<View><Text>加载中...</Text></View>` 占位，per ADR-0017 占位 UI 边界；mockup PHASE 2 决定 splash 视觉）

**Verify**：T5-test 全 GREEN。

---

## T6 — Onboarding 占位页面

**TDD**：组件层 PHASE 1 不强制 TDD（per CLAUDE.md § 五），但写 1 个 render smoke test。

### T6-test：新建 `apps/native/app/(app)/onboarding.test.tsx`

- render smoke：渲染 + 找到 `<TextInput>` + `<Pressable>` + 标题 `<Text>完善个人资料</Text>`
- a11y：`accessibilityLabel='昵称'` 存在；submit `accessibilityRole='button'` 存在
- 提交流程 e2e mock：mock `updateDisplayName` resolve → fireEvent input + press → 断言 mock 调 1 次

**Verify**：测试全 RED。

### T6-impl：新建 `apps/native/app/(app)/onboarding.tsx`

按 plan.md `## UI 结构 → 占位代码示意`实现，header 加 `// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.` banner。

**强制纪律**（per FR-006 + ADR-0017）：

- 不引 `@nvy/ui`
- 不引 `@nvy/design-tokens`
- 不写 className（NativeWind）
- style 仅用 inline `{flex: 1, padding: 16}` 等基础布局（白名单：flex / padding / margin）
- 不写 hex / rgb / px 字面量颜色 / 字号 / 阴影

**Verify**：T6-test GREEN；`pnpm -r typecheck` 全绿；`pnpm -r lint` 全绿。

---

## T7 — 真后端冒烟（占位 UI）

**操作**：

1. server dev 起：`./mvnw spring-boot:run -pl mbw-app`
2. app dev 起：`pnpm web`（RN Web on Chromium）
3. Playwright `runtime-debug.mjs` 脚本（参考 login PR #53 / #54 脚本）：
   - 导航 `/(auth)/login`
   - phoneSmsAuth 全新号码 `+8613911119999`
   - 截图：phoneSmsAuth 提交后 → 期望 redirect 到 `/(app)/onboarding`
   - 输入 displayName "小明" + 提交
   - 截图：onboarding 提交后 → 期望 redirect 到 `/(app)/`
4. DB 验证：`SELECT phone, display_name FROM account.account WHERE phone = '+8613911119999';` → display_name === "小明"
5. 截图归档 `apps/native/runtime-debug/2026-05-XX-onboarding-business-flow/`：`01-login.png` / `02-after-login-onboarding.png` / `03-onboarding-form.png` / `04-after-submit-home.png`

**Verify**：截图链路完整 + DB 写入正确 + 无控制台 error。

---

## T_FUTURE [M2+]：延期项

**不在本 spec 阶段范围**：

- avatar 上传 / 头像组件（per server CL-003）
- DisplayName 全局唯一 / 抢注规则（per server CL-002）
- onboarding skip / "稍后再设置"按钮（per server CL-001 + spec FR-011 拒绝）
- DisplayName 修改频率限制 / 历史改名记录
- bio / 性别 / 生日等其他 profile 字段
- iOS / Android 真机渲染验证（M2.1）
- 国际化（M3+）

---

## Verify（PHASE 1 全部完成后）

```bash
# 单元 + 集成全跑
pnpm -r test

# 类型检查
pnpm -r typecheck

# Lint
pnpm -r lint

# 真后端冒烟（per T7）
node apps/native/runtime-debug.mjs --scenario onboarding-business-flow

# 反枚举静态分析（per SC-003）
grep -n "displayName" packages/auth/src/usecases.ts | grep "phoneSmsAuth"
# 期望：phoneSmsAuth 函数体内不直接读 response.displayName（仅由 loadProfile 读取）

# 占位 UI 0 视觉决策（per SC-005）
grep -E "#[0-9a-f]{3,8}|\d+px|rgb\(|@nvy/ui|@nvy/design-tokens" apps/native/app/\(app\)/onboarding.tsx
# 期望：无命中
```

## References

- [`./spec.md`](./spec.md) — Functional Requirements + Success Criteria
- [`./plan.md`](./plan.md) — 数据流 / 状态机 / UI 段（PHASE 1 占位 / PHASE 2 待回填）
- [server `spec/account/account-profile/`](../../../../my-beloved-server/spec/account/account-profile/) — 后端契约（FR-005 校验规则镜像 + OpenAPI 来源）
- [no-vain-years-app CLAUDE.md § 五 测试约定](https://github.com/xiaocaishen-michael/no-vain-years-app/blob/main/CLAUDE.md) — 业务 hook / store / 工具函数必测；纯展示 UI 不强制 TDD
- [ADR-0014](../../../../docs/adr/0014-nativewind-tailwind-universal.md) — NativeWind / Tailwind universal（PHASE 2 mockup 落地后切回 className 风格）
- [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md) — unified phone-SMS auth 上游决策
- [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) — SDD 业务流先行 + mockup 后置
- [`spec/login/`](../login/) — 同模式（unified phone-SMS auth）三件套参考
