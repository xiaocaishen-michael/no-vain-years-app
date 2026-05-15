# Onboarding mockup — Claude Design prompt

> 拿下文 prompt 全文（从 `## Prompt（拷贝）` 段以下）粘到 [claude.ai/design](https://claude.ai/design)，跑出 mockup bundle 后落 `apps/native/specs/auth/onboarding/design/source/`，下次 session 进入翻译期。
>
> 模板基于 `<meta>/docs/experience/claude-design-handoff.md` § 2.1 + § 2.1b，针对 onboarding 的项目特定约束（per ADR-0016 + ADR-0017 + spec.md FR-001..FR-012）定制。

---

## 设计上下文（仅给 user 看，不放进 Claude Design prompt）

| 项       | 值                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 页面     | onboarding gate（phoneSmsAuth auto-create 后的"完善昵称"卡点）                                                                |
| 路由     | `/(app)/onboarding`（已落地，PHASE 1 占位 UI）                                                                                |
| 业务流   | 单 form / 单字段（displayName）/ 不可跳过（per FR-011）                                                                       |
| 视觉前置 | 复用 login v2 design-tokens（期望 0 token 改动）                                                                              |
| 状态机   | 4 态（idle / submitting / success / error）                                                                                   |
| 校验     | [1,32] Unicode codepoints, trim, 禁控制字符 / 零宽 / 行分隔（per FR-005）                                                     |
| 反例参考 | login v2 mockup（同模式：单 form + 4 状态 + className 1:1 paste）—— `apps/native/specs/auth/phone-sms-auth/design/source-v2/` |

---

## Prompt（拷贝粘到 claude.ai/design）

```text
请为「onboarding gate page」设计 mockup，技术栈 = React Native + NativeWind v4 + Tailwind。

# 业务上下文

「不虚此生」app 用 unified phone-SMS auth（per ADR-0016：login / register 合一页），用户首次登录后服务器自动 create account 但 displayName=null。AuthGate 检测到 displayName==null → 强制跳到 onboarding 页，让用户填昵称才能进首页。**不可跳过**——这是产品决策（防止匿名空账号污染数据）。

页面结构 = 单 form / 单字段 / 单 CTA。比 login 页更简单（login 有手机号 + 验证码 + 6 状态 + 三方 OAuth；onboarding 只有昵称 + 提交 + 4 状态）。

# NEGATIVE CONSTRAINTS（硬约束，禁止）

- NO HTML elements（<div> / <span> / <input> / <button>）
- NO inline style={{...}}
- NO CSS variables in style
- NO @keyframes / CSS animation
- NO style attribute outside reanimated 复合 props

# POSITIVE REQUIREMENTS（必须）

- 用 React Native 组件（View / Text / Pressable / TextInput）
- 视觉走 NativeWind className（bg-* / text-* / p-* / m-* / rounded-* / border-*）
- 动画用 react-native-reanimated v3 hooks（useSharedValue / useAnimatedStyle / withTiming / withRepeat / withSequence / Easing）
- Token 命名采用语义化（ink / line / surface / ok / warn / err / accent / brand），非通用 text-* / border-*

# 页面结构（项目特定）

整页布局自上而下：

1. **顶部**：仅标题 "完善个人资料"（**无** close × 按钮 / **无** skip 链接 / **无** "稍后再设置" / **无** 返回箭头——per FR-011 不可跳过）
2. **副标题区域**：一句友好引导文案（如 "起一个昵称，随时可在设置里修改"），鼓励用户填入而不是给出退路
3. **主输入区**：
   - 单 `<TextInput>` displayName 字段
   - 占位提示 "1 至 32 字符，支持中文 / 字母 / 数字 / emoji"
   - 视觉态：default / focused / errored
4. **错误位**：input 下方留 ErrorRow 区域（idle 态隐藏，error 态显示文案 + 红色色调）
5. **提交 CTA**：单 `<Pressable>` "提交"，撑满宽度，brand 主色
   - 视觉态：disabled（form invalid 或 submitting）/ enabled / loading（含 Spinner）/ success（含 SuccessCheck）

# 状态机 4 状态 illustrate（与 spec 对齐）

| 状态 | 视觉描述 | 触发 |
|---|---|---|
| `idle` | 默认。input 空 + CTA disabled（半透明 / bg-brand-soft） | 进入页面 |
| `submitting` | input 锁定（不可编辑）+ CTA 转 loading（含 Spinner + 文案 "提交中..."） | 用户点 CTA |
| `success` | full-screen success overlay（绿色对勾 SuccessCheck + 短暂淡入文案 "完成！"，~600ms 后由 AuthGate redirect 到 (app)/） | API 200 |
| `error` | input 标红（border-err）+ ErrorRow 显示文案 + CTA 恢复 enabled 态 | API 抛错（400 INVALID_DISPLAY_NAME / 429 / 网络错） |

请用 OnboardingScreenPreview.tsx 横排 illustrate 这 4 个状态。

# DO NOT INCLUDE（项目特定负向，per spec.md CL-001..CL-004 + FR-011 + FR-012）

- ❌ 任何 close × 按钮 / "稍后再设置" 链接 / "skip" 入口（FR-011 不可跳过）
- ❌ avatar 上传 / 头像组件（M2+ 评估，per server CL-003）
- ❌ 性别 / 生日 / 简介 / 多字段 form（spec 仅 displayName 一个字段）
- ❌ "请输入昵称"等命令式催促文案（用引导式：起个昵称 / 给自己取个名字）
- ❌ "昵称不可重复"提示（per server CL-002 不强制全局唯一）
- ❌ 装饰性 illustration / mascot 动画（保持 onboarding 简洁，不喧宾夺主——可保留 LogoMark 在某处出现一次）
- ❌ 复杂渐进式动画（仅 success state 的对勾 scale-in 是必须；其他动画不要加）

# 视觉语言（mirror login v2，期望 0 token 改动）

请直接复用 login v2 的 design tokens（Brand / Accent / Ink / Line / Surface / Feedback / Spacing / Radius / Font / Shadow），名称完全一致：

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

如本设计需引入新 token，请在 OnboardingScreen.tsx 顶部注释列出 + 解释为何不能复用。

# DELIVERABLES（输出单 bundle）

- `OnboardingScreen.tsx` 主组件，含 4 状态 + 子组件（Spinner / SuccessCheck / DisplayNameInput / PrimaryButton / ErrorRow）inline 或 import 自 source 内
- `OnboardingScreenPreview.tsx` 4 状态横排预览（idle / submitting / success / error）
- `IOSFrame.tsx` iOS 设备外框（仅展示用，不进 implementation）
- `tailwind.config.js` 含全部 token 定义（**期望 byte-identical 于 login v2**——如不同请 diff 列出 + 解释）
- `assets/`（如需新 illustration / icon——若仅复用 LogoMark 则不需新增）
- `CLAUDE-DESIGN-BUNDLE-README.md`（Claude Design 自带）

# 参考实例

login v2 mockup 是同模式 baseline（合一页 + className 1:1 paste 工作流）：
- 视觉风格、字号、间距、按钮形态、动画节奏可直接复用
- 与 login v2 不同点：onboarding 单字段 + 无 OAuth 区域 + 无倒计时 + 无 phone/sms 切换。结构应**比 login v2 简单**

请生成 mockup。
```

---

## 拿到 bundle 后（下次 session 翻译期）

1. 解压到 `apps/native/specs/auth/onboarding/design/source/`（v1 第一轮，命名沿用 login `source-v2/` 模式可后期 v2 加）
2. 写 `apps/native/specs/auth/onboarding/design/handoff.md`（7 段 per `<meta>/docs/experience/claude-design-handoff.md` § 5）：
   - Bundle 内容速览
   - 组件 breakdown（哪些抽 packages/ui / 哪些 inline）—— 用户已决策"等 mockup 落地再判"，本步真正决定
   - 状态机覆盖（mockup ↔ spec 4 状态对齐）
   - Token 决策记录（期望与 login v2 byte-identical）
   - 翻译期注意点（每页 5 条 gotcha audit，per § 5.1）
   - Drift 政策（代码 > mockup）
   - 引用（ADR-0014 / -0015 / -0017 + spec / plan / tasks）
3. T8 执行：评估 packages/ui 抽取（DisplayNameInput / OnboardingScreen 是否值得抽——单页 once-only 时多半 inline）
4. T9 执行：改写 `apps/native/app/(app)/onboarding.tsx`，删 PHASE 1 PLACEHOLDER banner + className 按 mockup 1:1 paste
5. T10 执行：回填 `plan.md` UI 段，从 4 边界占位 → 完整 UI 结构（含布局 / 区域分块 / 状态视觉转移 / Token 映射）
6. visual 真后端冒烟二轮（同 login PR #51 节奏：4 状态截图 → `apps/native/runtime-debug/<date>-onboarding-mockup-translation/`）
7. tasks.md 标 ✅ T_mock / T8 / T9 / T10（per `<meta>/docs/conventions/sdd.md` § /implement 闭环 6 步——同 PR 同步）

## References

- [`../spec.md`](../spec.md) — Functional Requirements（FR-005 校验 / FR-006 占位 4 边界 / FR-011 不可跳过 / FR-012 packages/ui 抽取延后）
- [`../plan.md`](../plan.md) — UI 段 PHASE 1 占位（待本流程产出 mockup 后回填）
- [`../tasks.md`](../tasks.md) — T_mock / T8-T10 待 ✅
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0016 — Unified mobile-first phone-SMS auth](../../../../../docs/adr/0016-unified-mobile-first-auth.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置（本页正是类 1 流程的 mockup PHASE 2 入口）](../../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook（§ 2.1 / § 2.1b prompt 模板 + § 5 handoff.md 模板）
- [login v2 design bundle](../../login/design/source-v2/) — 同模式 baseline（视觉风格 / token 定义参考）
- [login v2 handoff.md](../../login/design/handoff.md) — 同模式翻译期注意点 + drift policy 实例
