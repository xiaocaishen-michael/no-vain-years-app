# Login 页 — Claude Design handoff notes

> Bundle 来源：[claude.ai/design](https://claude.ai/design) export，2026-05-03 17:04 生成（v2，第二轮 RN+NativeWind 形态）。
> 完整原始 bundle 在 `./source/`。本文档记录**项目特定决策**与翻译期注意点。

## 1. Bundle 内容速览

| 文件                                    | 角色                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `source/LoginScreen.tsx` (22.2KB)       | 主组件，含 4 状态 + 2 模式 + 全部子组件                                |
| `source/LoginScreenPreview.tsx` (3.9KB) | 预览 wrapper，4 状态横排展示                                           |
| `source/IOSFrame.tsx` (1.9KB)           | iOS 设备外框（仅展示用，不进 implementation）                          |
| `source/tailwind.config.js` (1.8KB)     | bundle 自带 Tailwind 配置（**已 mirror 到 `packages/design-tokens`**） |
| `source/assets/logo-mark.svg`           | 品牌 logo 资源                                                         |
| `source/CLAUDE-DESIGN-BUNDLE-README.md` | Claude Design 通用 README（与本 bundle 实际形态无关，仅留底参考）      |

## 2. 组件 breakdown（待 `/speckit.implement` 阶段抽到 `packages/ui`）

| 组件               | 在 bundle 中位置      | 抽取目标                                              | 备注                                                                               |
| ------------------ | --------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Spinner`          | LoginScreen.tsx ~L47  | `@nvy/ui`                                             | reanimated rotation；3 tone                                                        |
| `SuccessCheck`     | LoginScreen.tsx ~L85  | `@nvy/ui`                                             | reanimated scale-in                                                                |
| `useCountdown`     | LoginScreen.tsx ~L112 | `apps/native/lib/hooks` 或 `@nvy/ui/hooks`            | 60s SMS 重发倒计时                                                                 |
| `TabSwitcher`      | LoginScreen.tsx ~L131 | `@nvy/ui`                                             | B 站风格下划线条；与项目原计划的胶囊式 NvyTabSwitcher **不同** — 用 underline 形态 |
| `PhoneInput`       | LoginScreen.tsx ~L177 | `@nvy/ui`                                             | +86 prefix + 下划线分隔                                                            |
| `PasswordInput`    | LoginScreen.tsx 后续  | `@nvy/ui`                                             | —                                                                                  |
| `SmsCodeInput`     | LoginScreen.tsx 后续  | `@nvy/ui`                                             | —                                                                                  |
| `ConsentRow`       | LoginScreen.tsx 后续  | `apps/native/features/account` 内（业务文案，不抽享） | 协议勾选                                                                           |
| `GoogleButton`     | LoginScreen.tsx 后续  | `apps/native/features/account`                        | OAuth 圆形按钮，下方留 WeChat / Apple 的扩展位                                     |
| `LoginScreen` 主体 | LoginScreen.tsx 全文  | `apps/native/app/(auth)/login.tsx`                    | 装配上述组件                                                                       |

## 3. 状态机覆盖

| 状态值    | 视觉描述                                         | 对应业务事件                   |
| --------- | ------------------------------------------------ | ------------------------------ |
| `default` | 首次进入。手机号已记忆，等待用户输入验证码       | render                         |
| `loading` | 已发送验证码，60s 倒计时进行中。CTA 锁定为蓝灰态 | `requestSmsCode` 成功后        |
| `error`   | 验证码错误。下划线转红，错误信息出现在输入框下方 | `loginByPhoneSms` 返回 401/422 |
| `success` | 校验通过，绿色对勾绘制动画 → 跳转今日时间线      | `loginByPhoneSms` 返回 200     |

`spec.md` 状态机要 cross-check 这 4 状态命名（实施前一并校验）。

## 4. Token 决策记录（命名约定为 bundle 主导）

`packages/design-tokens` 已重写为**完全 mirror** bundle 的 `source/tailwind.config.js`：

| 维度       | 命名                                                           | 备注                                |
| ---------- | -------------------------------------------------------------- | ----------------------------------- |
| Brand      | `brand-{50..900}` + `brand-soft`                               | 主色 `#2456E5` 深邃蓝               |
| Accent     | `accent` (DEFAULT + soft)                                      | `#FF8C00` 活力橙                    |
| Text       | `ink` (DEFAULT + muted + subtle)                               | 取代通用 `text-*` 命名              |
| Border     | `line` (DEFAULT + strong + soft)                               | 取代通用 `border-*` 命名            |
| Surface    | `surface` (DEFAULT + alt + sunken)                             | 多层级                              |
| Feedback   | `ok` / `warn` / `err` (each + soft)                            | 短名优先                            |
| Spacing    | xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)   | + 3xl                               |
| Radius     | xs(4) / sm(8) / md(12) / lg(16) / full                         | 全部值上调一档（原 sm:4 → 现 sm:8） |
| FontFamily | sans (Inter + Noto Sans SC + PingFang) / mono (JetBrains Mono) | 中文 fallback 已含                  |
| BoxShadow  | `card` / `cta`                                                 | 语义命名，非通用 sm/md/lg           |

