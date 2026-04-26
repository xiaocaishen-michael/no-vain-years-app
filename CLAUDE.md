# no-vain-years-app

「不虚此生」跨端前端。**一套代码** 同步交付 iOS / Android / Web；M5 阶段 Tauri 包装 Web bundle 补 Desktop。对外消费 [my-beloved-server](https://github.com/xiaocaishen-michael/my-beloved-server) 的 REST API。

## 关于本文件

本文件 = **写代码时必须遵守的规约**。系统级规则（Git workflow、业务命名、API 契约、版本号策略、模块化）见 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md)；UI/UX 工作流详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。

读入顺序：先读 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md) → 读 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md) → 读本文件。

---

## 一、技术栈

| 维度 | 选型 |
|------|------|
| 框架 | Expo（最新 stable）+ React Native |
| Web 渲染 | React Native Web |
| 语言 | TypeScript（`strict: true`） |
| 路由 | Expo Router（file-based） |
| UI 库 | **Tamagui**（iOS / Android / Web 三端一致） |
| 状态管理 | **Zustand** |
| 数据请求 / 缓存 | TanStack Query |
| 表单 | React Hook Form + zod |
| 本地存储 | MMKV（mobile）+ localStorage（web），自封统一 API |
| API 客户端 | OpenAPI Generator 从后端 `/v3/api-docs` 自动生成（**不手写**） |
| **包管理器** | **pnpm**（不用 npm / yarn / bun） |
| 构建 / 发布 | EAS Build + EAS Submit + EAS Update |
| Desktop（M5） | Tauri 2.x 包装 Web bundle |

> **包管理器纪律**：项目仅支持 pnpm。提交前禁止出现 `package-lock.json` / `yarn.lock` / `bun.lockb`，CI 会拦截。

## 二、目录约定（脚手架时落地，规则先定）

```
no-vain-years-app/
├── app/                     ← Expo Router file-based 路由（页面）
│   ├── (auth)/              ← 路由组：登录 / 注册
│   ├── (main)/              ← 路由组：登录后主流程
│   └── _layout.tsx          ← 根 layout
├── features/                ← 业务模块（与后端 mbw-<module> 一一对应）
│   ├── account/             ← 对应后端 mbw-account
│   ├── pkm/                 ← 对应后端 mbw-pkm（M2 引入）
│   └── ...
├── components/              ← 跨业务通用 UI 组件（基于 Tamagui）
├── lib/
│   ├── api/                 ← OpenAPI Generator 产物（不手写、不手改）
│   ├── storage/             ← MMKV / localStorage 封装
│   ├── auth/                ← token 持久化、自动刷新
│   └── utils/               ← 通用工具
├── hooks/                   ← 跨业务通用 hook
├── theme/                   ← Tamagui token 配置
├── .claude/
│   └── tamagui-mapping.md   ← UI 工作流映射规则
└── tamagui.config.ts        ← Tamagui 主配置
```

