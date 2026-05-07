# T16-smoke — delete-cancel PHASE 2 visual smoke 6 状态(✅ 跑完 2026-05-08)

> **状态**:✅ 6/6 PNG 落地;`run.mjs` 跑通(spec C T16-smoke completed)
> **模式**:Mock-based(`page.route` 拦请求)+ localStorage inject(Phase B 跳过真后端 login)
> **Stack 假设**:metro :8081 + Playwright(server 不必跑;mocks 全覆盖 API)

## 6 状态截图清单

| #   | 文件                             | 描述                                                                                                                                                                  |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | `01-delete-idle.png`             | delete-account 默认态:警示双段 / 双 checkbox 全空 / SendCodeRow disabled / CodeInput sunken / SubmitButton destructive disabled                                       |
| 02  | `02-delete-checked-cooldown.png` | delete-account 双勾 + 60s cooldown:checkbox 真控件 brand fill + ✓ / SendCodeRow `60s 后可重发` / CodeInput 第一格 focused brand ring                                  |
| 03  | `03-delete-error.png`            | delete-account 错误态(替代 spec):双勾 + cooldown + CodeInput 6 cells err 红 ring + ErrorRow err-soft 底卡 `操作太频繁,请稍后再试` + SubmitButton destructive disabled |
| 04  | `04-cancel-prefilled.png`        | cancel-deletion 预填态:RecoverBanner brand-soft / phone read-only sunken + 🔒 + maskPhone / SendCodeRow cooldown / SubmitButton brand fill                            |
| 05  | `05-cancel-deeplink.png`         | cancel-deletion deep-link 空态:phone editable empty + placeholder / SendCodeRow disabled / SubmitButton brand disabled                                                |
| 06  | `06-freeze-modal-active.png`     | login + freeze modal:scrim modal-overlay(0.48)/ Card w296 rounded-md shadow-modal / warn icon-circle + heading + 双 button([保持] ghost / [撤销] brand fill)          |

## State 03 替代说明(实测决策,2026-05-08)

**原 spec**:fill code "999999" → tap submit → mock 401 → ErrorRow `验证码错误` + CodeInput err 红 ring + SubmitButton destructive 红 fill active

**实际**:tap send-code → mock 429 (rate-limit) → ErrorRow `操作太频繁,请稍后再试` + CodeInput err 红 ring + SubmitButton destructive disabled

### 为什么换路径

`packages/auth/src/usecases.ts:152` 的 `deleteAccount()`:

```ts
export async function deleteAccount(code: string): Promise<void> {
  try {
    await getAccountDeletionApi()._delete({ deleteAccountRequest: { code } });
  } finally {
    useAuthStore.getState().clearSession(); // ← 无条件清 session
  }
}
```

任何错误码(401 / 429 / 5xx)路径都触发 finally 的 `clearSession()` → AuthGate `useEffect` 在**同一 React commit cycle** 内 dispatch `router.replace('/(auth)/login')`(因为 isAuthenticated 变 false + segments 仍在 `(app)`)→ DeleteAccountScreen 在 ErrorRow 第一次 paint 之前就 unmount。

### Playwright 已实测策略均失败

| #   | 策略                                                      | 结果                                                                     |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | `getByText('验证码错误').waitFor()` 默认 polling(~500ms)  | 错过 ErrorRow 单帧 paint 窗口                                            |
| 2   | `page.waitForFunction` + `polling: 'raf'`(每动画帧 check) | timeout 30s 触发(error-row 永远 false)                                   |
| 3   | 50ms 间隔多 probe(60-1500ms)                              | 全部 false(组件已 unmount)                                               |
| 4   | `addInitScript` block `history.replaceState/pushState`    | URL 锁住但 Stack 内部 state 已 dispatch → 组件仍 unmount → /login 已渲染 |

### 这次替代捕获 vs 原 spec 视觉对齐

