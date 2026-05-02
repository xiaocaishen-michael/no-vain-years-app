# NativeWind 映射规则

UI/UX 设计意图 → NativeWind className 翻译规则。本文件由 Claude Code 在 SDD `/plan` + `/implement` 阶段自动加载，约束 UI 代码生成行为。

> 配套：`UI UX Pro Max` skill（`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`）— 在描述匹配 UI/UX 任务时自动激活，配合本规则集生成 token-mapped 代码。

> **底座**：NativeWind v4 + Tailwind + `@nvy/design-tokens`（plain TS object，被 `apps/native/tailwind.config.ts` 与未来 `apps/web/tailwind.config.ts` 共同 import）。所有 token 命名走 Tailwind 标准（`brand-500` / `spacing.md` / `text-base` 等），新增 token 必须改 `packages/design-tokens/src/index.ts`，禁止在业务代码内写字面量。

## 强约束（必遵循）

### 1. 间距走 Tailwind class

- 所有 padding / margin / gap 必须用 `p-{xs|sm|md|lg|xl|2xl}` / `m-*` / `gap-*` class，**不允许**写 `style={{ padding: 16 }}` / `8px` 等字面量
- token 不够用时，去 `packages/design-tokens/src/index.ts` 的 `spacing` 加新值，**不**在业务代码内 magic number

```tsx
// ✅ 正确
<View className="gap-md p-lg" />

// ❌ 错误
<View style={{ gap: 16, padding: 24 }} />
```

### 2. 颜色走 Tailwind class

- 所有颜色（bg / text / border）走 `bg-brand-500` / `text-text` / `border-border` 等 class，**禁止** inline hex / rgb / hsl
- 颜色 scale 来自 `@nvy/design-tokens` 的 `colors`；新增颜色（如 danger / warning / success）改 design-tokens

```tsx
// ✅ 正确
<Pressable className="bg-brand-500" />
<Text className="text-text" />

// ❌ 错误
<Pressable style={{ backgroundColor: '#3B82F6' }} />
<Text style={{ color: '#111827' }} />
```

### 3. 字号 / 圆角 / 阴影同上

- 字号走 `text-{xs|sm|base|lg|xl|2xl|3xl}` class
- 圆角走 `rounded-{sm|md|lg|full}` class
- 阴影走 `shadow-{sm|md|lg}` class
- token 不够用时，加新 token 到 `packages/design-tokens/src/index.ts`，**不**在业务代码内写字面量

### 4. className 不超 4 个原子（per element）

- 单个 component 的 className 不超 4 个 utility class；超过 → 抽 styled component 到 `packages/ui/`
- 复用频次 ≥ 2 → 必须抽包

```tsx
// ✅ 复用频次 ≥ 2，抽 packages/ui/Button.tsx
import { Button } from '@nvy/ui';
<Button variant="primary" size="md">登录</Button>

// ⚠️ 单次使用，4 个原子内可接受
<View className="flex-row items-center gap-sm" />

// ❌ 超过 4 个原子 + 复用 → 抽组件
<Pressable className="flex-row items-center gap-sm bg-brand-500 px-lg py-md rounded-md shadow-md" />
```

### 5. RN-Web 兼容写法

- **禁用** `rounded-[50%]`（RN-Web 报警告，用 `rounded-full` 或 `rounded-[9999px]`）
- **禁用** 百分比 borderWidth（RN 不支持）
- web 专属样式（如 hover / focus-visible）用 `web:` 前缀（NativeWind v4 平台 modifier）；native-only 用 `native:`
- 字体 fallback 链：用 design-tokens 的 `fontFamily.body` / `heading` / `mono` token 抽象，避免在业务代码写具体字体名

## 推荐（强烈鼓励）

### 6. 复用既有组件优先

- 写新页面前，先 grep `packages/ui/src/` 看有无现成组件
- 90% 业务页面应由 `<Button>` `<Input>` `<Form>` `<Card>` 几个原语组合而成

### 7. 状态机化处理 loading / error

- 任何含异步调用的 component 必须有 4 个状态：`idle | loading | success | error`
- loading 用 disabled button + spinner；error 用 `<Toast>`（packages/ui 提供）

### 8. a11y 不省

- 所有交互 component 必须有 `accessibilityLabel`
- form 的 label / input 配对必须正确
- tab 顺序合理（`accessibilityRole` + `tabIndex`）

## 反模式（CR 时必驳回）

- ❌ inline hex / px / rem 字面量（用 className）
- ❌ 复制粘贴 styled component 到 features/ 内（应在 packages/ui 抽公共）
- ❌ 在业务代码内 magic 颜色 / 间距 / 字号（去 design-tokens 加 token）
- ❌ 业务代码混用 className + StyleSheet.create / style prop（除非 className 表达不出来，比如动态计算位移）
- ❌ 在业务代码内写 platform-specific style 分支（用 `.web.tsx` / `.native.tsx` 文件后缀 或 `web:` / `native:` modifier）

## 升级路径

| 触发条件                           | 升级                                                    |
| ---------------------------------- | ------------------------------------------------------- |
| token 重复定义 ≥ 3 次              | 抽到 `packages/design-tokens/src/index.ts`              |
| 同样组件在 ≥ 2 个 features/ 出现   | 升到 `packages/ui/`                                     |
| Tailwind 默认 class 不够用         | 在 `packages/design-tokens` 扩展 + tailwind.config 接入 |
| 大屏 desktop 视觉断裂（M2 PKM 等） | 不强行 RN Web，转 `apps/web` (Next.js) 重写             |
