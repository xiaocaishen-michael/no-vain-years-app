# Cloudflare Pages 自动化部署 playbook

`apps/native` Web bundle 通过 Cloudflare Pages 自动构建 + 部署到 `app.xiaocaishen.me`。本文记录一次性 bootstrap 步骤 + 常见 troubleshooting。决策见 meta `docs/architecture/tech-stack.md:57`；落地 plan 见 meta `docs/plans/server-ci-cd-app-mutable-pike.md`。

## 一次性 bootstrap

### 1. CF Pages console 项目配置

CF Dashboard → Pages → **Create project** → Connect to Git → 选 `xiaocaishen-michael/no-vain-years-app`：

| 字段                   | 值                                                 |
| ---------------------- | -------------------------------------------------- |
| Project name           | `no-vain-years-app`                                |
| Production branch      | `main`                                             |
| Framework preset       | None                                               |
| Root directory         | 留空（仓根）                                       |
| Build command          | `pnpm install --frozen-lockfile && pnpm build:web` |
| Build output directory | `apps/native/dist`                                 |

**Environment variables**（Production + Preview 两环境都设）：

| Key                        | Value                                                   |
| -------------------------- | ------------------------------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.xiaocaishen.me`                            |
| `NODE_VERSION`             | `22`                                                    |
| `PNPM_VERSION`             | `10.33.2`（与 root `package.json#packageManager` 对齐） |

