# no-vain-years-app

「不虚此生」跨端前端 **monorepo**（pnpm workspace）。M1 ~ M2 早期 `apps/native`（Expo + RN Web）一份代码同步交付 iOS / Android / Web；M2 PKM 启动时引入 `apps/web`（Next.js）处理大屏画布 / 知识图谱 / dashboard 等 paradigm 与移动端不同的场景；M5 Tauri 包装 web bundle 补 Desktop。对外消费 [my-beloved-server](https://github.com/xiaocaishen-michael/my-beloved-server) 的 REST API。

**核心架构原则**：业务逻辑 / 数据层 / 共享 UI 抽到 `packages/*`；platform-specific 代码（routes / 大屏画布等）落在对应 `apps/<target>`。两 apps 对等，不存在主从。

## 关于本文件

本文件 = **写代码时必须遵守的规约**。系统级规则（Git workflow、业务命名、API 契约、版本号策略、模块化）见 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md)；UI/UX 工作流详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。

读入顺序：先读 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md) → 读 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md) → 读本文件。

---

## 一、技术栈

技术栈完整清单见 [meta docs/architecture/tech-stack.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/architecture/tech-stack.md)。核心：pnpm workspace / Expo + RN + NativeWind v4（native）/ Next.js（web，M2+）/ TypeScript strict / Zustand + TanStack Query / React Hook Form + zod / OpenAPI Generator（`@nvy/api-client`）/ EAS Build / Cloudflare Pages。

> **包管理器纪律**：项目仅支持 pnpm。提交前禁止出现 `package-lock.json` / `yarn.lock` / `bun.lockb`，CI 会拦截。
>
> **Storage 安全纪律**：refresh token 等敏感凭证走 `expo-secure-store`（native）/ localStorage（M1 web 测试期，M3 前升级 HttpOnly cookie）；业务 state 走 MMKV / localStorage。**禁止**把 token 写进 MMKV / AsyncStorage。

## 二、目录约定（monorepo 结构）

pnpm workspace：`apps/native`（Expo + RN Web bundle）+ `apps/web`（Next.js，M2 PKM 启动时新建）+ `packages/*`（`@nvy/design-tokens` / `@nvy/ui` / `@nvy/api-client` / `@nvy/auth` / `@nvy/types` / tsconfig）。结构参考 root `pnpm-workspace.yaml` 与 `package.json`。

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

- **M1.1 server**（无 UI 工作）走 **A 路径**：Claude Code + `UI UX Pro Max` skill
- **M1.2 ~ M1.3 前端账号中心**起走 **B 路径**：Claude Design 出 mockup → Claude Code 翻译为 NativeWind className（per [ADR-0015](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0015-claude-design-from-m1-2.md)，由 [ADR-0014](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0014-nativewind-tailwind-universal.md) NativeWind 切换 enable，handoff 翻译成本近 0）
- M2 PKM 类 1 页面（笔记列表 / 编辑器等）继续 B 路径
- 类 2（自由画布）/ 类 3（图表）由专用库决定主体（tldraw / react-native-skia + d3-force / Victory Native）
- **Mockup 留迹位置**：`apps/native/spec/<page>/design/`（与 spec.md / plan.md / tasks.md 同位）；存 PNG / handoff bundle / 设计 notes。**代码是真相源**，mockup drift 不算 bug
- **SDD 工作流嵌入 mockup**：spec → mockup（design/）→ /plan（吸收 mockup 决策出 UI 结构段）→ /tasks → /implement，不增步骤数
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

标准命令（install / dev / ios / android / typecheck / lint / test）见 root `package.json#scripts`。非显而易见的命令：

```bash
# 重新生成 API client（不可手写，必须走这里）
pnpm api:gen          # 拉 prod spec（localhost:8080 关）
pnpm api:gen:dev      # 拉 localhost:8080 spec（本地 server 开着时）

# EAS 构建（M2 接入后）
pnpm --filter native exec eas build --platform ios
pnpm --filter native exec eas build --platform android

# Web export（Cloudflare Pages 部署用）
pnpm --filter native exec expo export -p web   # 输出到 apps/native/dist/
```

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
