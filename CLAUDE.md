# no-vain-years-app

「不虚此生」跨端前端 **monorepo**（pnpm workspace）。`apps/native`（Expo + RN Web）覆盖 iOS / Android / Web；`apps/web`（Next.js）承担大屏 paradigm 场景。对外消费 [my-beloved-server](https://github.com/xiaocaishen-michael/my-beloved-server) 的 REST API。

**核心架构原则**：业务逻辑 / 数据层 / 共享 UI 抽到 `packages/*`；platform-specific 代码（routes / 大屏画布等）落在对应 `apps/<target>`。两 apps 对等，不存在主从。

## 关于本文件

本文件 = **写代码时必须遵守的规约**。系统级规则（Git workflow、业务命名、API 契约、版本号策略、模块化）见 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md)；UI/UX 工作流详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。

读入顺序：先读 [meta CLAUDE.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md) → 按需读 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md) → 读本文件。

---

## 一、目录约定（monorepo 结构）

pnpm workspace（`apps/*` + `packages/*`），具体清单以 `pnpm-workspace.yaml` 为准。业务模块字符串约束见 [meta business-naming.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/conventions/business-naming.md)。

### 代码归属判断（怎么决定放 packages/\* 还是 apps/<target>/）

| 类型                                       | 例子                                              | 放哪                                                                       |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------- |
| **业务逻辑 / 数据层**（必跨端共享）        | auth store / api client / validation schema       | `packages/auth` / `packages/api-client` / `packages/types`                 |
| **可共享 UI**（简单页面通用组件）          | Button / Input / TabSwitcher / Form 原语          | `packages/ui`（NativeWind className，跨栈共享）                            |
| **平台特定 UI**（paradigm 不同）           | PKM 大屏画布 / 知识图谱（web）/ mobile 触摸版 PKM | 直接写在对应 `apps/<target>/`，**不进 packages**（强行共享反而增加复杂度） |
| **平台特定能力**（only-native / only-web） | EAS deeplink / web SEO meta / Service Worker      | 对应 `apps/<target>/`                                                      |

## 二、跨端差异处理

### 决策树

1. **优先**：写到 `packages/ui`，NativeWind className 跨栈共用
2. **样式必须**：用 NativeWind className（如 `bg-brand-500 px-md py-sm rounded-md`），**禁止** 直接 `StyleSheet.create` 含平台特定值；**禁止** inline hex / px 字面量
3. **小幅 paradigm 差异**：`apps/native` 内用文件后缀（见下表）
4. **大幅 paradigm 差异**（如 PKM 大屏画布 / 知识图谱）：在 `apps/web` 重写，**不**勉强共享 — 此时 packages/api-client + packages/auth 仍跨享，仅 UI 层各写各的

### 文件后缀约定（apps/native 内）

| 后缀              | 加载平台                                                   |
| ----------------- | ---------------------------------------------------------- |
| `foo.tsx`         | apps/native 通用（iOS + Android + RN Web 出的 web bundle） |
| `foo.web.tsx`     | 仅 RN Web bundle                                           |
| `foo.native.tsx`  | iOS + Android                                              |
| `foo.ios.tsx`     | 仅 iOS                                                     |
| `foo.android.tsx` | 仅 Android                                                 |

加载优先级由 Metro / Expo Router 决定：平台特定 > native > 通用。

`apps/web` 由 Next.js 管理，不走 Metro 后缀分发；大屏页面直接独立文件实现。

## 三、UI/UX 工作流

详见 [docs/ui-ux-workflow.md](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)。要点：

- UI 类别分支（类 1 标准 / 类 2 自由画布 / 类 3 数据可视化）见 [meta sdd.md § 前端 UI 工作流变体](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/conventions/sdd.md)（per ADR-0017）
- **Mockup 留迹位置**：`apps/native/specs/<page>/design/`（与 spec.md / plan.md / tasks.md 同位）；存 PNG / handoff bundle / 设计 notes。**代码是真相源**，mockup drift 不算 bug
- **SDD 工作流嵌入 mockup**：spec → mockup（design/）→ /plan（吸收 mockup 决策出 UI 结构段）→ /tasks → /implement，不增步骤数
- **Token 优先**：`packages/design-tokens/src/index.ts` 是单源，apps/native/tailwind.config.ts 引用；hex / px 字面量禁入业务代码
- `.claude/nativewind-mapping.md` 写下至少 5 条翻译规则（间距走 className / 颜色走 design-tokens / className ≤ 4 原子 / 复用既有组件优先 / RN-Web 兼容写法）

## 四、测试约定

### 测试范围（**不与 backend 同等强度的 TDD**）

| 类型                           | 强度                                                     | 工具                       |
| ------------------------------ | -------------------------------------------------------- | -------------------------- |
| 关键 hook（自定义业务 hook）   | 🟢 **必须测**（先测后实现）                              | vitest                     |
| 工具函数（lib/utils 等纯函数） | 🟢 **必须测**                                            | vitest                     |
| store（Zustand）的复杂状态机   | 🟢 **必须测**（关键流转）                                | vitest                     |
| API 调用层（含错误映射）       | 🟡 推荐测                                                | vitest + msw               |
| UI 组件（视觉 + 交互）         | ⏸ **不强制 TDD**（业内争议大），但鼓励 visual regression | 视情况：playwright / detox |
| Expo Router 页面               | ⏸ 不强制                                                 | E2E 覆盖即可               |

**核心原则**：**有明确输入输出 / 业务规则的代码必须 TDD；纯展示型组件可不 TDD**。

### 命名约定

| 类型       | 文件命名                             |
| ---------- | ------------------------------------ |
| 单元测试   | `<name>.test.ts(x)` 与被测文件同目录 |
| 集成 / E2E | `e2e/<feature>.spec.ts`              |

## 五、AI 协作（Claude Code）

1. **禁止越过 OpenAPI 客户端**：不要手写 fetch 调用业务接口；通过 `@nvy/api-client` 走
2. **跨包依赖纪律**：`apps/*` 可依赖 `packages/*`；`packages/*` 之间允许（按 ui ↔ api-client ↔ auth 三角依赖图）；`packages/*` **不可**反向依赖 `apps/*`
3. **package import 走 entry**：从 `@nvy/<pkg>` 入口 import，**禁止** deep-import 内部路径（`@nvy/api-client/src/generated/...`）
4. **引入新依赖时主动询问**：避免无意识扩大依赖面；尤其 native 模块（要 prebuild）必报告；区分 root devDep / per-package runtime dep
   - **Expo SDK / RN ecosystem 包**（任何 `expo-*` / `react-native` / `react-native-*`）必须 `cd apps/native && pnpm exec expo install <pkg>`；**不要** 用 `pnpm add` —— 后者拉 npm latest，可能超出当前 SDK 兼容版本（5/2 PR #22 撞过 SDK 55 vs 54 的版本错位）
   - **非 Expo 包**（`zustand` / `@tanstack/react-query` / `react-hook-form` / `zod` / 等纯 JS lib）走普通 `pnpm add --filter <pkg>` 或 `pnpm add -Dw`
   - **版本漂移修复**：`cd apps/native && pnpm exec expo install --fix`
   - 不确定包属哪类时，停下来问
5. **样式规范**：`@nvy/design-tokens` 的 token + NativeWind className（`bg-brand-500` / `p-md` 等）优先，避免 inline style / hex / px 字面量
6. **token 安全**：refresh token 等敏感凭证只走 `expo-secure-store` (native) / localStorage (web 测试期)；**禁止** 写进 MMKV / AsyncStorage

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan

<!-- SPECKIT END -->