> Root 必须留空。CF Pages 把 Root 设为子目录会断 pnpm workspace 解析（[workers-sdk #10941](https://github.com/cloudflare/workers-sdk/issues/10941)）。靠 `pnpm --filter native build:web` 切目标，而非 CF root 字段。

### 2. 绑自定义域

CF Pages → Project → Custom Domains → Add → `app.xiaocaishen.me`。DNS 在 CF DNS（同账号）→ CF 自动配 CNAME + 1-2 min 内 HTTPS 证书生效。

## CORS 跨仓耦合（**改 CF 域名前必读**）

server `mbw-app/src/main/java/com/mbw/app/web/ProdCorsConfig.java` 的 `allowedOriginPatterns` 是显式枚举：

- `https://app.xiaocaishen.me`
- `https://no-vain-years-app.pages.dev`
- `https://*.no-vain-years-app.pages.dev`（preview 子域）

**任何下面的操作都需要同步改 server `ProdCorsConfig.java`**：

- 改 CF Pages project name（影响 `*.pages.dev` 子域）
- 加新自定义域（如 staging.xiaocaishen.me）
- 切换到付费 plan 后启用别的 preview 域名格式

操作流程必须是：先 ship server PR + 部署 ECS → 验证 CORS preflight → 再做 CF 侧改动。否则前端访问报跨域被浏览器阻拦，难调试。

## SPA fallback：必须的，因为有不可枚举动态路由

`apps/native/public/_redirects`：

```text
/*    /index.html   200
```

理由：`apps/native/app/(app)/settings/account-security/login-management/[id].tsx` 是 session UUID 路由，`generateStaticParams()` 无法枚举。Expo `web.output: "single"` SPA 模式下所有路由 client-side 解析，CF Pages 必须用 `_redirects` 把 unknown path 兜回 `/index.html` 让 React 接管。否则用户直链 / 刷新 deep link → CF 默认 404 页。

## `EXPO_PUBLIC_*` 编译期内联

Metro 在 `expo export -p web` 时把 `EXPO_PUBLIC_*` 字符串**直接 inline** 到 bundle。这意味：

- 改 CF Pages env var → 必须**手动 redeploy**（CF Pages console → Deployments → Retry deployment），env 改不"live"
- 不能放 secret（bundle 公开可见）
- `apps/native/.env` 优先级**高于** shell env，本地开发要切 prod URL 写 `apps/native/.env.local`（gitignored）

## 兜底：DEFAULT_BASE_URL

`packages/api-client/src/client.ts` 的 `DEFAULT_BASE_URL = 'https://api.xiaocaishen.me'` 是 fallback——CF env 漏配 `EXPO_PUBLIC_API_BASE_URL` 时仍能 hit 生产 API。**不要**依赖这个兜底，env 该显式设还是显式设；但它给静态导出失误一个安全网。

## 首次部署 verification

```bash
# 本地构建产物
pnpm build:web
ls apps/native/dist/index.html apps/native/dist/_redirects   # 都存在

# 本地静态 server smoke
npx serve apps/native/dist
# 浏览器：/、/login、/(app)/onboarding、/(app)/settings/account-security/login-management/test-id 都应加载 SPA shell（不 404）

# server CORS preflight 验证
curl -I -X OPTIONS https://api.xiaocaishen.me/api/v1/auth/login \
  -H "Origin: https://app.xiaocaishen.me" \
  -H "Access-Control-Request-Method: POST"
# 期望响应头：Access-Control-Allow-Origin: https://app.xiaocaishen.me
```

CF Pages 部署后：

- `https://no-vain-years-app.pages.dev` 加载 → splash → AuthGate 重定向 `/login`
- DevTools Network → API 请求打 `https://api.xiaocaishen.me/api/v1/...`，无 CORS 错
- 实跑 phone-sms 登录路径（mock provider 走 dev account）→ 登录后 `/(app)` 加载
- 直链 `/(app)/settings/account-security/login-management/<some-id>` hard refresh → SPA shell（证 `_redirects` 生效）
- 任开一个 frontend PR → CF 自动产出 `<hash>.no-vain-years-app.pages.dev` preview → 也通 CORS（证 `*.pages.dev` wildcard pattern）

## 已知踩坑

| 现象                                           | 缓解                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 浏览器报 `blocked by CORS policy`              | server `ProdCorsConfig` 未部署到 prod ECS，或 origin pattern 漏配；先 curl preflight 验证                                  |
| CF build 报 `expo: command not found`          | build cmd 缺 `pnpm install --frozen-lockfile`；CF 默认 install 在 monorepo 偶发不彻底，显式装更稳                          |
| build 成功但 deploy 后 Tailwind class 不渲染   | 查 `apps/native/metro.config.js` 的 `withNativeWind` wrapper；NativeWind v4 静态导出主流路径稳定但需匹配 SDK 54+           |
| 首屏 worklet 错误 `_WORKLET is not defined`    | `babel.config.js` plugin 顺序错；`react-native-worklets/plugin` 必须放最后                                                 |
| `expo export -p web` 进程不退出                | [expo/expo #27938](https://github.com/expo/expo/issues/27938) 老问题；SDK 53 latest patch + SDK 54 已修，CI 兜底加 timeout |
| 改 `EXPO_PUBLIC_API_BASE_URL` 后访问仍打旧 URL | env 编译期内联，必须 CF Pages console 触发 redeploy                                                                        |
| free tier 月 500 build 超限                    | 单人 PR ≤ 16/天富裕；M3 内测 PR 量增大再升 Pro（5000/月）                                                                  |

## 与 server 部署的对比

| 维度         | server（API）                                 | app（Web bundle）                            |
| ------------ | --------------------------------------------- | -------------------------------------------- |
| 平台         | 阿里云 ECS（A-Tight 单 2c4g）                 | Cloudflare Pages                             |
| 触发         | tag → ACR image → SSH ECS docker compose pull | push to main → CF auto build/deploy          |
| 部署单元     | docker image                                  | 静态 dist/                                   |
| HTTPS / 证书 | nginx + Let's Encrypt                         | CF 自动                                      |
| Preview 环境 | ❌                                            | ✅ 每 PR 自动 `<hash>.pages.dev`             |
| 失败回滚     | docker compose 回退 image                     | CF Pages console 一键 rollback 旧 deployment |

server 走"部署到我的基础设施"；app web 走"托管到边缘平台"。两套链路独立运维，**唯一耦合点 = CORS allowedOriginPatterns**。