**业务模块字符串约束**：`features/<module>/` 中的 `<module>` 与后端 `mbw-<module>` 中的 `<module>` 必须严格一致（`account / pkm / billing / work / wealth / health / inspire`）。详见 [meta CLAUDE.md § 业务命名](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#业务命名)。

## 三、跨端差异处理

### 优先级

1. **优先**：写同一份代码跑三端
2. **样式必须**：用 Tamagui token + 跨端原语（`<XStack>` / `<YStack>` 等），**禁止** 直接 `StyleSheet.create` 含平台特定值
3. **必须分端时**：用文件后缀

### 文件后缀约定

| 后缀 | 加载平台 |
|------|---------|
| `foo.tsx` | 三端通用（默认） |
| `foo.web.tsx` | 仅 Web |
| `foo.native.tsx` | iOS + Android |
| `foo.ios.tsx` | 仅 iOS |
| `foo.android.tsx` | 仅 Android |

加载优先级由 Metro / Expo Router 决定：平台特定 > native > 通用。

## 四、UI/UX 工作流

详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。要点：

- M1.1~M1.3 用 **A 路径**：Claude Code + UI UX Pro Max skill；不引入 Claude Design
- M2 PKM 类 1 页面（笔记列表 / 编辑器等）用 **B 路径**：Claude Design 出原型 → 翻译为 Tamagui
- 类 2（自由画布）/ 类 3（图表）由专用库决定主体（tldraw / react-native-skia + d3-force / Victory Native）
- **Token 优先**：`tamagui.config.ts` 用命名 token；hex / px 字面量禁入业务代码
- 配套 skill：`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`
- `.claude/tamagui-mapping.md` 写下至少 5 条翻译规则

## 五、测试约定

### 测试范围（**不与 backend 同等强度的 TDD**）

| 类型 | 强度 | 工具 |
|------|------|------|
| 关键 hook（自定义业务 hook） | 🟢 **必须测**（先测后实现） | vitest |
| 工具函数（lib/utils 等纯函数） | 🟢 **必须测** | vitest |
| store（Zustand）的复杂状态机 | 🟢 **必须测**（关键流转） | vitest |
| API 调用层（含错误映射） | 🟡 推荐测 | vitest + msw |
| UI 组件（视觉 + 交互） | ⏸ **不强制 TDD**（业内争议大），但鼓励 visual regression（M2 后） | 视情况：playwright / detox |
| Expo Router 页面 | ⏸ 不强制 | E2E 覆盖即可 |

**核心原则**：**有明确输入输出 / 业务规则的代码必须 TDD；纯展示型组件可不 TDD**。

### 命名约定

| 类型 | 文件命名 |
|------|---------|
| 单元测试 | `<name>.test.ts(x)` 与被测文件同目录 |
| 集成 / E2E | `e2e/<feature>.spec.ts`（M2 之后） |

### 工具链（M1.1 第一周敲定具体配置）

- 单元测试：**vitest**（与 Tamagui / Expo 生态兼容性最好）
- API mock：**msw**
- E2E（M2+）：候选 playwright（web）+ detox（native）

## 六、API 客户端

后端 OpenAPI spec → 前端 TS 客户端**自动生成**，不手写：

```bash
# 重新生成 API 客户端
pnpm run gen:api
```

详见 [meta `/sync-api-types` 命令文档](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/.claude/commands/sync-api-types.md)。

- 生成产物落到 `lib/api/`
- **禁止**手改产物
- 后端 spec 变更后必须重新生成 + 适配调用方
- 详见 [meta CLAUDE.md § API 契约](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#api-契约)

## 七、Lint / 格式化 / 类型检查

| 工具 | 用途 | 配置文件 |
|------|------|---------|
| **TypeScript** | `strict: true` + `noUncheckedIndexedAccess: true` | `tsconfig.json` |
| **ESLint** | 代码静态检查 | `.eslintrc.cjs`（M1.1 第一周敲定具体规则集） |
| **Prettier** | 自动格式化 | `.prettierrc` |
| **husky + lint-staged** | pre-commit 阻止 lint 错误 | `.husky/` |

CI 拦截：lint / type 错误必须修才能合并。

## 八、构建 / 测试 / 启动命令

```bash
# 安装依赖
pnpm install

# 启动开发服务（默认 metro）
pnpm start

# 跑特定平台
pnpm web                 # 浏览器
pnpm ios                 # iOS 模拟器
pnpm android             # Android 模拟器

# 类型检查
pnpm tsc --noEmit

# Lint
pnpm lint
pnpm lint --fix

# 单元测试
pnpm test                # 跑一遍
pnpm test --watch        # 监听模式

# 重新生成 API client
pnpm run gen:api

# EAS 构建（M1.2 接入后）
pnpm eas build --platform ios
pnpm eas build --platform android
```

具体命令在 `package.json#scripts` 落地，M1.1 第一周敲定。

## 九、git / commit

| 项 | 约定 |
|----|------|
| 分支命名 | 见 [meta CLAUDE.md § Git 工作流](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#git-工作流) |
| Commit 消息 | Conventional Commits |
| Commit scope | 业务模块名（`feat(account): ...`），跨模块用 `core`，全局用 `repo` |
| PR 合入 | Squash merge，删 feature 分支 |
| Release 自动化 | release-please（M1.2 接入），见 [meta CLAUDE.md § 版本号 / 发版](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#版本号--发版) |

**禁止**提交：`package-lock.json` / `yarn.lock` / `bun.lockb`、`.expo/`、`node_modules/`、`.env*`（除 `.env.example`）。

## 十、AI 协作（Claude Code）

1. **改任何文件前先读它**：避免 Claude 默认覆盖既有内容
2. **禁止越过 OpenAPI 客户端**：不要手写 fetch 调用业务接口；通过 `lib/api/` 走
3. **跨业务模块改动慎重**：业务边界 features/<module>/ 之间不该相互依赖；违反时必须解释为什么
4. **引入新依赖时主动询问**：避免无意识扩大依赖面；尤其 native 模块（要 prebuild）必报告
5. **生成的代码必须遵守本文件全部约定**
6. **样式规范**：`tamagui.config.ts` 的 token + Tamagui 原语优先，避免 inline 样式 / hex 字面量
7. **不确定时停下来问**：宁可多问一次，不要凭推测改架构关键点

---

## 关联

- Meta 仓公共规则：[CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md)（Git workflow、业务命名、模块化、版本号 / 发版）
- UI/UX 工作流：[docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)
- 账号中心 PRD：[docs/requirement/account-center.v2.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/requirement/account-center.v2.md)
- 后端 API 提供方仓库：[my-beloved-server](https://github.com/xiaocaishen-michael/my-beloved-server)
