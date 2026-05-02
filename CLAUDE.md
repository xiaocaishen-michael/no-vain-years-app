# no-vain-years-app

「不虚此生」跨端前端 **monorepo**（pnpm workspace）。M1 ~ M2 早期 `apps/native`（Expo + RN Web）一份代码同步交付 iOS / Android / Web；M2 PKM 启动时引入 `apps/web`（Next.js）处理大屏画布 / 知识图谱 / dashboard 等 paradigm 与移动端不同的场景；M5 Tauri 包装 web bundle 补 Desktop。对外消费 [my-beloved-server](https://github.com/xiaocaishen-michael/my-beloved-server) 的 REST API。

**核心架构原则**：业务逻辑 / 数据层 / 共享 UI 抽到 `packages/*`；platform-specific 代码（routes / 大屏画布等）落在对应 `apps/<target>`。两 apps 对等，不存在主从。

## 关于本文件

本文件 = **写代码时必须遵守的规约**。系统级规则（Git workflow、业务命名、API 契约、版本号策略、模块化）见 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md)；UI/UX 工作流详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。

读入顺序：先读 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md) → 读 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md) → 读本文件。

---

## 一、技术栈

| 维度                                  | 选型                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo**                          | **pnpm workspace**（`apps/*` + `packages/*`）；可选 turborepo（M2 后引入收益更大）                                                         |
| 框架（apps/native）                   | Expo（最新 stable）+ React Native                                                                                                          |
| Web 渲染（apps/native 出 web bundle） | React Native Web                                                                                                                           |
| 框架（apps/web，M2 加入）             | Next.js（App Router）+ Tailwind / shadcn — 处理大屏画布 / 知识图谱 / dashboard                                                             |
| 语言                                  | TypeScript（`strict: true` + `noUncheckedIndexedAccess: true`）                                                                            |
| 路由（native）                        | Expo Router（file-based）                                                                                                                  |
| 路由（web M2+）                       | Next.js App Router（可选 Solito 桥接共享导航逻辑）                                                                                         |
| UI 库                                 | **NativeWind v4 + Tailwind**（per ADR-0014，packages/ui 自封装）；tokens 单源 `@nvy/design-tokens`；apps/web (M2) 用同一份 tailwind preset |
| 状态管理                              | **Zustand**（packages/auth + 各 feature 内部）                                                                                             |
| 数据请求 / 缓存                       | TanStack Query                                                                                                                             |
| 表单                                  | React Hook Form + zod                                                                                                                      |
| 本地存储 — token                      | **expo-secure-store**（mobile，走 iOS Keychain / Android Keystore）+ localStorage（web，M3 前升级 HttpOnly cookie）                        |
| 本地存储 — 业务 state                 | MMKV（mobile）+ localStorage（web），自封统一 API                                                                                          |
| API 客户端                            | OpenAPI Generator 从后端 `/v3/api-docs` 自动生成到 `packages/api-client/src/generated/`（**不手写**）                                      |
| **包管理器**                          | **pnpm**（不用 npm / yarn / bun）                                                                                                          |
| 构建 / 发布（native）                 | EAS Build + EAS Submit + EAS Update                                                                                                        |
| 构建 / 发布（web）                    | Cloudflare Pages（M1.2 起）                                                                                                                |
| Desktop（M5）                         | Tauri 2.x 包装 web bundle                                                                                                                  |

> **包管理器纪律**：项目仅支持 pnpm。提交前禁止出现 `package-lock.json` / `yarn.lock` / `bun.lockb`，CI 会拦截。
>
> **Storage 安全纪律**：refresh token 等敏感凭证走 `expo-secure-store`（native）/ localStorage（M1 web 测试期，M3 前升级 HttpOnly cookie）；业务 state 走 MMKV / localStorage。**禁止**把 token 写进 MMKV / AsyncStorage。

## 二、目录约定（monorepo 结构）

