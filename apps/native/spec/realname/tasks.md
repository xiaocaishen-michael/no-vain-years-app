# Tasks: Realname Verification UI

**Spec**: [`./spec.md`](./spec.md) · **Plan**: [`./plan.md`](./plan.md)
**Phase**: PHASE 1 Doc → PHASE 1 Impl（业务流 + 占位 UI + 真后端冒烟） → PHASE 2 Mockup → PHASE 2 UI Impl
**Status**: Draft（pending impl）

> **TDD enforcement**：每个 [Hook] / [Page] / [Schema] task 严格红 → 绿 → 重构。每条 task 内**测试任务绑定到实现 task**。
>
> **Status 标记**：task heading 无标记 = pending；加 `✅` = done；impl 每 task 完成同 commit 同步标记。
>
> **顺序**：T0 拉新 server client → T1 schema → T2 usecase + hook → T3-T5 page 占位 + readonly + frozen → T6 错误映射 + 文案 → T7 enable account-security 入口 → T8 真后端冒烟 → T9 PHASE 2 mockup（user 跑 Claude Design）→ T10 mockup translate → T11 UI 完成 impl + plan UI 段回填。

---

## PHASE 1 Impl（业务流程 + 占位 UI）

### T0 [Cleanup]：pnpm api:gen 拉新 server unified spec

**前置**：server PR #149 已 merge（已确认 ✅）

**子任务**：

- T0.1 在副 worktree app 仓 `pnpm api:gen:dev`（连本机 server 拉 OpenAPI spec）或 `pnpm api:gen` 拉远端 spec
- T0.2 验证 `packages/api-client/src/generated/api/RealnameApi.ts` 已生成；method `getMe` / `initiateVerification` / `getVerification` 存在
- T0.3 验证 errorCode TS enum 含 8 条 `REALNAME_*`

**Verify**:

- `pnpm typecheck` 全包 GREEN（per memory `feedback_verify_per_commit_no_reuse` 每 commit 跑全包）
- `git diff packages/api-client/src/generated/` 仅含 RealnameApi 相关新增 + errorCode enum 扩展，无意外改动

---

### T1 [Schema]：identityNumberSchema (GB 11643)

**TDD**：先写 test。

#### T1-test：identityNumberSchema.test.ts

新建 `apps/native/lib/validation/identity-number.test.ts`：

| Test 场景          | Input                 | Expect |
| ------------------ | --------------------- | ------ |
| 合法测试号         | `110101199001011237`  | OK     |
| 合法末位 X         | `11010119900101001X`  | OK     |
| 17 位              | `1101011990010112`    | reject |
| 19 位              | `1101011990010112370` | reject |
| 含字母             | `11010119900A011237`  | reject |
| 末位错             | `110101199001011230`  | reject |
| 行政区划码 00 开头 | `001010199001011230`  | reject |
| 日期 2 月 30       | `110101199002301234`  | reject |
| null / 空串 / 空白 | null / "" / " "       | reject |

**Verify**: `pnpm test apps/native/lib/validation/identity-number.test.ts` 全 RED

#### T1-impl：identityNumberSchema

新建 `apps/native/lib/validation/identity-number.ts`：

- 用 zod schema：`z.string().refine(validateGB11643, "证件号格式错误")`
- `validateGB11643(s)`: 长度 18 / 前 17 位数字 / 末位 0-9X / 行政区划码 / 日期 / GB 11643 加权校验
- 加权系数 `[7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]`，校验码表 `["1","0","X","9","8","7","6","5","4","3","2"]`
- export `identityNumberSchema` + `validateGB11643` 工具

**Verify**: T1-test 全 GREEN

---

### T2 [Usecase + Hook]：useRealnameStatus + initiateVerification + getVerification

**TDD**：先写 test。

#### T2-test：useRealnameStatus.test.ts + 各 usecase test

新建：

- `apps/native/lib/usecases/realname.test.ts`
- `apps/native/lib/hooks/use-realname-status.test.ts`

`realname.test.ts`（usecase 函数级）：