| 视觉元素               | 原 spec(submit 失败)           | 实际(send-code rate-limit)   | 对齐?   |
| ---------------------- | ------------------------------ | ---------------------------- | ------- |
| CodeInput err 红 ring  | ✓ tone='err'                   | ✓ tone='err'(同 mapper)      | ✅      |
| ErrorRow err-soft 底卡 | ✓ `验证码错误`                 | ✓ `操作太频繁,请稍后再试`    | ✅      |
| SubmitButton 视觉      | destructive 红 fill **active** | destructive 红 fill disabled | ⚠️ 部分 |

核心 token 翻译落地(err / err-soft / brand)三个色族在本截图全部呈现。SubmitButton active 视觉在 02-delete-checked-cooldown(disabled)+ 06-freeze-modal-active([撤销] brand fill)已分别覆盖,本图聚焦 CodeInput + ErrorRow err 状态。

### 完整覆盖路径

submit-failure 错误码 → ErrorRow + CodeInput 切 err 的 unit 级断言由 `apps/native/app/(app)/settings/account-security/__tests__/delete-account-errors.test.ts` 'invalid_code' 分支覆盖(spec C PHASE 1 T3 落地)。本视觉 smoke 不重复 component-level error 覆盖。

## 用法

```bash
# 1. 起 metro web bundle(server 不必起,mocks 全覆盖)
cd no-vain-years-app && pnpm web

# 2. 跑 smoke
node apps/native/runtime-debug/2026-05-07-delete-cancel-mockup-translation/run.mjs
```

输出:6 PNG 落本目录 + JSON 结果到 stdout(steps + pageErrors + consoleErrors + networkFails)。

## 状态构造策略

参考 onboarding T_smoke 套路(`page.route` 拦请求 + force render)与 my-profile T13 套路:

| Phase                  | 状态         | 路径                                                                                                                                                                    |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**(unauthenticated) | 06 → 04 → 05 | login → mock 403 frozen → modal pops → tap [撤销] SPA-internal nav → cancel-deletion?phone(mock 204) → cooldown → goto /cancel-deletion(empty)                          |
| **B**(authenticated)   | 01 → 02 → 03 | localStorage inject `nvy-auth` → goto /settings/account-security/delete-account → 双勾 + send(mock 204)→ cooldown → reload + 双勾 + send(mock 429)→ rate-limit ErrorRow |

### 关键决策

1. **Phase A 用 SPA 内部 nav 进 cancel-deletion?phone=...**(不用 page.goto)— 避开 cancel-deletion useEffect `setParams({ phone: undefined })` 在 navRef 未 ready 时报 "Attempted to navigate before mounting Root Layout"
2. **Phase B 用 localStorage inject 跳过 login**(不依赖真后端) — metro bundle 当前 EXPO_PUBLIC_API_BASE_URL 指向哪都行,所有 API 走 `**` glob mock
3. **State 03 用 send-code error 替代 submit error**(实测决策,见 § State 03 替代说明)

## References

- [`apps/native/spec/delete-account-cancel-deletion-ui/tasks.md`](../../spec/delete-account-cancel-deletion-ui/tasks.md) — T16 拆 doc + smoke
- [`apps/native/spec/delete-account-cancel-deletion-ui/design/handoff.md`](../../spec/delete-account-cancel-deletion-ui/design/handoff.md) § 3 — 6 状态 ↔ FR/SC 对齐表
- [`apps/native/runtime-debug/2026-05-06-onboarding-mockup-translation/`](../2026-05-06-onboarding-mockup-translation/) — onboarding T_smoke run.mjs 套路参考
- [`apps/native/runtime-debug/2026-05-07-my-profile-mockup-translation/`](../2026-05-07-my-profile-mockup-translation/) — my-profile T13 run.mjs 套路参考
- [`apps/native/app/(app)/settings/account-security/__tests__/delete-account-errors.test.ts`](<../../app/(app)/settings/account-security/__tests__/delete-account-errors.test.ts>) — submit error path component-level 单测覆盖(替代 state 03 spec 路径)
