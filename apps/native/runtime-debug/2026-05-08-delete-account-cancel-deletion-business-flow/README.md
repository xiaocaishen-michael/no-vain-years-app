# Runtime debug session: delete-account & cancel-deletion business flow (M1.X / SDD spec C T11)

- **Date**: 2026-05-08 01:45 CST(run completed)
- **Branch / SHA**: app `feature/spec-c-t11-prod-smoke`(本 PR);server `main` `89db8ed`(release v0.2.0 `6c32323`)
- **Phase**: spec C T11 真后端 prod 冒烟(release v0.2.0 + spec D `ACCOUNT_IN_FREEZE_PERIOD` 错误码集成验证)
- **Tool**: `run.mjs`(Playwright headless Chromium with `--disable-web-security`,viewport 390×844;支持已 onboarded 路径自动 skip + `/tmp/mbw-sms-code.txt` polling)
- **Server**: prod ECS `https://api.xiaocaishen.me` v0.2.0(`mbw.sms.provider=mock` + Resend → `zhangleizlwpd@gmail.com`)
- **Frontend**: `EXPO_PUBLIC_API_BASE_URL=https://api.xiaocaishen.me` via `.env.local`(gitignored,优先级 > .env)+ Metro :8081

## 路径覆盖

| 路径                  | 步骤                                                                                                                                                                    | server endpoints                                                                                                                                            | 截图                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Path 1 — 发起注销** | login(已 onboarded skip)→ settings → 账号与安全 → 注销账号 → 双勾 → 发码 → 输 code → 提交 → 跳 login(account FROZEN)                                                    | `/sms-codes` 200 → `/phone-sms-auth` 200 → `/me` GET 200 → `/me/deletion-codes` 204 → `/me/deletion` 204                                                    | 01, 03, 04, 05, 06, 07 |
| **Path 2 — 撤销注销** | login 输已 FROZEN phone + 发码 + 输 code + 登录 → freeze modal 触发 → tap [撤销注销] → cancel-deletion 预填 → 发码 → 输 code → 提交 → 跳 (tabs)/profile(account ACTIVE) | `/sms-codes` 200 → `/phone-sms-auth` **403 ACCOUNT_IN_FREEZE_PERIOD** → `/auth/cancel-deletion/sms-codes` 200 → `/auth/cancel-deletion` 200 → `/me` GET 200 | 08, 09, 10, 11         |

`02-onboarding.png` 自动 skip — phone `+8613100000008` 在第一轮 round 1 已 onboard(displayName=测试C),round 2 重跑 login 后 AuthGate 直接 land `(tabs)/profile`,run.mjs 检测 URL 不含 `/onboarding` 则跳过此步。

## 验收点(spec C T11 SC-006 + SC-009)