| 场景                                                | Mock                         | Expect                                           |
| --------------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `loadRealnameStatus` happy UNVERIFIED               | msw GET /me 返 UNVERIFIED    | result.status=UNVERIFIED                         |
| `loadRealnameStatus` happy VERIFIED                 | msw 返 VERIFIED + mask       | result 含 mask 字段                              |
| `loadRealnameStatus` 401                            | msw 返 401                   | api-client 透明 refresh 后再 try（既有契约模拟） |
| `loadRealnameStatus` 网络错                         | msw network error            | throw                                            |
| `initiateVerification` happy                        | msw POST 返 200              | result 含 providerBizId / livenessUrl            |
| `initiateVerification` 409 ID_CARD_OCCUPIED         | msw 返 409                   | throw with errorCode=`REALNAME_ID_CARD_OCCUPIED` |
| `initiateVerification` 403 ACCOUNT_IN_FREEZE_PERIOD | msw 返 403                   | throw with errorCode                             |
| `initiateVerification` 429 RATE_LIMIT               | msw 返 429                   | throw with errorCode + Retry-After               |
| `getVerification` PENDING                           | msw 返 PENDING               | result.status=PENDING                            |
| `getVerification` VERIFIED                          | msw 返 VERIFIED + mask       | result.status=VERIFIED                           |
| `getVerification` FAILED                            | msw 返 FAILED + failedReason | result.status=FAILED + failedReason              |

`use-realname-status.test.ts`（hook 级）：

| 场景                             | Mock                                   | Expect                                                              |
| -------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| 初始 LOADING → UNVERIFIED        | msw `loadRealnameStatus` 返 UNVERIFIED | hook state 转 UNVERIFIED                                            |
| FROZEN 前置拦截                  | AuthStore.status=FROZEN                | 不调 loadRealnameStatus，hook state 直接 FROZEN                     |
| 网络错 → ERROR                   | msw throw                              | hook state=ERROR + retry handler 提供                               |
| 轮询 PENDING → VERIFIED          | msw 第 1 次 PENDING / 第 2 次 VERIFIED | hook 自动调 getVerification 直至非 PENDING；最终 state=VERIFIED     |
| 轮询超时 (15 次仍 PENDING)       | msw 一直返 PENDING                     | hook state=ERROR + 文案"等待超时"                                   |
| 用户主动 reset (FAILED → 重提交) | hook.resetToInputForm()                | state 转 UNVERIFIED 但保留 form input value（外层 form state 持有） |

**Verify**: 全 RED

#### T2-impl：usecases + hook

新建：

- `apps/native/lib/usecases/realname.ts`：
  - `loadRealnameStatus()` → 调 `RealnameApi.getMe()` + 错误透传
  - `initiateVerification(realName, idCardNo, agreementVersion)` → 调 `RealnameApi.initiateVerification(...)`
  - `getVerification(providerBizId)` → 调 `RealnameApi.getVerification(...)`
- `apps/native/lib/hooks/use-realname-status.ts`：
  - `useRealnameStatus(): { status, profile?, failedReason?, error?, retry, startVerification, completeWithBizId }`
  - 内部 useEffect：mount 时调 loadRealnameStatus
  - useEffect 监听 AuthStore.status (FROZEN 拦截)
  - 内部 polling 状态机（max 15 次 / 2s 间隔）
- 复用既有 `mapApiError`（待 T6 扩展）

**Verify**: T2-test 全 GREEN

---

### T3 [Page]：占位 page (`account-security/realname/index.tsx`)

**TDD**：先写组件测试。

#### T3-test：`apps/native/app/(app)/settings/account-security/realname/__tests__/index.test.tsx`

| Test 场景                             | Mock                                   | Expect                                                             |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| LOADING render                        | useRealnameStatus → LOADING            | render `<Text>加载中...</Text>`                                    |
| UNVERIFIED render InputForm           | UNVERIFIED                             | render input \* 2 + checkbox + 「下一步」disabled                  |
| 输入合法 + 勾选协议                   | (form interaction)                     | 「下一步」enabled                                                  |
| Submit                                | press 「下一步」                       | hook.startVerification 调用 with form values                       |
| FAILED render with failureMessage     | FAILED + failedReason=NAME_ID_MISMATCH | error text "姓名与身份证号不一致..."                               |
| PENDING render with polling indicator | PENDING                                | render `<Text>正在验证身份信息...</Text>`                          |
| VERIFIED render readonly              | VERIFIED + maskedFields                | render `<Text>已认证实名信息</Text>` + mask 字段                   |
| VERIFIED 不渲染 destructive 元素      | VERIFIED                               | queryByRole "button" with name "解绑" / "修改" / "重新认证" → null |
| FROZEN render frozen page             | FROZEN                                 | render "账号处于注销冻结期" + 「去撤销」按钮                       |
| ERROR render with retry               | ERROR                                  | render "出错了" + retry button → press → hook.retry 调             |

