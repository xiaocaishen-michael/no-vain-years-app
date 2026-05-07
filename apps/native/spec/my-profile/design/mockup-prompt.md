# My-Profile mockup — Claude Design prompt

> 拿下文 prompt 全文（从 `## Prompt（拷贝）` 段以下）粘到 [claude.ai/design](https://claude.ai/design)，跑出 mockup bundle 后落 `apps/native/spec/my-profile/design/source/`，下次 session 进入翻译期（T10-T13）。
>
> 模板基于 `<meta>/docs/experience/claude-design-handoff.md` § 2.1 + § 2.1b，针对 my-profile 的项目特定约束（per ADR-0017 类 1 流程 + spec.md FR-001..FR-018 + notes.md 决策）定制。

---

## 设计上下文（仅给 user 看，不放进 Claude Design prompt）

| 项       | 值                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| 页面     | 「我的」主页（已 onboarded 用户冷启动直接 landing 到此）                                                             |
| 路由     | `/(app)/(tabs)/profile`（已落地，PHASE 1 占位 UI）                                                                   |
| 业务流   | 顶 nav 三 entry + 沉浸式 Hero（photo blur + 头像 + displayName + 关注/粉丝） + 三 slide tabs（笔记/图谱/知识库）骨架 |
| 视觉前置 | 复用 login v2 design-tokens；photo blur / slide tab underline / top nav 图标系统预计需新增少量 token                 |
| PHASE 1  | 骨架 + 业务流已冒烟验证（T1-T9 全 ✅）；占位 UI 使用纯文本，无精确间距/颜色/阴影                                     |
| PHASE 2  | 本 mockup 决定：沉浸式背景视觉、slide tabs underline 样式、顶 nav 图标、底 tab bar 图标系统                          |
| 反例参考 | onboarding v1 mockup（同流程：占位→冒烟→mockup→翻译）—— `apps/native/spec/onboarding/design/source/`                 |

---

## Prompt（拷贝粘到 claude.ai/design）

```text
请为「my-profile page」（「我的」主页）设计 mockup，技术栈 = React Native + NativeWind v4 + Tailwind。

# 业务上下文

「不虚此生」app 账号中心主页，已登录且已 onboarded 用户（displayName 已设置）冷启动后直接 landing 到此页面。

页面分 4 层垂直结构：
1. **顶 nav**（3 entry：≡ 左浮层 / 中空 / 右 🔍+⚙️）—— 固定在顶部（非滚动消失）
2. **Hero 区**（沉浸式 photo blur 背景 + 头像 placeholder + displayName + 关注/粉丝 stats）
3. **SlideTabs 行**（笔记 / 图谱 / 知识库 3 tab，tap 切换 + 手势滑动，sticky 置顶）
4. **Tab 内容区**（骨架占位，各 tab 显示文字 placeholder）

底部有系统底 tab bar（首页 / 搜索 / 外脑 / 我的 4 项），「我的」为当前 active tab。

本 mockup 的核心 UI 决策点：
- photo blur 沉浸式背景如何从 Hero 渐变收敛到白底内容区
- SlideTabs underline indicator 样式（颜色 / 宽度 / 动画）
- 顶 nav 图标选型（≡ 三横线 / 🔍 搜索 / ⚙️ 齿轮）
- 底 tab bar 图标系统（4 tab 各自图标 + active / inactive 视觉对比）
- Hero 头像 placeholder 视觉（无真实头像时的默认状态）

# NEGATIVE CONSTRAINTS（硬约束，禁止）

- NO HTML elements（<div> / <span> / <input> / <button>）
- NO inline style={{...}}
- NO CSS variables in style
- NO @keyframes / CSS animation
- NO style attribute outside reanimated 复合 props

# POSITIVE REQUIREMENTS（必须）

- 用 React Native 组件（View / Text / Pressable / ScrollView / ImageBackground）
- 视觉走 NativeWind className（bg-* / text-* / p-* / m-* / rounded-* / border-*）
- 动画（slide tabs underline 滑动 / hero blur 过渡）用 react-native-reanimated v3 hooks（useSharedValue / useAnimatedStyle / withTiming / Easing）
- Token 命名采用语义化（ink / line / surface / ok / warn / err / accent / brand），非通用 text-* / border-*
- blur 效果用 `@react-native-community/blur` 或 expo-blur 实现

# 页面结构（项目特定）

## Zone 1 — 顶 nav（固定，不随 scroll 消失）

3 entry 横排：
- **左**：≡ 三横线图标（无 badge）—— PHASE 2 决定图标，点击行为本 mockup 可用 onPress noop
- **中**：空（无内容）
- **右**：🔍 搜索图标 + ⚙️ 齿轮图标（并排）

顶 nav 叠加在 Hero blur 背景上（transparent / semi-transparent bg，文字/图标用白色系，与 photo blur 背景协调）。

## Zone 2 — Hero 区（沉浸式）

背景：photo blur（模糊+半透明蒙层），使用系统默认 placeholder 图片（不引入真实照片资产）。

从上至下：
1. 头像 placeholder（圆形，系统默认人形 emoji 或渐变色背景 + 首字母，64×64 dp 左右）
2. displayName（"小明"，白色系粗体）
3. 关注 / 粉丝 stats 行（"5 关注　12 粉丝"，不可点，固定 hardcode）

Hero 区底部向下渐变收敛到白底（或 surface 背景），过渡自然，SlideTabs 行紧接其下。

## Zone 3 — SlideTabs 行（sticky，scroll 后固定在 nav 下方）

3 个 tab label：笔记 / 图谱 / 知识库

- 默认 active：笔记（tap 切换 / 手势滑动切换）
- Active tab：underline indicator（brand 主色 / 下划线宽度与 label 文字等宽）+ 文字高亮
- Inactive tab：文字 ink-muted
- 整行背景：白底（surface），与 Hero blur 背景视觉上有明确的分界线

## Zone 4 — Tab 内容区

各 tab 内容区用文字 placeholder（"笔记内容 coming soon" / "图谱内容 coming soon" / "知识库内容 coming soon"），居中显示。不需要真实卡片 / 列表样式。

## Zone 5 — 底 tab bar

系统 Tabs 底 bar（4 项）：首页 / 搜索 / 外脑 / 我的
- 「我的」为当前 active（brand 主色图标 + label）
- 其余 3 项 inactive（ink-subtle 图标 + label）
- **本 mockup 决定图标选型**（可参考 SF Symbols / Material Icons 风格，使用 react-native-vector-icons 或 @expo/vector-icons 中的具体图标名）

# 状态变体 illustrate

请用 ProfileScreenPreview.tsx 横排 illustrate 以下状态：

| 状态 | 描述 |
|---|---|
| `default-notes` | 默认落地态，SlideTabs 在「笔记」，滚动未触发 sticky |
| `sticky-scrolled` | 向下滚动后，SlideTabs 行 sticky 置顶（顶 nav 下方），Hero 已滚出视口 |
| `graph-tab` | SlideTabs 切到「图谱」 |
| `kb-tab` | SlideTabs 切到「知识库」 |

# DO NOT INCLUDE（项目特定负向，per spec.md CL-* + notes.md 决策）

- ❌ VIP 标记 / 徽章 / Lv. / 积分 / 小时数（SC-004 反枚举 / M1 无 billing 模块）
- ❌ 顶 nav「+ 添加状态」按钮或动态入口
- ❌ 中部统计区快捷入口（最近/本地/网盘/装扮等）—— 已决策删除
- ❌ 三点菜单（⋯）—— 改为 ⚙️ 齿轮
- ❌ 关注 / 粉丝数字可点击进列表（互动模块 M5+ 后置）
- ❌ 头像点击换头像 / 背景点击换背景的交互 UI（M2+ 评估，本 mockup 仅视觉）
- ❌ 账号 ID / 数字 ID 展示（SC-006 反枚举，禁 accountId 暴露在 render）
- ❌ 解封 / 封禁状态 UI（login flow 独立处理，不在 profile 页）
- ❌ PKM tab 实际内容（笔记卡片 / 知识图谱 / 知识库列表 — 独立排期）

# 视觉语言（mirror login v2，期望最少新 token）

请复用 login v2 的 design tokens，名称完全一致：

- Brand：`brand-{50..900}` + `brand-soft`
- Accent：`accent` (DEFAULT + soft)
- Text：`ink` (DEFAULT + muted + subtle)
- Border：`line` (DEFAULT + strong + soft)
- Surface：`surface` (DEFAULT + alt + sunken)
- Feedback：`ok / warn / err`（each + soft）
- Spacing：`xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)`
- Radius：`xs(4) / sm(8) / md(12) / lg(16) / full`
- FontFamily：`sans (Inter + Noto Sans SC + PingFang)`
- BoxShadow：`card / cta`

预期可能需要新增的 token（如不需要则说明为何复用已有 token 满足）：
- `hero-overlay`：Hero 区 photo blur 蒙层颜色（semi-transparent dark，用于白字可读性）
- `tabs-indicator`：SlideTabs underline 指示条颜色（可能直接复用 `brand`）
- `nav-icon-on-blur`：顶 nav 图标在 blur 背景上的颜色（可能复用 `ink` 但需要 white 变体）

如有其他新 token，请在 ProfileScreen.tsx 顶部注释列出 + 解释为何不能复用。

# DELIVERABLES（输出单 bundle）

- `ProfileScreen.tsx` 主组件，含 4 zone 结构 + SlideTabs 状态机 + photo blur Hero + TopNav + 底 tab 样式
- `ProfileScreenPreview.tsx` 4 状态横排预览（default-notes / sticky-scrolled / graph-tab / kb-tab）
- `IOSFrame.tsx` iOS 设备外框（仅展示用）
- `tailwind.config.js` 含全部 token 定义（复用 login v2 base + 新增 token 高亮标注）
- `assets/`（如需新 placeholder 头像图 / hero 背景占位图）
- `CLAUDE-DESIGN-BUNDLE-README.md`（Claude Design 自带）

请生成 mockup。
```

