# Runtime debug session: account-settings-shell business flow (M1.X / SDD T10)

- **Date**: 2026-05-08 00:42 CST(run completed)
- **Branch / SHA**: app `<待 PR 创建>`;server `main` `89db8ed`(release v0.2.0 `6c03581`)
- **Phase**: ADR-0017 类 1 PHASE 1+2 共同冒烟 — release v0.2.0 prod 端 only-read 路径验证
- **Tool**: `run.mjs`(Playwright **headless** Chromium with `--disable-web-security`,viewport 390×844;支持 `SMS_CODE` env 跳过 click 获取验证码 直接复用既有 redis sms_code,与 polling `/tmp/mbw-sms-code.txt` 文件二选一)
- **Server**: prod ECS `https://api.xiaocaishen.me`(release v0.2.0,M1 `mbw.sms.provider=mock` + `mbw.email.provider=resend`)
- **Frontend**: `EXPO_PUBLIC_API_BASE_URL=https://api.xiaocaishen.me pnpm web`(Metro :8081)

## 与既有 dev 冒烟的关系

| 维度       | dev T9 / T15(已 ✅)                                     | 本 T10(prod release 验证)                                                   |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| 目的       | 业务流 + 视觉态全覆盖                                   | release v0.2.0 prod 部署后业务流回归(/me.phone 链路真后端验证)              |
| 后端       | localhost:8080 dev profile + docker compose dev         | prod ECS `https://api.xiaocaishen.me` v0.2.0                                |
| SMS code   | `docker exec mbw-redis HSET sms_code:... 999999`(magic) | **真发 Resend 邮件**到 `MOCK_SMS_RECIPIENT` → 你从邮箱拿 6 位 code 输入     |
| DB cleanup | 跑完用 `docker exec mbw-postgres psql DELETE` 清干净    | **不 cleanup**(本地不连 prod DB);留 1 个测试账号,M3 前 staging 分离时一并清 |
| 截图数     | T9 7 张 / T15 5 张                                      | T10 13 张(only-read 全路径,**砍 logout 4 张**避免 destructive)              |
| 副作用     | 无                                                      | prod DB 多 1 row(account + credential + refresh_token)                      |

## 与 spec.md T10 原 17 张清单的差异(ADR design follow-up)

砍掉 **14-17 logout 段** — 14-tap-logout / 15-alert-confirm / 16-after-confirm / 17-bottom-tab-hidden(notes)。理由(per B 方案 B/C 共识):

1. logoutAll 是 v0.1.0 已落地能力,不在 v0.2.0 改动面;**release 重验无新增价值**
2. logoutAll 副作用 = 清你 prod 当前所有 device session,需重登;不该作为 release 验证常态
3. 单环境模型下 prod ≈ dev,destructive case 应留在 dev 端 T15 视觉态(已含 Alert.alert 触发后系统 sheet 行为)
4. **follow-up**:M3 内测前必须分 staging,destructive case 在 staging 跑;本档把 only-read 流程跑透即可

## Prerequisites(跑前确认)

| #   | 项                                                | 验证                                                                                                     |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | release v0.2.0 已部署(GHA deploy 绿)              | `curl https://api.xiaocaishen.me/actuator/health` 返回 `{"status":"UP"}`                                 |
| 2   | `/me` schema 含 phone                             | `curl https://api.xiaocaishen.me/v3/api-docs` 见 `AccountProfileResponse.phone:string`                   |
| 3   | 本地 metro 没启或干净                             | `lsof -iTCP:8081 -sTCP:LISTEN` 无进程 / kill 既有                                                        |
| 4   | Playwright chromium binary                        | `~/Library/Caches/ms-playwright/chromium-*` 存在                                                         |
| 5   | 你能登录 `MOCK_SMS_RECIPIENT` 邮箱                | prod ECS `.env.app` 配的那个邮箱(自己看)                                                                 |
| 6   | curl 用 brew OpenSSL 版(国内 https 不撞 LibreSSL) | `which curl` = `/opt/homebrew/opt/curl/bin/curl`(新 shell 自动);本对话进程仍是 LibreSSL 已经 verify 通过 |

## 跑法(2 个 terminal)

### Terminal 1 — 起 metro 指 prod

