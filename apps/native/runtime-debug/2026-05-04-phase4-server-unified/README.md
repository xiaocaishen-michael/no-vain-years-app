# Runtime debug session: login page (M1.3 phase 4 server unified follow-up)

- **Date**: 2026-05-04 15:40 ~ 16:15 CST
- **Branch / SHA**: app `feat/unified-auth-wrapper-switch`（pre-merge），server `main` post-PR #118（unified auth endpoint merged）
- **Phase**: ADR-0017 phase 3+ follow-up — server unified endpoint impl 落地后验证 wrapper 切换 + 未注册自动注册（phase 3 留的 gap）
- **Tool**: `apps/native/tools/runtime-debug.mjs`（Playwright headless Chromium，viewport 390×844）
- **Server profile**: dev（local spring-boot:run with mock SMS env，per ADR-0013 amendments）
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080` + `pnpm web`（Metro :8081）

## Pre-impl 状态

- 已完成 [server PR #118](https://github.com/xiaocaishen-michael/my-beloved-server/pull/118)（unified phone-SMS auth impl，T0-T6）— 4 旧 endpoint 删除，新 `POST /api/v1/accounts/phone-sms-auth` 替代
- 本 session 验证 app 仓 follow-up：`pnpm api:gen:dev` 拉新 spec + `packages/auth.phoneSmsAuth` wrapper 切到新 endpoint + `useLoginForm.requestSms` 删 `purpose: 'LOGIN'` 字段

## Scenarios

| #   | Scenario                        | Result | Screenshots  | Notes                                                                                                                                                                                 |
| --- | ------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Happy 已注册 (wrapper 切换验证) | ✅     | 01 → 02 → 03 | phone `+8613800138000` (DB seed from daily 5-03) + code `999999` (Redis seeded) → `/api/v1/accounts/phone-sms-auth` 200 → `last_login_at` 更新 → AuthGate redirect                    |
| 2   | **Happy 未注册自动注册** ⭐     | ✅     | 04 → 05 → 06 | phone `+8613900139000` (DB 不存在) + code `999999` (Redis seeded) → server 自动创建 ACTIVE account id=2 + PhoneCredential id=3 + sign tokens → AuthGate redirect 到 `(app)/index.tsx` |

## Verifications

### DB state changes

```sql
SELECT id, phone, status, created_at, last_login_at FROM account.account ORDER BY id;

 id |     phone      | status |          created_at           |         last_login_at
----+----------------+--------+-------------------------------+-------------------------------
  1 | +8613800138000 | ACTIVE | 2026-05-03 12:53:52.347855+00 | 2026-05-04 08:09:49.200352+00  -- 已注册号刚更新
  2 | +8613900139000 | ACTIVE | 2026-05-04 08:10:04.253848+00 | 2026-05-04 08:10:04.253848+00  -- 未注册号自动创建
```

```sql
SELECT id, account_id, type FROM account.credential;

 id | account_id |   type
----+------------+----------
  1 |          1 | PHONE       -- 5-03 daily 注册留下
  2 |          1 | PASSWORD    -- 5-03 daily 注册留下
  3 |          2 | PHONE       -- ⭐ 自动注册新建（unified 模式仅创建 PhoneCredential，无 PASSWORD）
```

### Console errors / network fails (runtime-debug.mjs 报告)

| Scenario       | pageErrors | consoleErrors | networkFails |
| -------------- | ---------- | ------------- | ------------ |
| 已注册 happy   | []         | []            | []           |
| 未注册自动注册 | []         | []            | []           |

### 客户端调用链（per code）

1. `apps/native/lib/hooks/use-login-form.ts` → `submit(phone, code)`
2. `packages/auth.phoneSmsAuth(phone, code)` → `getAccountAuthApi().phoneSmsAuth({ phoneSmsAuthRequest: {phone, code} })`
3. HTTP `POST http://localhost:8080/api/v1/accounts/phone-sms-auth`
4. server 返回 `LoginResponse {accountId, accessToken, refreshToken}` 200
5. wrapper 内部 `useAuthStore.getState().setSession(...)` → AuthGate 监听 → `router.replace('/(app)/')`

## Test data preparation

- 已注册 phone `+8613800138000`：daily 5-03 留下的 seed account（DB 直留）
- 未注册 phone `+8613900139000`：fresh，DB 不存在
- SMS code `999999`：直接 seed Redis BCrypt hash 跳过 60s 限流 + 多次失败 invalidate 累积（debug 用，production 路径走真 Resend 邮件 + 5 分钟 TTL + 3 次 attempt invalidate）

```bash
# 准备 redis（debug 短路）
HASH='$2b$08$QIEcSjkMkeyQv.36D3525OVAsH95QUrF/f9sh98pMcz9FSfOzs426'  # bcrypt of '999999'
docker exec mbw-redis redis-cli HSET 'sms_code:+8613800138000' codeHash "$HASH" attemptCount 0
docker exec mbw-redis redis-cli HSET 'sms_code:+8613900139000' codeHash "$HASH" attemptCount 0
docker exec mbw-redis redis-cli EXPIRE 'sms_code:+8613800138000' 300
docker exec mbw-redis redis-cli EXPIRE 'sms_code:+8613900139000' 300
```

## 结论

✅ **2 scenarios PASS** — ADR-0016 unified phone-SMS auth 完整闭环（client wrapper 切换 + server 单接口自动判分支 + DB 自动创建 ACTIVE account）

**关键证据**：截图 06 显示未注册号提交后**直接 redirect 到 `(app)/index.tsx` 主页**（"no-vain-years / NativeWind primitives mounted"），用户视角**完全无 register 心智**（per ADR-0016 决策 1）— 大陆主流 app UX 范式正式落地。

## ADR-0016 + ADR-0017 完整闭环回顾

| Phase                                                 | PR                                                                               | 关键产出                                                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1 — 业务流 + 占位 UI（ADR-0017）                      | [app #50](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/50)      | hook 5 状态机 + validation + login.tsx 占位 + 42 tests                                                   |
| 2 — Mockup v2 + UI 完成                               | [app #51](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/51)      | mockup 落地 + handoff + spec/plan 修订 + packages/ui 改造 + UI 完成                                      |
| 2.5 — SVG 升级                                        | [app #52](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/52)      | LogoMark / WechatButton 真 SVG                                                                           |
| 3 — 真后端冒烟（过渡期 endpoint）                     | [app #53](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/53)      | 401 / happy / network 3 状态自动化 PASS（happy 走旧 `loginByPhoneSms` 过渡期 endpoint）                  |
| 3.5 — Server unified impl                             | [server #118](https://github.com/xiaocaishen-michael/my-beloved-server/pull/118) | 删 3 旧 endpoint + 新 `UnifiedPhoneSmsAuthUseCase` + 167 unit tests + 23 IT                              |
| **4 — App wrapper 切换 + 自动注册冒烟**（本 session） | app `feat/unified-auth-wrapper-switch`（pre-merge）                              | **wrapper 切到 `getAccountAuthApi().phoneSmsAuth()` + `requestSms` 删 purpose + 未注册自动注册 ⭐ 验通** |
