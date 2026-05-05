# Runtime debug session: onboarding business flow (M1.2 phase 2 / SDD T7)

- **Date**: 2026-05-05 18:45 ~ 18:46 CST
- **Branch / SHA**: app `feat/onboarding-profile-gate` @ T6 (commit `fe595cb`); server `main` post-PR #127 (account-profile + JwtAuthFilter merged)
- **Phase**: ADR-0017 类 1 PHASE 1 — 占位 UI 业务流冒烟（mockup PHASE 2 由 user 后续跑 Claude Design）
- **Tool**: `apps/native/runtime-debug/2026-05-05-onboarding-business-flow/run.mjs`（Playwright headless Chromium，viewport 390×844）
- **Server profile**: dev（`SPRING_PROFILES_ACTIVE=dev MBW_AUTH_JWT_SECRET=test-secret-... DATASOURCE_PASSWORD=mbw ./mvnw -pl mbw-app spring-boot:run`）
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm web`（Metro :8081）

## Scenarios

| #   | Scenario                                           | Result | Screenshots       | Notes                                                                                                                                                                                                                       |
| --- | -------------------------------------------------- | ------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Happy 新用户首登 → onboarding → home（**主路径**） | ✅     | 01 → 02 → 03 → 04 | fresh phone `+8613922224444`（DB 不存在）→ phoneSmsAuth 自动创建 ACTIVE account（id=5，displayName=null）→ `loadProfile()` 写 store → AuthGate 跳 `/(app)/onboarding` → `updateDisplayName('小明')` → AuthGate 跳 `/(app)/` |

## Verifications

### DB state（`account.account`）

```sql
SELECT id, phone, status, display_name FROM account.account WHERE phone = '+8613922224444';

 id |     phone      | status |  display_name
----+----------------+--------+----------------
  5 | +8613922224444 | ACTIVE | 小明           -- ✅ display_name 写入正确
```

### Final URL & route progression

```text
1. http://localhost:8081/                  (initial)
2. http://localhost:8081/login             (AuthGate 一态：!auth → /(auth)/login)
3. http://localhost:8081/onboarding        (AuthGate 二态：auth + displayName==null)
4. http://localhost:8081/                  (AuthGate 三态：auth + displayName="小明")
```

### Console / network / pageerror（runtime-debug.mjs 报告）

| 维度            | 计数 | 说明                                                                                                                                                                                                  |
| --------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageErrors`    | 0    | ✅                                                                                                                                                                                                    |
| `networkFails`  | 0    | ✅                                                                                                                                                                                                    |
| `consoleErrors` | 1    | ⚠️ 单条 `Failed to load resource: status 429 ()`，与 happy 路径无因果 — 是上一轮调试 fail run（10:44）触发的 SMS `sms-60s:<phone>` 限流计数器在本次 run（10:45）窗口内仍未释放。下次 fresh 跑会消失。 |

### 客户端调用链（per code）

1. `apps/native/app/(auth)/login.tsx` `useLoginForm.submit` → `packages/auth.phoneSmsAuth(phone, code)`
2. → `getAccountAuthApi().phoneSmsAuth({ phoneSmsAuthRequest: {phone, code} })` POST `/api/v1/accounts/phone-sms-auth`
3. server unified auth：phone 不存在 → 自动创建 ACTIVE account + PhoneCredential，sign access/refresh tokens
4. `phoneSmsAuth` wrapper 末尾 `await loadProfile().catch(...)` → `getAccountProfileApi().getMe()` GET `/api/v1/accounts/me`
5. server 返回 `AccountProfileResponse {accountId, displayName: null, status: 'ACTIVE', createdAt}` → `useAuthStore.setDisplayName(null)`
6. `_layout.tsx` AuthGate 监听 `displayName` 变化 → `decideAuthRoute({isAuth:true, displayName:null, ...})` → `replace /(app)/onboarding`
7. `app/(app)/onboarding.tsx` `useOnboardingForm.submit` → `packages/auth.updateDisplayName('小明')`
8. → `getAccountProfileApi().patchMe({updateDisplayNameRequest: {displayName: '小明'}})` PATCH `/api/v1/accounts/me`
9. server 写 DB + 返回 `{displayName: '小明', ...}` → `useAuthStore.setDisplayName('小明')`
10. AuthGate 三态 → `replace /(app)/`

## Test data preparation

- 测试 phone `+8613922224444`：fresh，DB 不存在 → server unified auth 自动创建（per ADR-0016）
- SMS code `999999`：直接 seed Redis BCrypt hash 跳过真 SMS 通道

```bash
# UI 点击 "获取验证码" 后立即 race-fix seed redis
HASH='$2b$08$QIEcSjkMkeyQv.36D3525OVAsH95QUrF/f9sh98pMcz9FSfOzs426'  # bcrypt of '999999'
docker exec mbw-redis redis-cli HSET 'sms_code:+8613922224444' codeHash "$HASH" attemptCount 0
docker exec mbw-redis redis-cli EXPIRE 'sms_code:+8613922224444' 300
```

## SC 验收

- [x] **SC-001**：新用户 happy path 业务流单测 + 真后端冒烟全绿（unit 92 + smoke 完整链路）
- [x] **SC-002**：AuthGate 三态决策表 9+1 case 单测全过（per [`auth-gate-decision.test.ts`](../../lib/auth/auth-gate-decision.test.ts)）
- [x] **SC-003**：phoneSmsAuth 函数体不读 `response.displayName`（grep 静态分析守住，per `usecases.ts` commit message）
- [x] **SC-004**：displayNameSchema 8+ case 镜像 server FR-005（per [`onboarding.test.ts`](../../lib/validation/onboarding.test.ts) 14 case）
- [x] **SC-005**：占位 UI 0 视觉决策（grep `#hex|px|rgb|@nvy/ui|@nvy/design-tokens` 无命中）
- [x] **SC-006**：logout 清空 displayName（per [`store.test.ts`](../../lib/auth/store.test.ts) clearSession case）
- [x] **SC-007**：rehydrate 不抖（hasHydrated 守 + SplashPlaceholder，per `_layout.tsx`）
- [x] **SC-008**：真后端冒烟通过 — 本 README + 4 张截图 + DB row 验证

## 结论

✅ **happy path PASS** — onboarding 业务流完整闭环：

- AuthGate 三态决策正确分发：login → onboarding → home
- `loadProfile` 经独立 GET /me 拿 displayName=null（反枚举不变性守住）
- `updateDisplayName('小明')` 经 PATCH /me 写 DB display_name 列
- 占位 UI 4 边界（路由 / 输入 / 提交 / 状态错误）业务流 functional

mockup PHASE 2 视觉决策（间距 / 颜色 / 字号 / 阴影 / 自定义动画）由用户后续跑 Claude Design 落地。