```text
no-vain-years-app/                          ← root（pnpm workspace）
├── apps/
│   ├── native/                             ← Expo（iOS + Android + RN Web 出 web bundle）
│   │   ├── app/                            ← Expo Router file-based 路由
│   │   │   ├── (auth)/                     ← 路由组：登录 / 注册
│   │   │   ├── (app)/                      ← 路由组：登录后主流程
│   │   │   └── _layout.tsx
│   │   ├── features/                       ← native 业务模块（与后端 mbw-<module> 一一对应）
│   │   │   ├── account/                    ← 对应后端 mbw-account
│   │   │   └── pkm/                        ← 对应后端 mbw-pkm（M2 引入；含 mobile 触摸版 PKM）
│   │   ├── spec/                           ← 各页面 SDD 三件套（spec.md / plan.md / tasks.md）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── app.json
│   │   └── eas.json
│   └── web/                                ← Next.js（M2 PKM 启动时新建）
│       ├── app/                            ← Next.js App Router
│       │   ├── (auth)/
│       │   ├── (app)/
│       │   └── pkm/                        ← 大屏画布 / 知识图谱（用 tldraw / xyflow 自带样式；容器布局走 Tailwind className）
│       ├── features/                       ← web 大屏专属业务模块
│       └── package.json
│
├── packages/
│   ├── design-tokens/                      ← Tailwind tokens 单一来源（被 native 现在 + web M2 共用）
│   │   ├── src/
│   │   │   └── index.ts                    ← export colors / spacing / fontSize / borderRadius / boxShadow
│   │   └── package.json                    ← name: "@nvy/design-tokens"
│   ├── ui/                                 ← NativeWind 自封装组件（跨 apps 共享）
│   │   ├── src/
│   │   │   ├── Button.tsx                  ← className 风格
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   ├── SmsCodeInput.tsx
│   │   │   ├── TabSwitcher.tsx
│   │   │   └── index.ts                    ← re-export 组件 + tokens
│   │   └── package.json                    ← name: "@nvy/ui"
│   ├── api-client/                         ← OpenAPI generator 输出 + fetch wrapper
│   │   ├── src/
│   │   │   ├── generated/                  ← openapi-generator 产物（不手改，commit 入 git）
│   │   │   ├── client.ts                   ← fetch interceptor + 401 → refresh
│   │   │   └── index.ts
│   │   └── package.json                    ← name: "@nvy/api-client"
│   ├── auth/                               ← Zustand store + token 管理 + 高层登录函数
│   │   ├── src/
│   │   │   ├── store.ts
│   │   │   ├── usecases.ts                 ← loginByPassword / loginByPhoneSms / refreshToken / logoutAll
│   │   │   └── index.ts
│   │   └── package.json                    ← name: "@nvy/auth"
│   ├── types/                              ← 共享 TS types
│   │   └── package.json                    ← name: "@nvy/types"
│   └── tsconfig/                           ← 共享 TS config
│       └── base.json
│
├── pnpm-workspace.yaml
├── package.json                            ← root（仅 workspace devDeps + scripts）
├── tsconfig.json                           ← root（references + paths）
├── .claude/
│   ├── settings.json
│   ├── settings.local.json                 ← gitignored
│   └── nativewind-mapping.md               ← UI/UX → NativeWind className 翻译规则（≥ 5 条）
├── .github/
│   └── workflows/                          ← CI / release-please / deploy-web
└── docs/
    └── plans/                              ← Claude Code plans 落盘目录
```

### 业务模块字符串约束