#### T3-impl：占位 page

新建 `apps/native/app/(app)/settings/account-security/realname/index.tsx`：

- 头部 banner 注释（per ADR-0017）
- `useRealnameStatus()` hook
- 状态分支 render（per plan.md UI 占位）
- form state（local useState：realName / idCardNo / agreed）
- isSubmittable 计算：`identityNumberSchema.safeParse(idCardNo).success && realName.length >= 2 && agreed && status !== 'PENDING'`
- onSubmit handler：调 `hook.startVerification(realName, idCardNo, "v1.0-placeholder")` → 拿 livenessUrl → `WebBrowser.openBrowserAsync(livenessUrl)` → 回 app 后 `hook.completeWithBizId(providerBizId)`
- 0 NativeWind className / 0 packages/ui import / 0 自定义动画
- mask 字段直接消费 `profile.realNameMasked` / `profile.idCardMasked`

**Verify**: T3-test 全 GREEN

---

### T4 [Page] readonly 视图 + FROZEN 错误页 + ERROR 重试

实际上 T3-impl 已含 readonly / FROZEN / ERROR 分支。本 task 仅作明确的实施 checklist 项：

- 确认 `<View>` / `<Text>` 占位结构覆盖 spec User Stories 1-4 全 acceptance scenario
- 确认 readonly 视图代码层面**没有**任何 destructive button 元素（grep `<Pressable.*删除\|解绑\|修改` 返回 0 命中）
- 确认 FROZEN 页 `<Pressable onPress={() => router.push('/settings/account-security/delete-account')}>` 正确路由

**Verify**: 同 T3-test；外加 `RealnameImmutabilityIT`（前端 vitest 类似 contract test，断言 destructive 元素 0）

---

### T5 [Routing]：layout + AuthStore 集成

#### T5.1：account-security/realname/\_layout.tsx（如需）

仅当当前 stack 已有 nested layout 时新建；否则用既有 `account-security/_layout.tsx`。决策由实施时观察既有结构后定。

#### T5.2：AuthStore.status FROZEN 前置拦截

复用既有 `useAuthStore.status` 字段；page 内 `useEffect` 监听：

```text
useEffect(() => {
  if (status === 'FROZEN') {
    setHookState('FROZEN');  // skip GET /me
  }
}, [status]);
```

不改 AuthStore 实现；仅消费。

**Verify**: 既有 AuthStore tests + T2 hook test 中 FROZEN case

---

### T6 [Error mapping]：扩 mapApiError

#### T6-test：扩 lib/api/error.test.ts

新增 case 覆盖 8 条 REALNAME\_\* 错误码 + 3 条 failed_reason → 文案映射（per spec FR-007）

#### T6-impl：扩 lib/api/error.ts

加 8 条 errorCode → 文案映射 + 3 条 failed_reason → 文案映射；保持既有契约（其他错误码不动）

**Verify**: T6-test 全 GREEN + 全包 typecheck GREEN

---

### T7 [Enable entry]：account-security/index.tsx 第 11 行 disabled → enabled

#### T7-test：`account-security/__tests__/index.test.tsx` amend

定位 line 70 / 120（既有 disabled tap 测试）：

- 改"disabled tap (实名认证) → no router call" → "tap (实名认证) → router push to realname"
- 改"renders Card 1 — 手机号 entry + 实名认证 disabled..." → "renders Card 1 — 手机号 entry + 实名认证 enabled..."

#### T7-impl

定位 `apps/native/app/(app)/settings/account-security/index.tsx`：

