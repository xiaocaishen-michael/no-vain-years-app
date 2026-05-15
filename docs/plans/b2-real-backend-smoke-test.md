# Plan: B2 — Real backend smoke test for login page

**Status**: Pending（new session 启动）
**Created**: 2026-05-03 EOD（前一 session 写）
**Branch**: `feat/account-login-page` (continue same — already 11 commits today, last `4c487a4`)
**Predecessor session**: 完成 T0-T7 + Playwright runtime-debug 工具 + 4 状态截图肉眼验过

## 目标

把 login.tsx → @nvy/auth → @nvy/api-client → my-beloved-server 全链路跑通，验 4 场景：

| #   | 场景                             | 验证点                                                                               |
| --- | -------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Happy path（密码登录）           | state idle → submitting → success；AuthGate redirect to `/(app)`；store.session 已设 |
| 2   | 401（错密码）                    | state error；errorToast = `"手机号或验证码/密码错误"`；input border-err              |
| 3   | 429（rate limit，连续提交）      | state error；errorToast = `"请求过于频繁，请稍后再试"`                               |
| 4   | Network fail（中途 kill server） | state error；errorToast = `"网络异常，请检查网络后重试"`                             |

成功 = 4 场景 actionLog 全 ok + errorToast 与 spec FR-006 + plan.md 错误映射表**字节级一致** + consoleErrors 全空。

## Critical Landmines（先看，不然踩坑）

| #   | 坑                                                                                                                                        | 解                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | **api-client 默认 baseURL = `https://api.xiaocaishen.me`（生产域名！）**                                                                  | 必须 `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`，否则 login 提交打到生产环境 |
| 2   | OrbStack 默认不自启，docker daemon 不在时 docker compose 立即报 `no such file or directory at /Users/butterfly/.orbstack/run/docker.sock` | 第一步先 `open -a OrbStack` + sleep 8 + `docker info` verify                       |
| 3   | M1 dev SMS 是 mock（per ADR-0013），SMS 验证码不真发，写到 server 日志 / Resend email                                                     | 注册测试号时从 server log grep mock code                                           |
| 4   | metro 改 babel / env 后必须 `--clear` 让 cache 失效                                                                                       | 启 metro 时加 `--clear` 兜底                                                       |
| 5   | react/react-dom 版本警告（19.2.5 vs expected 19.1.0）                                                                                     | 可忽略，bundle 工作正常，下次 SDK upgrade 时一并对齐                               |

## 当前世界状态（前一 session 留下）

| 组件                    | 状态                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| feat/account-login-page | `4c487a4`，11 commits，已 push                                                                                                                         |
| login.tsx               | 完整 wired up（useLoginForm hook + zod schema + AuthGate redirect）                                                                                    |
| packages/ui             | 11 个原子全落（Spinner/SuccessCheck/ErrorRow/LogoMark/TabSwitcher/PhoneInput/PasswordField/SmsInput/PrimaryButton/GoogleButton + nativewind-env.d.ts） |
| packages/design-tokens  | 完全 mirror Claude Design v2 bundle（ink/line/surface/ok/warn/err/accent/brand-{50..900}）                                                             |
| Babel                   | `react-native-worklets/plugin` + `unstable_transformImportMeta: true`                                                                                  |
| Tailwind                | `darkMode: 'class'`                                                                                                                                    |
| AuthGate                | `useNavigationContainerRef + state listener` 守 `isReady`（解 "Attempted to navigate before mounting"）                                                |
| tools/runtime-debug.mjs | 支持 `--shot` / `--click` / `--fill` / `--wait` / `--press` ordered action list                                                                        |
| dev server              | **可能仍在 8081 跑**（task `bba3pn6cy`，`pnpm web --clear`），但**没设 EXPO_PUBLIC_API_BASE_URL**，需重启                                              |
| 已有测试号              | ❌ 无（DB 是空的；要先 register 一个）                                                                                                                 |

新 session 第一件事 `lsof -i :8081 -sTCP:LISTEN` 看 metro 还在不在；在的话先 kill 重启；不在直接走 Step 4。