`apps/<target>/features/<module>/` 中的 `<module>` 与后端 `mbw-<module>` 必须严格一致：`account / pkm / billing / work / wealth / health / inspire`。详见 [meta CLAUDE.md § 业务命名](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#业务命名)。

### 代码归属判断（怎么决定放 packages/\* 还是 apps/<target>/）

| 类型                                       | 例子                                              | 放哪                                                                       |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------- |
| **业务逻辑 / 数据层**（必跨端共享）        | auth store / api client / validation schema       | `packages/auth` / `packages/api-client` / `packages/types`                 |
| **可共享 UI**（简单页面通用组件）          | Button / Input / TabSwitcher / Form 原语          | `packages/ui`（NativeWind className，跨栈共享）                            |
| **平台特定 UI**（paradigm 不同）           | PKM 大屏画布 / 知识图谱（web）/ mobile 触摸版 PKM | 直接写在对应 `apps/<target>/`，**不进 packages**（强行共享反而增加复杂度） |
| **平台特定能力**（only-native / only-web） | EAS deeplink / web SEO meta / Service Worker      | 对应 `apps/<target>/`                                                      |

## 三、跨端差异处理

### 决策树

1. **优先**：写到 `packages/ui`，NativeWind className 跨栈共用（native 现在 + web M2）
2. **样式必须**：用 NativeWind className（如 `bg-brand-500 px-md py-sm rounded-md`），**禁止** 直接 `StyleSheet.create` 含平台特定值；**禁止** inline hex / px 字面量
3. **小幅 paradigm 差异**：`apps/native` 内用文件后缀（见下表）
4. **大幅 paradigm 差异**（M2 PKM 大屏画布 / 知识图谱）：在 `apps/web` 重写，**不**勉强共享 — 此时 packages/api-client + packages/auth 仍跨享，仅 UI 层各写各的

### 文件后缀约定（apps/native 内）

| 后缀              | 加载平台                                                   |
| ----------------- | ---------------------------------------------------------- |
| `foo.tsx`         | apps/native 通用（iOS + Android + RN Web 出的 web bundle） |
| `foo.web.tsx`     | 仅 RN Web bundle                                           |
| `foo.native.tsx`  | iOS + Android                                              |
| `foo.ios.tsx`     | 仅 iOS                                                     |
| `foo.android.tsx` | 仅 Android                                                 |

加载优先级由 Metro / Expo Router 决定：平台特定 > native > 通用。

`apps/web`（M2+）由 Next.js 管理，不走 Metro 后缀分发；大屏页面直接独立文件实现。

## 四、UI/UX 工作流

详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。要点：

- M1.1 ~ M1.3 用 **A 路径**：Claude Code + `UI UX Pro Max` skill；**不引入** Claude Design
- M2 PKM 类 1 页面（笔记列表 / 编辑器等）用 **B 路径**：Claude Design 出原型 → 翻译为 NativeWind className
- 类 2（自由画布）/ 类 3（图表）由专用库决定主体（tldraw / react-native-skia + d3-force / Victory Native）
- **Token 优先**：`packages/design-tokens/src/index.ts` 是单源，apps/native/tailwind.config.ts 引用；hex / px 字面量禁入业务代码
- 配套 skill 安装：`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` + `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`
- skill 在 SDD `/plan` + `/implement` 阶段**自动激活**（不是独立阶段）；plan.md 内必含 `## UI 结构` 段
- `.claude/nativewind-mapping.md` 写下至少 5 条翻译规则（间距走 className / 颜色走 design-tokens / className ≤ 4 原子 / 复用既有组件优先 / RN-Web 兼容写法）

## 五、测试约定

### 测试范围（**不与 backend 同等强度的 TDD**）

| 类型                           | 强度                                                              | 工具                       |
| ------------------------------ | ----------------------------------------------------------------- | -------------------------- |
| 关键 hook（自定义业务 hook）   | 🟢 **必须测**（先测后实现）                                       | vitest                     |
| 工具函数（lib/utils 等纯函数） | 🟢 **必须测**                                                     | vitest                     |
| store（Zustand）的复杂状态机   | 🟢 **必须测**（关键流转）                                         | vitest                     |
| API 调用层（含错误映射）       | 🟡 推荐测                                                         | vitest + msw               |
| UI 组件（视觉 + 交互）         | ⏸ **不强制 TDD**（业内争议大），但鼓励 visual regression（M2 后） | 视情况：playwright / detox |
| Expo Router 页面               | ⏸ 不强制                                                          | E2E 覆盖即可               |

**核心原则**：**有明确输入输出 / 业务规则的代码必须 TDD；纯展示型组件可不 TDD**。

### 命名约定

| 类型       | 文件命名                             |
| ---------- | ------------------------------------ |
| 单元测试   | `<name>.test.ts(x)` 与被测文件同目录 |
| 集成 / E2E | `e2e/<feature>.spec.ts`（M2 之后）   |

### 工具链（M1.1 第一周敲定具体配置）

- 单元测试：**vitest**（与 NativeWind / Expo 生态兼容性最好）
- API mock：**msw**
- E2E（M2+）：候选 playwright（web）+ detox（native）

## 六、API 客户端

后端 OpenAPI spec → 前端 TS 客户端**自动生成**，不手写：

```bash
# 重新生成 API 客户端（root 命令委托给 @nvy/api-client）
pnpm api:gen          # 拉 prod spec
pnpm api:gen:dev      # 拉 localhost:8080 spec
```

详见 [meta `/sync-api-types` 命令文档](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/.claude/commands/sync-api-types.md)。

- 生成产物落到 `packages/api-client/src/generated/`
- **禁止**手改产物
- consumer（apps/native / apps/web / 其他 packages）通过 `@nvy/api-client` 入口 import，**禁止**直接 deep-import `@nvy/api-client/src/generated/...`
- 后端 spec 变更后必须重新生成 + 适配调用方
- 详见 [meta CLAUDE.md § API 契约](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#api-契约)

## 七、Lint / 格式化 / 类型检查

| 工具                    | 用途                                              | 配置文件                                     |
| ----------------------- | ------------------------------------------------- | -------------------------------------------- |
| **TypeScript**          | `strict: true` + `noUncheckedIndexedAccess: true` | `tsconfig.json`                              |
| **ESLint**              | 代码静态检查                                      | `.eslintrc.cjs`（M1.1 第一周敲定具体规则集） |
| **Prettier**            | 自动格式化                                        | `.prettierrc`                                |
| **husky + lint-staged** | pre-commit 阻止 lint 错误                         | `.husky/`                                    |

CI 拦截：lint / type 错误必须修才能合并。

## 八、构建 / 测试 / 启动命令

所有命令在仓 root 跑（`no-vain-years-app/`）；跨包操作走 `pnpm -r ...`，单包定向走 `pnpm --filter <name> ...`。

```bash
# 安装依赖（链接整个 workspace）
pnpm install

# 启动 apps/native dev 服务（默认 metro）
pnpm dev                 # = pnpm --filter native dev
pnpm web                 # = pnpm --filter native web，浏览器
pnpm ios                 # = pnpm --filter native ios，iOS 模拟器
pnpm android             # = pnpm --filter native android，Android 模拟器

# 启动 apps/web dev 服务（M2 启用后）
pnpm web:next            # = pnpm --filter web dev

# 类型检查（全 packages）
pnpm typecheck           # = pnpm -r typecheck

# Lint（全 packages）
pnpm lint                # = pnpm -r lint
pnpm lint:fix            # = pnpm -r lint:fix

# 单元测试（全 packages）
pnpm test                # = pnpm -r test
pnpm test:watch          # = pnpm -r test --watch

# 重新生成 API client
pnpm api:gen
pnpm api:gen:dev

# EAS 构建（M2 接入后）
pnpm --filter native exec eas build --platform ios
pnpm --filter native exec eas build --platform android

# Web export（Cloudflare Pages 部署用）
pnpm --filter native exec expo export -p web   # 输出到 apps/native/dist/
```

具体命令在 root `package.json#scripts` 落地。

## 九、git / commit

| 项             | 约定                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 分支命名       | 见 [meta CLAUDE.md § Git 工作流](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#git-工作流)                                   |
| Commit 消息    | Conventional Commits                                                                                                                                    |
| Commit scope   | 业务模块名（`feat(account): ...`），跨模块用 `core`，全局用 `repo`                                                                                      |
| PR 合入        | Squash merge，删 feature 分支                                                                                                                           |
| Release 自动化 | release-please（M1.2 接入），见 [meta CLAUDE.md § 版本号 / 发版](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#版本号--发版) |

**禁止**提交：`package-lock.json` / `yarn.lock` / `bun.lockb`、`.expo/`、`node_modules/`、`.env*`（除 `.env.example`）。

## 十、AI 协作（Claude Code）

1. **改任何文件前先读它**：避免 Claude 默认覆盖既有内容
2. **禁止越过 OpenAPI 客户端**：不要手写 fetch 调用业务接口；通过 `@nvy/api-client` 走
3. **跨业务模块改动慎重**：业务边界 `features/<module>/` 之间不该相互依赖；违反时必须解释为什么
4. **跨包依赖纪律**：`apps/*` 可依赖 `packages/*`；`packages/*` 之间允许（按 ui ↔ api-client ↔ auth 三角依赖图）；`packages/*` **不可**反向依赖 `apps/*`
5. **package import 走 entry**：从 `@nvy/<pkg>` 入口 import，**禁止** deep-import 内部路径（`@nvy/api-client/src/generated/...`）
6. **引入新依赖时主动询问**：避免无意识扩大依赖面；尤其 native 模块（要 prebuild）必报告；区分 root devDep / per-package runtime dep
   - **Expo SDK / RN ecosystem 包**（任何 `expo-*` / `react-native` / `react-native-*`）必须 `cd apps/native && pnpm exec expo install <pkg>`；**不要** 用 `pnpm add` —— 后者拉 npm latest，可能超出当前 SDK 兼容版本（5/2 PR #22 撞过 SDK 55 vs 54 的版本错位）
   - **非 Expo 包**（`zustand` / `@tanstack/react-query` / `react-hook-form` / `zod` / 等纯 JS lib）走普通 `pnpm add --filter <pkg>` 或 `pnpm add -Dw`
   - **版本漂移修复**：`cd apps/native && pnpm exec expo install --fix`
   - 不确定包属哪类时，停下来问
7. **生成的代码必须遵守本文件全部约定**
8. **样式规范**：`@nvy/design-tokens` 的 token + NativeWind className（`bg-brand-500` / `p-md` 等）优先，避免 inline style / hex / px 字面量
9. **token 安全**：refresh token 等敏感凭证只走 `expo-secure-store` (native) / localStorage (web 测试期)；**禁止** 写进 MMKV / AsyncStorage
10. **不确定时停下来问**：宁可多问一次，不要凭推测改架构关键点

---

## 关联

- Meta 仓公共规则：[CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md)（Git workflow、业务命名、模块化、版本号 / 发版）
- UI/UX 工作流：[docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)
- 账号中心 PRD：[docs/requirement/account-center.v2.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/requirement/account-center.v2.md)
- 后端 API 提供方仓库：[my-beloved-server](https://github.com/xiaocaishen-michael/my-beloved-server)