```bash
cd $HOME/Documents/projects/no-vain-years/no-vain-years-app/apps/native
EXPO_PUBLIC_API_BASE_URL=https://api.xiaocaishen.me pnpm web
```

第一次编译 web bundle 1-2min,等到 metro 输出类似:

```text
Web is waiting on http://localhost:8081
```

或浏览器自动开 `http://localhost:8081` 出现 login 页即可(关掉浏览器窗口,Playwright 会自己开)。

### Terminal 2 — 跑 Playwright

```bash
cd $HOME/Documents/projects/no-vain-years/no-vain-years-app
node apps/native/runtime-debug/2026-05-07-account-settings-shell-business-flow/run.mjs
```

Chromium 窗口出现,自动跑前几步。**当看到 prompt:**

```text
============================================================
>>>  请登录 MOCK_SMS_RECIPIENT 邮箱(prod ECS .env.app 配的那个)
>>>  找最新 [mbw mock SMS] code for +8613100000007 邮件
>>>  把邮件里的 6 位 code 粘贴到下面,回车继续
============================================================

  ✉️  6-digit code:
```

去你的邮箱拿最新一封 `[mbw mock SMS] code for +8613100000007 [<UUID>]` 邮件,把 6 位 code 粘贴回车,脚本继续自动跑剩余 12 张截图。

跑完目录会有 13 张 `*.png`,失败时有 `99-failure.png`。

## 13 截图清单

| #   | 文件                           | 触发动作                                | 视觉验收点                                                                                        |
| --- | ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 01  | 01-login-arrived.png           | 加载 metro                              | login screen 渲染(手机号 + 获取验证码 + 验证码 + 登录)                                            |
| 02  | 02-onboarding.png              | 登录成功 displayName=null → AuthGate 跳 | onboarding screen(displayName form)                                                               |
| 03  | 03-onboarded-tabs-profile.png  | 提交 displayName → AuthGate 跳          | (tabs)/profile landing(顶 nav + Hero + slide tabs + 底 tabs)                                      |
| 04  | 04-settings-index.png          | tap ⚙️                                  | settings 主页 3 cards + footer 双链接                                                             |
| 05  | 05-account-security.png        | tap "账号与安全"                        | account-security 主页 3 cards;**关键**:手机号行右侧 `+86 131****0007` mask 渲染 ← v0.2.0 核心新增 |
| 06  | 06-phone-detail.png            | tap "手机号"                            | phone screen 居中大字 mono mask `+86 131****0007`                                                 |
| 07  | 07-back-account-security.png   | back                                    | 返回 account-security                                                                             |
| 08  | 08-back-settings.png           | back                                    | 返回 settings 主页                                                                                |
| 09  | 09-legal-personal-info.png     | tap "《个人信息收集与使用清单》"        | 法规占位文案                                                                                      |
| 10  | 10-back-settings-2.png         | back                                    | 返回 settings                                                                                     |
| 11  | 11-legal-third-party.png       | tap "《第三方共享清单》"                | 法规 2 占位文案                                                                                   |
| 12  | 12-back-settings-3.png         | back                                    | 返回 settings                                                                                     |
| 13  | 13-final-back-tabs-profile.png | back × 退栈                             | 返回 (tabs)/profile                                                                               |

## 实际结果

