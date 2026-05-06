# Runtime debug session: onboarding 4-state visual smoke (M1.2 phase 2 / SDD T_smoke)

- **Date**: 2026-05-06 09:04 CST
- **Branch / SHA**: app `feature/onboarding-mockup-smoke` (post mockup translation [PR #66](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/66) `47d7dbd`); server `main`
- **Phase**: ADR-0017 类 1 PHASE 2 落地后 visual smoke — 4 个 status 形态（idle / submitting / success / error）视觉稳定性回归
- **Tool**: `apps/native/runtime-debug/2026-05-06-onboarding-mockup-translation/run.mjs`（Playwright headless Chromium，viewport 390×844）
- **Server profile**: dev（`SPRING_PROFILES_ACTIVE=dev` + `.env.local` source）
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm web`（Metro :8081）

## 与 PHASE 1 冒烟（[`2026-05-05-onboarding-business-flow/`](../2026-05-05-onboarding-business-flow/README.md)）的区分

| 维度       | PHASE 1（business flow）                                                   | PHASE 2（visual smoke）                                    |
| ---------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 目的       | 验证 AuthGate 三态决策 + loadProfile + updateDisplayName 业务闭环；DB 写入 | 验证 mockup translation 后 4 个 hook 状态的视觉态稳定可读  |
| 真后端调用 | ✅ phoneSmsAuth + GET /me + PATCH /me 全真实                               | 仅 phoneSmsAuth + GET /me（登录态预热）；PATCH /me 全 mock |
| DB 验证    | display_name 写入 `小明`                                                   | display_name 保持 `null`（mock 不污染 DB）                 |
| 截图数     | 4 张（happy 链路 4 节点）                                                  | 4 张（同一页 4 状态）                                      |

## Scenarios

| #   | Scenario   | Result | Screenshot                           | 视觉验收点                                                                                                                                                        | 构造方式                                                                                                                                                |
| --- | ---------- | ------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | idle       | ✅     | [01-idle](./01-idle.png)             | LogoMark + "完善个人资料" 标题 + focused 输入框（蓝色 border-brand-500）+ `0/32` 计数（灰）+ 提示文 + 提交按钮 disabled（淡蓝）+ 底部"昵称可在「设置」中随时修改" | 进入 onboarding 页不输入不提交                                                                                                                          |
| 02  | submitting | ✅     | [02-submitting](./02-submitting.png) | 输入 `小明` `2/32` + 提交按钮切到 `提交中...`（深蓝实底 loading）+ 输入框淡化（disabled）+ a11y 按钮 disabled                                                     | `page.route` 拦 PATCH `/me`（hold + abort + waitDone 三段，确保 server 永不收到请求）click 提交后 waitFor "提交中..." 截图                              |
| 03  | success    | ✅     | [03-success](./03-success.png)       | 全屏 `<SuccessOverlay/>`：居中 `<SuccessCheck/>` 绿勾 + "完成！" 标题 + `<Spinner size=12 tone=muted/>` + "正在进入今日时间线…"                                   | mock PATCH `/me` 200 但 body `displayName=null` —— hook setStatus(success) 但 store.displayName 仍 null，AuthGate 不 redirect → SuccessOverlay 视觉稳定 |
| 04  | error      | ✅     | [04-error](./04-error.png)           | 输入 `小明` `2/32` + `<ErrorRow text="昵称不合法，请重试"/>`（红 ❗）+ 提交按钮 enabled（蓝色实底）                                                               | mock PATCH `/me` 400 + body `{code: "INVALID_DISPLAY_NAME"}` → mapOnboardingApiError → setErrorMessage                                                  |

## 视觉一致性（vs login v2 design tokens）

PR #66 通过 0 新增 token 落地 mockup translation —— 全套复用 login `tailwind.config.js`：

- **品牌色**：提交按钮 `bg-brand-500`（idle/submitting）+ ErrorRow `bg-err-50` 红条
- **状态视觉**：focused 输入框 `border-brand-500`，errored `border-err`，disabled `opacity-60`
- **复用 @nvy/ui 组件**：5 个（`Spinner / SuccessCheck / LogoMark / ErrorRow / PrimaryButton`），`DisplayNameInput / SuccessOverlay` inline（once-only）
- **占位反例**：本批截图无 hex/rgb/px 字面量；全部走 design-tokens + className（grep 静态分析在 PHASE 1 SC-005 已固化）

## 实现要点（hold + abort + waitDone）

scenario 02 hang 策略撞坑 3 次后定型为：

```js
let releaseHold, signalAbortDone;
const holdPromise = new Promise((r) => (releaseHold = r));
const abortDonePromise = new Promise((r) => (signalAbortDone = r));

await page.route(ME_URL, async (route) => {
  if (route.request().method() === 'PATCH') {
    await holdPromise; // 阶段 1：截图前一直 await
    try {
      await route.abort('aborted');
    } catch {}
    signalAbortDone(); // 阶段 2：abort 完成才放行
  } else {
    route.continue();
  }
});

// click 提交 + waitFor "提交中..." + screenshot
releaseHold();
await abortDonePromise; // 阶段 3：必等 abort 完才能 unroute
```

**踩坑实录（共 3 次）**：

1. `return;` 不等于 hang —— Playwright 把 handler return 视为 "no action" → fall back 到 continue() 走真后端 ⇒ DB 写入 `小明`。
2. `return new Promise(() => {})` 永不 resolve —— 同样发生，handler 在 unroute 时 fall through。
3. 显式 `await holdPromise` + `route.abort` —— 看似 OK，但 `unroute` 调用时 handler 仍在 abort 异步等待中，Playwright fall-through 仍把请求放行 ⇒ DB 仍写 `小明`。
4. **修复**：增加 `signalAbortDone()` 信号量，主线程 `await abortDonePromise` 后才允许 unroute / reload，确保 abort 在 handler 注册期内完成。

本 README 即该 pattern 的实证存档；下次撞到 Playwright hang/abort race（visual smoke / network failure 模拟）可直接 grep `signalAbortDone` 复制 4 行三段式。若复用频次起来再单独抽 experience playbook。

## Verifications

### Network log（page.on('request')）

```text
[REQ] POST /api/v1/accounts/phone-sms-auth        ← 一次性登录预热
[REQ] GET  /api/v1/accounts/me                     ← loadProfile 真实 GET
[RESP] 200 /api/v1/accounts/me                     ← server 返 displayName=null

scenario 02-submitting:
  [REQ]  PATCH /api/v1/accounts/me                 ← Playwright 截到，holdPromise 等
  ↳ intercepted (held)
  ↳ released → abort                                ← abort 后 server 永远收不到

scenario 03-success:
  [REQ]  PATCH /api/v1/accounts/me                 ← 截到
  [RESP] 200 (mocked)                              ← Playwright fulfill 200，1ms 内返回（vs 真后端 ~10-50ms）

scenario 04-error:
  [REQ]  PATCH /api/v1/accounts/me                 ← 截到
  [RESP] 400 (mocked)                              ← fulfill 400 INVALID_DISPLAY_NAME
```

### DB state（confirms zero pollution）

```sql
SELECT id, phone, status, display_name FROM account.account WHERE phone = '+8613922225555';

 id |     phone      | status | display_name
----+----------------+--------+--------------
 12 | +8613922225555 | ACTIVE |              -- ✅ display_name 仍 null（PATCH 全 mocked）
```

### Console / network / pageerror 报告

| 维度            | 计数 | 说明                                                                                                |
| --------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `pageErrors`    | 0    | ✅                                                                                                  |
| `networkFails`  | 0    | ✅                                                                                                  |
| `consoleErrors` | 0    | ✅（scenario 04 mock 400 必触发的 `Failed to load resource: 400` 已在脚本中显式滤掉，因系预期噪音） |

### 已知非问题

- 02-submitting 截图左下角小⚡ icon = RN-Web dev-mode Fast Refresh 指示器，prod build 不出现，无需视觉处理。

## Test data preparation

- 测试 phone `+8613922225555`：fresh，DB 不存在 → 脚本启动前 DELETE 三表（refresh_token / credential / account）+ Redis DEL（防 stale）→ phoneSmsAuth 自动创建 ACTIVE account（per ADR-0016 unified auth）
- SMS code `999999`：直接 seed Redis BCrypt hash 跳过真 SMS 通道（与 PHASE 1 同源）

## 与 spec 验收点

- ✅ **PHASE 2 T_smoke**：4 状态截图归档完整 + run.mjs exit 0 + 视觉与 PR #66 mockup translation 1:1 对齐
- ✅ **不污染 DB**：display_name 保持 null（PHASE 1 已覆盖业务流的 DB 写入路径）
- ✅ **mockup ↔ implementation 一致性**：所有 className / token / 文案与 [`design/handoff.md`](../../spec/onboarding/design/handoff.md) 7 段约定一致

## 结论

✅ **4 状态视觉冒烟 PASS** — onboarding 页 mockup translation 视觉端无回归：

- idle / submitting / success / error 4 态视觉清晰可读
- 状态切换由 hook + UI 双驱动（status state + AuthGate 不 redirect），稳定可截图
- DB 零污染，mock 严密（hold + abort + waitDone 三段式锁住 PATCH `/me`）

后续若引入 visual regression 工具（per [`tasks.md`](../../spec/onboarding/tasks.md) T11，M2+），本批 4 张 PNG 可直接作为基线。