- 删 `realname` 项的 `disabled: true`（或类似禁用标记）
- 设 `onPress: () => router.push('/settings/account-security/realname')`

**Verify**: T7-test GREEN + 既有测试 0 regression

---

### T8 [Smoke]：真后端冒烟 (server dev-bypass)

新建 `apps/native/runtime-debug/2026-05-XX-realname-business-flow/` 目录 + Playwright script：

- 前置：本机 docker compose up server + redis + postgres；server `MBW_REALNAME_DEV_BYPASS=true` + `_FIXED_RESULT=verified`
- script 自动化：
  1. login（既有 phone-sms-auth 流程）
  2. 进入 `/settings/account-security/realname`
  3. 截图：UNVERIFIED 录入页
  4. 填测试身份证号 `110101199001011237` + 姓名"张三" + 勾选协议 + 提交
  5. 等 H5 livenessUrl 跳转（bypass 直接返结果）
  6. 截图：PENDING 等待页
  7. 自动轮询完成
  8. 截图：VERIFIED readonly 页
  9. 验证 mask 字段：`*三` + `1***************7`
- 截图归档目录提交进 git（runtime-debug 路径已 git tracked）

**Verify**: 4 截图齐全 + 视觉无明显错位（占位 UI 阶段不要求美观，要求功能正确）

---

## PHASE 2 Mockup（user 跑 Claude Design 后）

### T9 [Design]：mockup-prompt + Claude Design 产出

> **由 user 跑**（per ADR-0017 + 既有 onboarding / login / delete-cancel-deletion 模式）。

新建 `apps/native/spec/realname/design/mockup-prompt.md`：

- 描述图 1 录入页 + 图 3 readonly 视图（图 2 SDK 接管不画）
- 引用现有 token 系统（`packages/design-tokens`）；约束：byte-identical token 集，0 新增
- 产出物：`design/source/*.tsx` mockup 文件 + `design/handoff.md` 翻译期决策

**实施时机**：T8 真后端冒烟过 → T9 由 user 触发

---

### T10 [Translate]：handoff.md + plan.md UI 段回填

由本 spec 维护者翻译 `design/source/` mockup 到具体 className / packages/ui 组件复用清单：

- 写 `design/handoff.md`：组件 mapping / token 映射 / drift 政策
- 回填 `plan.md` § UI 结构（替换占位版为完整版，参考 onboarding plan.md PHASE 2 后的 UI 段格式）

---

### T11 [UI Impl]：UI 完成 + 替换占位

按 handoff.md 翻译结果改 `realname/index.tsx`：

- 替换占位 `<View>` / `<Text>` 为 NativeWind className 的视觉实现
- 复用 `packages/ui` 组件（`PrimaryButton` / `TextInput` / `Card` / `ErrorRow` 等，per handoff 决策）
- 加 a11y props（`accessibilityLabel` / `accessibilityHint` / `accessibilityRole` / `accessibilityState`）
- 删 PHASE 1 banner 注释
- 既有 vitest test 0 regression（视觉不影响行为）

**Verify**: 视觉对照 mockup + a11y 维度全覆盖 + vitest 全 GREEN

---

## 实施记录（impl ship 后填写，per memory `feedback_implement_owns_tasks_md_sync`）

> 待 PHASE 1 / PHASE 2 implement 阶段每个 task ship 后回填 PR # / commit ref + 标 ✅。

---

## References

- [`./spec.md`](./spec.md) / [`./plan.md`](./plan.md)
- [server spec/account/realname-verification/tasks.md](https://github.com/xiaocaishen-michael/my-beloved-server/blob/main/spec/account/realname-verification/tasks.md) — 后端 tasks 对照
- 既有参考：[`apps/native/spec/onboarding/tasks.md`](../onboarding/tasks.md) — 类 1 PHASE 1 / PHASE 2 拆分参照
- 既有参考：[`apps/native/spec/login/tasks.md`](../login/tasks.md) — form 类 1 tasks 拆分参照
- 既有参考：[`apps/native/spec/delete-account-cancel-deletion-ui/tasks.md`](../delete-account-cancel-deletion-ui/tasks.md) — 含 PHASE 2 mockup 落地的 tasks 参照