---

## 拿到 bundle 后（下次 session 翻译期）

1. 解压到 `apps/native/spec/my-profile/design/source/`
2. 写 `apps/native/spec/my-profile/design/handoff.md`（7 段 per `<meta>/docs/experience/claude-design-handoff.md` § 5）：
   - Bundle 内容速览
   - 组件 breakdown（`<TopNav>` / `<ProfileHero>` / `<SlideTabsRow>` 各自抽 packages/ui 还是 inline）
   - 状态机覆盖（mockup 4 状态 ↔ spec FR 对齐）
   - Token 决策记录（复用清单 + 新增 token 说明）
   - 翻译期注意点（5 条 gotcha audit，per § 5.1）
   - Drift 政策（代码 > mockup）
   - 引用
3. **T10**：评估组件归属 — `<TopNav>` / `<SlideTabsRow>` / `<ProfileHero>` 抽 packages/ui 还是 inline（单页 once-only 时多半 inline）
4. **T11**：改写 `apps/native/app/(app)/(tabs)/profile.tsx`，删 PHASE 1 PLACEHOLDER banner + token-based className + photo blur 沉浸式背景
5. **T12**：回填 `plan.md` UI 段（从 4 边界占位 → 完整 UI 结构，含 zone breakdown / 状态视觉转移 / Token 映射）
6. **T13**：视觉真后端冒烟（4 状态截图 → `apps/native/runtime-debug/<date>-my-profile-mockup-translation/`）
7. tasks.md 标 ✅ T_mock / T10 / T11 / T12 / T13（per meta sdd.md § /implement 闭环 6 步）

---

## References

- [`../spec.md`](../spec.md) — FR-001..FR-018 + SC-001..SC-010（业务规则 + 视觉占位 4 边界）
- [`../plan.md`](../plan.md) — UI 段 PHASE 1 占位（待 mockup 落地后 T12 回填）
- [`../tasks.md`](../tasks.md) — T_mock / T10-T13 待 ✅
- [`./inspiration/notes.md`](./inspiration/notes.md) — 4 张参考截图决策记录（顶 nav / slide tabs / hero / 底 tab）
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置（类 1 PHASE 2 入口）](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook
- [login v2 design bundle](../../login/design/source-v2/) — token 定义 baseline
- [onboarding v1 mockup-prompt.md](../../onboarding/design/mockup-prompt.md) — 同流程参考模板