- ✅ 13 张截图齐全(01 → 13)
- ✅ phone mask 链路验证:server 写入 phone + 前端 generated client 解析 + maskPhone 渲染整链路通(05/06 截图含 mask)
- ✅ pageErrors=0 / networkFails=0 / consoleErrors=2(均 Expo Router 把 `*-errors.ts` 当 route 的 missing default export warning,与 v0.2.0 改动无关)
- ✅ phone-sms-auth 200 → /me GET 200 → /me PATCH 200 → tabs/profile landing → settings full read-only flow
- ✅ prod DB 写入正确:`account_id=2 | phone=+8613100000007 | status=ACTIVE | display_name=测试用户 | created_at=2026-05-07 16:41:53 UTC`(server PR #139 生效 + v0.2.0 部署)
- ⚠️ 留下的 prod 测试账号未 cleanup,待 M3 前 staging 分离时清

## Network log(`page.on('request')`)

```text
[REQ]  POST /api/v1/accounts/phone-sms-auth   ← SMS_CODE=514807 登录(skip 获取验证码 复用 redis sms_code)
[RESP] 200
[REQ]  GET  /api/v1/accounts/me                ← loadProfile(displayName=null,phone=+8613100000007)
[RESP] 200
[REQ]  PATCH /api/v1/accounts/me              ← onboard 设 displayName='测试用户'
[RESP] 200  ← AuthGate 跳 (tabs)/profile
```

## 踩坑回顾(本次执行 4 个 fail-fast,记录给后续 staging 落地参考)

| #   | 现象                                                                                 | Root cause                                                                                                                                            | 修复                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | macOS curl prod /actuator/health 全 SSL_ERROR_SYSCALL                                | 系统 LibreSSL 3.3.6 与 prod nginx TLS 配合不来(浏览器 BoringSSL 通)                                                                                   | `brew install curl`(OpenSSL 3.6.2)+ ~/.zshrc 加 PATH,以后命令行 https 国内域名不再撞                                                                                                                  |
| 2   | Playwright `[REQ] POST localhost:8080/api/v1/sms-codes` 不是 prod                    | `apps/native/.env` 硬编码 `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`,Expo dotenv 加载顺序 `.env` 覆盖 shell var                                 | 创 `apps/native/.env.local`(gitignored,优先级高于 .env)写 prod URL + metro 重启                                                                                                                       |
| 3   | Playwright `[REQ] POST` 但 server 没 log + nginx access log `OPTIONS /sms-codes 403` | prod nginx 没配 dev CORS for `localhost:8081`,浏览器 CORS preflight 失败,actual POST 不发                                                             | Chromium launch args 加 `--disable-web-security`(client 端测试 hack,不动 prod)                                                                                                                        |
| 4   | code 校验 401 反复                                                                   | Round 1-3 send code 受 OPTIONS 403 阻断没真发,但 60s/24h rate-limit Redis key 累积;Round 4 真发后用户拿到的旧 code 已过 5min TTL(redis sms_code 删除) | SSH ECS DEL `sms_code/sms-60s/sms-24h/auth` 4 个 redis key + server-side `curl POST /sms-codes` 触发 fresh send + 5min 内拿新 code + run.mjs 加 `SMS_CODE` env 跳过 click(复用 redis sms_code 不污染) |

## SMS_CODE env 复用 redis sms_code 的 nuance

- 如果当次 `redis sms_code:<phone>` 仍 valid(< 5min,attemptCount < 限),设 `SMS_CODE=xxx` 跑 run.mjs 会**跳过** click 获取验证码 步骤 → 浏览器 fill code 直接登录 → 命中 redis 现有 hash → 200
- 反之(过期 / 不存在):需要先 trigger send code(via Playwright click 或 server-side curl)→ wait file 模式
- **不能两次 send code 后用第一次的 code**:第二次 send 会更新 sms_code 为新 hash,旧 code 立刻失效

## 已知非问题 / Drift 政策(代码 > mockup)

- prod metro 在浏览器 console 可能有 `Warning: Each child in a list should have a unique "key" prop` 等 RN-Web warning — 与 v0.2.0 改动无关,visual smoke 不计为 fail
- macOS LibreSSL 与 prod nginx TLS 不兼容(已用 `brew install curl` OpenSSL 版替代);Chromium BoringSSL 不撞此问题,Playwright 不受影响

## DB 状态(预期)

```sql
-- before run:
SELECT COUNT(*) FROM account.account WHERE phone = '+8613100000007';
-- 0

-- after run(留下,不 cleanup):
SELECT id, phone, status, display_name FROM account.account WHERE phone = '+8613100000007';
-- ? | +8613100000007 | ACTIVE | 测试用户   ✅ phone 字段服务端写入正确(server PR #139 + v0.2.0 部署)
```

## 关联

- specs/account/settings-shell/spec.md SC-006 + tasks.md T10
- server PR #139 `feat(account): expose phone in /me response`(account-settings-shell prereq)
- server release v0.2.0(GitHub Release tag,changelog 含 #136-#143)
- ADR follow-up:M3 内测前必须分 staging,destructive case 永远在 staging 跑(本任务 PR description 留 follow-up 备忘)