## Step → Verify

### Step 1: 启基础设施（5-10 min）

```bash
# 1.1 启 OrbStack
open -a OrbStack && sleep 8
docker info | head -3   # verify daemon up

# 1.2 起 docker-compose dev 的 PG + Redis（不起 minio/grafana 等可选服务）
docker compose -f $HOME/Documents/projects/no-vain-years/my-beloved-server/docker-compose.dev.yml up -d postgres redis
sleep 5

# 1.3 verify
docker ps --format 'table {{.Names}}\t{{.Status}}'
nc -z localhost 5432 && nc -z localhost 6379 && echo "PG + Redis ready"
```

**Verify**: `docker ps` 显示 postgres + redis 两个 healthy；`nc -z` 全 succeed。

### Step 2: 启动后端（3-10 min 含 maven 依赖下载首次 5 min+）

后端 dev profile + 后台跑（前台会卡住 session）：

```bash
DOCKER_HOST=unix:///Users/butterfly/.orbstack/run/docker.sock \
  ./mvnw -pl mbw-app -am -f $HOME/Documents/projects/no-vain-years/my-beloved-server/pom.xml \
  spring-boot:run -Dspring-boot.run.profiles=dev 2>&1 | tee /tmp/mbw-app.log
# Bash run_in_background: true
```

**Verify**:

- 等 `Started ... in N seconds` 出现在 `/tmp/mbw-app.log` 末尾
- `curl -s http://localhost:8080/actuator/health | jq .status` 返回 `"UP"`

**踩坑提示**：spring-boot:run 默认 fork 子进程，`--filter` / `-pl mbw-app` 之类 maven 选项要确认 server 仓 pom.xml 配置（看 `mvnw -h` 或 `pom.xml` 的 `<modules>`）。

### Step 3: 注册测试号（1-3 min）

后端干净 DB，无 seed 数据。手动注册：

```bash
# 3.1 触发 SMS 发送（mock 模式，不真发，但记日志）
curl -s -X POST http://localhost:8080/api/v1/account/register/sms \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+8613800138000","purpose":"REGISTER"}'

# 3.2 从 mbw-app.log 拿 mock 验证码（精确格式见
#     my-beloved-server/mbw-account/src/main/java/.../MockSmsCodeSender.java）
grep -E "Mock SMS|verification code|code=[0-9]" /tmp/mbw-app.log | tail -5
# 假设拿到 SMS_CODE='123456'

# 3.3 完成注册
curl -s -X POST http://localhost:8080/api/v1/account/register/by-phone-sms \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+8613800138000","smsCode":"<SMS_CODE>","password":"Test1234"}' \
  | jq .
```

**Verify**: 3.3 返回 200 + JSON 含 `accountId / accessToken / refreshToken` 三件套。

**踩坑提示**：

- 准确的 endpoint path 需查 server 仓 OpenAPI spec：`curl http://localhost:8080/v3/api-docs | jq '.paths | keys'`
- 真实 path 可能是 `/api/v1/account/...`，按实际为准
- mock SMS 日志格式去看 `MockSmsCodeSender` 源码 grep "log\|info\|debug"

### Step 4: 配 app 端 base URL + 重启 Metro（2 min）

```bash
# 4.1 设 .env（gitignored）
echo 'EXPO_PUBLIC_API_BASE_URL=http://localhost:8080' \
  > $HOME/Documents/projects/no-vain-years/no-vain-years-app/apps/native/.env

# 4.2 杀旧 metro
lsof -ti :8081 -sTCP:LISTEN | xargs -r kill 2>/dev/null
sleep 2

# 4.3 启新 metro with --clear
: > /tmp/metro.log
pnpm -C $HOME/Documents/projects/no-vain-years/no-vain-years-app \
  --filter native exec expo start --web --clear --port 8081 2>&1 | tee /tmp/metro.log
# Bash run_in_background: true

# 4.4 等 Web Bundled
# Monitor 抓 /tmp/metro.log 直到 "Web Bundled"
```

**Verify**:

- `tail /tmp/metro.log` 看到 `Web Bundled` + `Waiting on http://localhost:8081`
- `node tools/runtime-debug.mjs http://localhost:8081 --shot /tmp/login-baseline.png` 0 errors，截图正常
- **关键**：在浏览器 devtools Network 看 fetch 请求 host = `localhost:8080`（不是 prod 域名）

### Step 5: 4 场景实测（10 min）

#### 5.1 Happy path

```bash
node $HOME/Documents/projects/no-vain-years/no-vain-years-app/tools/runtime-debug.mjs \
  http://localhost:8081 \
  --shot /tmp/b2-01-default.png \
  --fill '[aria-label="手机号"]' '13800138000' \
  --fill '[aria-label="密码"]' 'Test1234' \
  --shot /tmp/b2-02-filled.png \
  --click 'text=登录' \
  --wait 2500 \
  --shot /tmp/b2-03-after-submit.png
```

**Verify**: 03 截图 = SuccessOverlay（绿对勾 + 骨架屏）OR 已 redirect 到 `(app)/index` 看到 "no-vain-years" 文字；exit code 0；finalUrl 不是 `/login`。

#### 5.2 401 错密码（重启 page，state 重置）

```bash
node tools/runtime-debug.mjs http://localhost:8081 \
  --fill '[aria-label="手机号"]' '13800138000' \
  --fill '[aria-label="密码"]' 'wrong-password' \
  --click 'text=登录' \
  --wait 2000 \
  --shot /tmp/b2-04-401.png
```

**Verify**: 04 截图 = 密码 input 下方 ErrorRow 显示 "手机号或验证码/密码错误"；input border 变 err 红。

#### 5.3 429 rate limit

先 curl 触发 server 端 rate limit（客户端单次提交不容易触发）：

```bash
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "$i: %{http_code}\n" \
    -X POST http://localhost:8080/api/v1/account/login/by-password \
    -H 'Content-Type: application/json' \
    -d '{"phone":"+8613800138000","password":"wrong-pass"}'
done
# 期望第 N 次（看 server rate-limit 配置）返回 429
```

确认 429 触发后立刻在 UI 测：

```bash
node tools/runtime-debug.mjs http://localhost:8081 \
  --fill '[aria-label="手机号"]' '13800138000' \
  --fill '[aria-label="密码"]' 'Test1234' \
  --click 'text=登录' \
  --wait 2000 \
  --shot /tmp/b2-05-429.png
```

**Verify**: errorToast = "请求过于频繁，请稍后再试"

**降级方案**：rate limit 配置触发不到（如阈值 100/min）时，跳过此场景，单测已覆盖（`use-login-form.test.ts` 的 429 case）。

#### 5.4 Network fail

```bash
# 杀 backend
lsof -ti :8080 -sTCP:LISTEN | xargs -r kill

node tools/runtime-debug.mjs http://localhost:8081 \
  --fill '[aria-label="手机号"]' '13800138000' \
  --fill '[aria-label="密码"]' 'Test1234' \
  --click 'text=登录' \
  --wait 3000 \
  --shot /tmp/b2-06-network-fail.png
```

**Verify**: errorToast = "网络异常，请检查网络后重试"；input 下方 ErrorRow 显示

## 成功标准

| #        | Standard                                                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-B2-01 | 4 场景截图全部生成（5.3 可降级到单测覆盖说明）                                                                                                                                    |
| SC-B2-02 | errorToast 文案与 [`spec.md`](../../apps/native/specs/auth/phone-sms-auth/spec.md) FR-006 + [`plan.md`](../../apps/native/specs/auth/phone-sms-auth/plan.md) § 错误映射表精确一致 |
| SC-B2-03 | Happy path 后 finalUrl 离开 `/login`                                                                                                                                              |
| SC-B2-04 | consoleErrors 全空（除 redirect 警告）                                                                                                                                            |
| SC-B2-05 | networkFails 仅出现在 5.4 场景且 url 包含 `/api/v1/account/login`                                                                                                                 |

## 失败 / 兜底