**Drop（v1 有，v2 砍）**：fontSize 自定义（用 Tailwind/NativeWind 默认）/ life-domain accents（pkm/billing/...）/ motion / layout container — 用到再加，不预造。

## 5. 翻译期注意点（`/speckit.implement` 阶段必读）

### 5.1 `w-18 h-18` 不可用（必须替换）

`source/LoginScreen.tsx:100` 的 `SuccessCheck` 用了 `className="w-18 h-18 ..."`，但 **Tailwind 默认 spacing scale 没有 18 这一档**（仅 16, 20）。NativeWind 编译时会丢弃这两个 class，圆圈不会渲染。

**修复**（择一）：

- 改用最近档：`w-16 h-16`（64px）或 `w-20 h-20`（80px）
- 用任意值：`w-[72px] h-[72px]`（保留 bundle 原意 72px）
- 在 `packages/design-tokens` 加 `spacing.18: '72px'`（不推荐，单点引入）

推荐 `w-16 h-16` 或 `w-[72px] h-[72px]`，看实施期视觉感觉。

### 5.2 reanimated v3 已是 RN 标配，但需确认依赖

`LoginScreen.tsx` 用了 `react-native-reanimated`（useSharedValue / useAnimatedStyle / withTiming / withRepeat / withSequence / Easing / cancelAnimation）。implementation 前确认 `apps/native/package.json` 已含 reanimated（应该有，Expo SDK 默认带），并按 [Expo SDK install 纪律](https://github.com/xiaocaishen-michael/no-vain-years-app/blob/main/CLAUDE.md#十-ai-协作claude-code) 用 `pnpm exec expo install react-native-reanimated` 而非 `pnpm add`。

### 5.3 inline `style={...}` 仅在动画处出现，可接受

bundle 的 className 覆盖了 95% 视觉。剩余 5% 在 reanimated 的 `style={[{ width, height }, animatedStyle]}` 复合 props，是 RN reanimated 标准用法，不是 inline CSS 反模式。直接保留。

### 5.4 className 串均使用 token 命名（已对齐）

例如 `border-brand-200 border-t-brand-500`、`bg-ok-soft`、`text-ink-muted`、`border-line` —— 全部已经在 `packages/design-tokens` 内定义。无需手翻，paste 即用。

### 5.5 `flex-row gap-7` 中的 `gap-7` 验证

Tailwind 默认有 `gap-7`（28px）。NativeWind v4 应支持。如 implementation 期发现间距未生效，回退用 `gap-[28px]` 或 `space-x-7`。

## 6. Drift 政策

代码是真相源（per ADR-0015）。

| 情况                                      | 动作                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| 实施期发现 mockup 视觉决策不合理 → 改代码 | ✅ 直接改                                                                          |
| Mockup 与最终代码视觉不完全一致（drift）  | ✅ 不算 bug，不回头改 mockup                                                       |
| Token 重新定调                            | ⚠️ 改 `packages/design-tokens`，本 handoff.md 内的"决策记录"段同步更新（重要变更） |
| 同页第二轮 mockup（如有重大视觉调整）     | 加 `mockup-v2.png` + `source-v2/` 子目录，不覆盖 v1                                |

## 7. 引用

- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../../docs/adr/0015-claude-design-from-m1-2.md)（注：链接走 meta 仓相对路径，本仓不直接含 ADR）
- [`spec.md`](../spec.md)（功能性需求 + 状态机 + 验收）
- [`plan.md`](../plan.md)（架构设计 + UI 结构段）
- [`tasks.md`](../tasks.md)（任务拆分）
