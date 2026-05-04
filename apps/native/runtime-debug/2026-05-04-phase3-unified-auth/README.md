# Runtime debug session: login page (M1.3 phase 3 真后端冒烟)

- **Date**: 2026-05-04 13:30 ~ 13:42 CST
- **Branch / SHA**: `main` post-PR #52（react-native-svg 升级 merged）
- **Phase**: ADR-0017 phase 3 真后端冒烟（业务流先行 + mockup 后置 类 1 流程末段验证）
- **Tool**: `apps/native/tools/runtime-debug.mjs`（Playwright headless Chromium，viewport 390×844）
- **Server profile**: dev（`SPRING_PROFILES_ACTIVE=dev` + DevCorsConfig 允 :8081）
- **Backend setup**:
  - `docker compose -f docker-compose.dev.yml up -d`（PG / Redis / MinIO 全 healthy）
  - `mvnw -pl mbw-app spring-boot:run` with mock SMS env（`MBW_SMS_PROVIDER=mock` + `MBW_EMAIL_PROVIDER=resend` + Resend API key + `MOCK_SMS_RECIPIENT=zhangleipd@aliyun.com` + `MOCK_SMS_FROM=noreply@mail.xiaocaishen.me`，per ADR-0013 amendments）
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080` + `pnpm web`（Metro :8081）
- **Test phone**: `+8613800138000`（DB ACTIVE，daily 5-03 残留账号；不必重新注册）

## Scenarios

| #   | Scenario                 | Result     | Screenshots  | Notes                                                                                                                                          |
| --- | ------------------------ | ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 401 错码                 | ✅         | 01 → 02 → 03 | fill 假码 `999999` → submit → server 401 → mapApiError → ErrorRow "手机号或验证码错误"                                                         |
| 2   | Happy 已注册             | ✅         | 04 → 05 → 06 | fill 真 LOGIN code `865157`（user 邮箱 paste）→ submit → server 200 → AuthGate redirect 到 `(app)/index.tsx` 主页                              |
| 3   | Network 后端 down        | ✅         | 07 → 08      | `pkill MbwApplication` → fill 假码 → submit → `net::ERR_CONNECTION_REFUSED` → FetchError → mapApiError → ErrorRow "网络异常，请检查网络后重试" |
| 4   | 429 限流                 | ⚠️ skip    | —            | UI 60s 内 button disable，真后端 UI 路径不易触发；server side IT + 单测已覆盖                                                                  |
| 5   | Happy 未注册（自动注册） | ❌ pending | —            | server unified PR 落地后补（packages/auth wrapper 切到新 endpoint）                                                                            |

## Verifications

### Backend log（关键 INFO 行）

```text
13:38:04.902 MockSmsCodeSender: [mock-sms] sent template=SMS_REGISTERED_B to phone=+8613800138000
13:41:00.278 MockSmsCodeSender: [mock-sms] sent template=SMS_REGISTER_A to phone=+8613800138000 (LOGIN code 走 Template A 反枚举与 register 共享)
13:42:05 LoginByPhoneSmsUseCase 200 (happy submit)
```

### DB state changes

happy submit 后 12s 内 DB 反映：

```sql
SELECT id, phone, status, last_login_at FROM account.account;
-- id=1 phone=+8613800138000 status=ACTIVE last_login_at=2026-05-04 05:42:05.891146+00 (UTC，与 happy submit 时刻匹配)
```

### Console errors / network fails（runtime-debug.mjs 报告）

| Scenario | pageErrors | consoleErrors                      | networkFails                                                      |
| -------- | ---------- | ---------------------------------- | ----------------------------------------------------------------- |
| 401      | []         | 1 (`Failed to load resource: 401`) | []                                                                |
| Happy    | []         | []                                 | []                                                                |
| Network  | []         | 1 (`net::ERR_CONNECTION_REFUSED`)  | 1 (`POST /api/v1/auth/login-by-phone-sms ERR_CONNECTION_REFUSED`) |

### 视觉确认（从截图）

| 元素                                                | 验证                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| LogoMark SVG（蓝色圆角矩形 + 12 道光线 + 橙色 sun） | ✅ react-native-svg 升级生效（PR #52）                           |
| WechatButton SVG（双气泡 classic）                  | ✅                                                               |
| Apple Button — Web 不渲染                           | ✅ `Platform.OS === 'ios'` conditional 工作                      |
| close × 顶部按钮                                    | ✅（mockup v2 drift 1）                                          |
| ErrorRow 红圆 ! + 文案                              | ✅                                                               |
| 协议同意 "《服务条款》与《隐私政策》"               | ✅ "与" 字补齐（mockup v2 drift 4）                              |
| CTA 文案 "登录"                                     | ✅（mockup 写 "登录 / 注册"，drift fix 改回，mockup v2 drift 2） |
| mapApiError 401 文案删 "密码"                       | ✅                                                               |

## 结论

✅ **3 scenario PASS**（401 / happy / network），完整业务流端到端验通。

**留下次**（与 phase 3 plan 一致）：

- **429**：单测 + server IT 已覆盖；真后端 UI 路径下 60s button disable 难自然触发
- **Happy 未注册（自动注册）**：等 server unified endpoint impl PR 落地后补（packages/auth `phoneSmsAuth` wrapper 切到新 endpoint，本 session 仍调既有 `loginByPhoneSms`）

## ADR-0017 类 1 流程实证完整闭环

| Phase                   | PR             | 关键产出                                                            |
| ----------------------- | -------------- | ------------------------------------------------------------------- |
| 1 — 业务流 + 占位 UI    | #50            | hook 5 状态机 + validation + login.tsx 占位 + 42 tests 全绿         |
| 2 — Mockup v2 + UI 完成 | #51            | mockup 落地 + handoff + spec/plan 修订 + packages/ui 改造 + UI 完成 |
| 2.5 — SVG 升级          | #52            | LogoMark / WechatButton 真 SVG（react-native-svg）                  |
| **3 — 真后端冒烟**      | （本 session） | **3 状态自动化 PASS + 视觉确认 mockup v2 drift fix 全部正确**       |

ADR-0017（业务流先行 + mockup 后置）首发实证：业务流不阻塞 mockup / sunk cost 最小（仅占位 UI ~50 行 + mockup v2 重做）/ 业务流早验证（phase 1 42 tests 全绿即可信心 phase 3 行为）/ mockup 决策可基于实际状态机（5 状态 + errorScope 双场景）。