| 失败                            | 表现                    | 兜底                                                         |
| ------------------------------- | ----------------------- | ------------------------------------------------------------ |
| OrbStack 启不起                 | docker info 报错        | GUI 启 / 重启电脑                                            |
| docker pull 太慢                | postgres image 拉不下来 | 等 OR 切阿里云 docker mirror（本机 docker config）           |
| spring-boot:run 启不来          | maven 拉不下依赖        | 看 `tail /tmp/mbw-app.log`；常见原因：JDK 21 没装 / 网络问题 |
| EXPO_PUBLIC_API_BASE_URL 没生效 | bundle 仍含 prod URL    | metro 必须 `--clear` 重启；env 变量是编译期注入              |
| Mock SMS 找不到 code            | log 格式预期不对        | grep `MockSmsCodeSender` 源码看实际 log line 格式            |
| 5.2 ErrorRow 不显示             | 状态机 bug              | 用 `--raw` 看 console.log + finalUrl                         |
| 5.3 触发不到 429                | rate limit 配置太宽松   | 跳过；单测覆盖即可                                           |

## 已知 P3 bugs（B2 顺手验证 + 修）

前一 session（2026-05-03 EOD）用 Playwright 复现 prod baseURL trap 时发现：

1. **mapApiError 把 CORS-blocked fetch 误归 `unknown` 而非 `network`** — 浏览器 fetch CORS 失败抛 TypeError，但 OpenAPI Generator runtime fetch wrapper 可能包了一层（`ApiClientError`），丢失 TypeError 类型信息，落到 `'unknown'` 兜底。
   - 复现：app 不设 EXPO_PUBLIC_API_BASE_URL，点击 "获取验证码"
   - 期望：errorToast = "网络异常，请检查网络后重试"
   - 实际：errorToast = "登录失败，请稍后再试"
   - B2 验证：本地后端跑起来后，故意杀 server 触发真 fetch fail，看 mapApiError 走哪个 bucket。如果还是 `unknown`，去 `apps/native/lib/validation/login.ts` 加 `instanceof TypeError` OR 检查 `error.message` 包含 "fetch" / "Failed to fetch" / "NetworkError" 等模式
   - 单测同步加：mock OpenAPI Generator 的 fetch 抛 TypeError，断言 mapApiError 返回 `'network'`

2. **requestSms 失败用 "登录失败..." 文案语义偏** — 同一 mapApiError 表覆盖 password / sms / requestSms 全部场景，文案泛指 "登录失败"。requestSms 自己的失败应该是 "验证码发送失败" 之类。
   - 修复方向：mapApiError 接受第二个 `context` 参数（`'login' | 'requestSms'`），分场景返 toast。OR 在 hook 层捕获后用单独的 toast 串。
   - 优先级低于 #1。

## 估时

| Step            | 顺利       | 首启可能                   |
| --------------- | ---------- | -------------------------- |
| 1 (infra)       | 5 min      | 10 min（首次 docker pull） |
| 2 (backend)     | 3 min      | 10 min（首次 maven 依赖）  |
| 3 (register)    | 2 min      | 5 min（找 SMS log 格式）   |
| 4 (app config)  | 2 min      | 3 min                      |
| 5 (4 scenarios) | 8 min      | 12 min（含 debug）         |
| **总**          | **20 min** | **40 min**                 |

## 后续动作

B2 全过 →

1. **Open PR**：`gh pr create` 把 `feat/account-login-page` → `main`
2. PR 描述含 11 commits 摘要 + 4 截图（attach 或 imgur）
3. CI 跑（typecheck / lint / test 都已绿过）
4. AI 默认接 auto-merge（per meta CLAUDE.md），CI 全绿后自动 squash merge
5. 下一页 `register`（M1.2 phase 4 第二页）走相同 SDD 流程

---

## 给新 session 的开场提示

```
读 docs/plans/b2-real-backend-smoke-test.md，按 Step → Verify 顺序执行。
每个 Step 验证完前停下来给我看结果再下一步，**不要一口气跑到底**。

第一动作：lsof -i :8081 / lsof -i :8080 / docker info 各跑一遍，
摸清当前世界状态，再决定从 Step 1 还是 Step 4 开始。
```
