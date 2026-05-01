# Tamagui 映射规则

UI/UX 设计意图 → Tamagui 代码翻译规则。本文件由 Claude Code 在 SDD `/plan` + `/implement` 阶段自动加载，约束 UI 代码生成行为。

> 配套：`UI UX Pro Max` skill（`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`）— 在描述匹配 UI/UX 任务时自动激活，配合本规则集生成 token-mapped 代码。

## 强约束（必遵循）

### 1. 间距 token 优先

- 所有 padding / margin / gap 必须用 `$space.{xs|sm|md|lg|xl}` token，**不允许** 写 `8` / `12px` / `0.5rem` 等字面量
- 例外：极少数 1px 分隔线类，可写 `borderWidth={1}`；其他禁绝

```tsx
// ✅ 正确
<YStack gap="$space.md" padding="$space.lg" />

// ❌ 错误
<YStack gap={16} padding={24} />
```

### 2. 颜色 token 优先

- 所有颜色（fg / bg / border / shadow）走 `$color.{brand|danger|warning|success|muted|surface|text|border}` token
- **禁止** inline hex（`#FF0000`）/ rgb / hsl 字面量
- 临时调试可用，PR 必须替换为 token

```tsx
// ✅ 正确
<Button backgroundColor="$color.brand" color="$color.surface" />

// ❌ 错误
<Button backgroundColor="#3B82F6" color="white" />
```

### 3. 字号 / 圆角 / 阴影同上

- 字号走 `$size.*` 或 `$fontSize.*`；圆角走 `$radius.*`；阴影走 `$shadow.*`
- token 不够用时，加新 token 到 `packages/ui/src/tamagui.config.ts`，**不**在业务代码内写字面量

### 4. inline style 不超 3 行

- 单个 component 的 inline 样式 prop 不超 3 个；超过 → 抽 styled component 到 `packages/ui/`
- 复用频次 ≥ 2 → 必须抽包

```tsx
// ✅ 复用频次 ≥ 2，抽 packages/ui/Button.tsx
import { Button } from '@nvy/ui';
<Button variant="primary" size="md">登录</Button>

// ⚠️ 单次使用，inline 可接受（≤ 3 行）
<XStack alignItems="center" gap="$space.sm" />
```

### 5. RN-Web 兼容写法

- **禁用** `borderRadius: '50%'`（RN-Web 报警告，用 `borderRadius={9999}` 或 token）
- **禁用** `borderWidth` 用百分比（RN 不支持）
- `position: 'fixed'` 仅 web 端用 — 用 `.web.tsx` 后缀文件分流；apps/native 通用写 `position: 'absolute'`
- 字体 fallback 链：iOS / Android / Web 三端的字体实际渲染不同，用 Tamagui `$family.*` token 抽象

## 推荐（强烈鼓励）

### 6. 复用既有组件优先

- 写新页面前，先 grep `packages/ui/src/` 看有无现成组件
- 90% 业务页面应由 `<Button>` `<Input>` `<Form>` `<Card>` `<Stack>` 几个原语组合而成

### 7. 状态机化处理 loading / error

- 任何含异步调用的 component 必须有 4 个状态：`idle | loading | success | error`
- loading 用 disabled button + spinner；error 用 `<Toast>`（packages/ui 提供）

### 8. a11y 不省

- 所有交互 component 必须有 `accessibilityLabel`
- form 的 label / input 配对必须正确
- tab 顺序合理（`accessibilityRole` + `tabIndex`）

## 反模式（CR 时必驳回）

- ❌ inline hex / px / rem 字面量
- ❌ 复制粘贴 styled component 到 features/ 内（应在 packages/ui 抽公共）
- ❌ 直接引 `react-native` 的 `View` / `Text`（用 Tamagui 的 `<YStack>` / `<Text>`）
- ❌ 在业务代码内写 platform-specific style 分支（用 .web.tsx / .native.tsx 文件后缀代替）
- ❌ token 系统不够用时，私自在业务代码加 magic value（应去 packages/ui/src/tamagui.config.ts 加 token）

## 升级路径

| 触发条件                           | 升级                                      |
| ---------------------------------- | ----------------------------------------- |
| token 重复定义 ≥ 3 次              | 抽到 packages/ui/                         |
| 同样组件在 ≥ 2 个 features/ 出现   | 升到 packages/ui/                         |
| Tamagui 默认 token 不够用          | 在 packages/ui/src/tamagui.config.ts 扩展 |
| 大屏 desktop 视觉断裂（M2 PKM 等） | 不强行 RN Web，转 apps/web (Next.js) 重写 |