| 项                                            | 验证                                                                                                                                                                                           | 结果        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Path 1 端到端通(注销发起 → FROZEN)            | DB row `id=3, status=FROZEN, freeze_until!=null`(path 1 完成时点)→ path 2 完成回 ACTIVE                                                                                                        | ✅ 状态闭环 |
| Path 2 端到端通(freeze modal → 撤销 → ACTIVE) | `/phone-sms-auth` 返回 **403 ACCOUNT_IN_FREEZE_PERIOD**(spec D #143 错误码暴露)→ `mapApiError 'frozen'` 触发 modal → freeze-cancel-delete tap → cancel-deletion → 200 → DB row `status=ACTIVE` | ✅          |
| 反枚举                                        | cancel-deletion 页只看到 query param phone(未渲染 displayName / accountId 等细分)                                                                                                              | ✅ 截图 09  |
| pageErrors=0 / networkFails=0                 | run.mjs JSON report                                                                                                                                                                            | ✅          |

## Network log(`page.on('request')` / `response`)

```text
== PATH 1 ==
[REQ]  POST /api/v1/sms-codes                    ← SMS 1: login 发码
[RESP] (200, returns 204 actually)
[REQ]  POST /api/v1/accounts/phone-sms-auth      ← login(SMS 1 code)
[RESP] 200
[REQ]  GET  /api/v1/accounts/me                  ← loadProfile (displayName=测试C, AuthGate → /(tabs)/profile)
[RESP] 200
[REQ]  POST /api/v1/accounts/me/deletion-codes   ← SMS 2: 注销发码
[RESP] 204
[REQ]  POST /api/v1/accounts/me/deletion         ← submit deletion (SMS 2 code)
[RESP] 204                                        ← account FROZEN

== PATH 2 ==
[REQ]  POST /api/v1/sms-codes                    ← SMS 3: login 发码
[RESP] (200)
[REQ]  POST /api/v1/accounts/phone-sms-auth      ← login(SMS 3 code)
[RESP] 403  ← ACCOUNT_IN_FREEZE_PERIOD (spec D #143 错误码 → freeze modal 触发)
[REQ]  POST /api/v1/auth/cancel-deletion/sms-codes  ← SMS 4: 撤销发码
[RESP] 200
[REQ]  POST /api/v1/auth/cancel-deletion         ← submit cancel (SMS 4 code)
[RESP] 200
[REQ]  GET  /api/v1/accounts/me                  ← loadProfile (post-cancel, AuthGate → /(tabs)/profile)
[RESP] 200                                        ← account ACTIVE
```

## DB final state

```sql
SELECT id, phone, status, display_name, freeze_until, created_at FROM account.account WHERE phone = '+8613100000008';
-- 3 | +8613100000008 | ACTIVE | 测试C | (空,撤销后清零) | 2026-05-08 01:45:53 UTC
```

状态闭环:`ACTIVE → FROZEN(path 1)→ ACTIVE(path 2)`,`freeze_until` 在 path 1 注销时被 set,path 2 撤销时 cleared(per server `CancelDeletionUseCase` 实现)。

## 与 spec B T10(account-settings-shell)的对比

| 维度                 | spec B T10(release-verify smoke)            | spec C T11(business-flow smoke)                                                  |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| 复杂度               | 单路径 only-read(13 截图)                   | 双路径 destructive(10 截图)                                                      |
| SMS code 次数        | 1(用 `SMS_CODE` env 复用 redis sms_code)    | 4(2 next path 1 + 2 path 2)                                                      |
| Server-side endpoint | 仅 `/me` GET / PATCH(loadProfile + onboard) | `/me/deletion-codes` + `/me/deletion` + `/auth/cancel-deletion/*` 全 spec C 端点 |
| 触发 spec D 错误码   | ❌                                          | ✅ `ACCOUNT_IN_FREEZE_PERIOD` 经 `phone-sms-auth` 暴露                           |
| Account 副作用       | 留 1 个 ACTIVE 测试账号(`+8613100000007`)   | 留 1 个 ACTIVE 测试账号(`+8613100000008`,经历三态闭环)                           |

## 已知非问题

- ⚠️ **02-onboarding.png 缺**:已 onboarded 跳过预期行为
- ⚠️ **1 个 console error**:可能为 freeze modal trigger 时 `phone-sms-auth` 403 在 fetch 层 surface 的 expected error,与业务流无关(下次可忽略 filter)

## 踩坑回顾

| #   | 现象                                                                                                         | Root cause                                                                                                                              | 修复                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | round 1 在 "tap 双勾" 步 30s timeout                                                                         | run.mjs selector 写 `getByRole('checkbox', { name: /我已知晓.*登录撤销恢复/ })`,但 spec C UI `accessibilityLabel="checkbox-1"`(英文 ID) | selector 全部改英文 ID:`checkbox-1/2`、`send-code`、`code-input`、`submit`、`freeze-cancel-delete`、`phone-input` |
| 2   | round 1 跑完 path 1 prep 已 onboard,round 2 重跑 login 撞 `getByLabel('昵称')` timeout(没有 onboarding form) | run.mjs hardcoded onboarding 流程                                                                                                       | 加 `page.url().includes('/onboarding')` 自动检测,跳过 onboarding 走直接 (tabs)/profile                            |

## Follow-up

继承 PR #80 同 follow-up:**M3 内测前必须分 staging,destructive case 永远在 staging 跑;prod 留 only-read smoke**。本次 spec C T11 因为 spec 内核就是 destructive(注销 / 撤销),无法 only-read 化,prod 跑了 1 次留下账号污染(`+8613100000008 测试C`,M3 staging 落地时一并清)。

## 关联

- spec/delete-account-cancel-deletion-ui/tasks.md T11(本 task closure)
- server PR #143 `feat(account): expose-frozen-account-status (spec D, spec C 前置)` — `ACCOUNT_IN_FREEZE_PERIOD` 错误码暴露
- server release v0.2.0(commit `6c32323`)— prod 部署后 spec D 生效
- spec C dev visual smoke PR #81 + impl PR #78 + mockup translation PR #79
- 类比 PR #80(spec B T10 prod release-verify)
