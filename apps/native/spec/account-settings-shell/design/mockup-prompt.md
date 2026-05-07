# Account-Settings-Shell mockup — Claude Design prompt

> 拿下文 prompt 全文（从 `## Prompt（拷贝）` 段以下）粘到 [claude.ai/design](https://claude.ai/design)，跑出 mockup bundle 后落 `apps/native/spec/account-settings-shell/design/source/`，下次 session 进入翻译期（PHASE 2 PR — T_mock / T12-T15）。
>
> 模板基于 `<meta>/docs/experience/claude-design-handoff.md` § 2.1 + § 2.1b，针对 spec B account-settings-shell 的项目特定约束（per ADR-0017 类 1 流程 + spec.md FR-001..FR-020 + notes.md § 03/§ 04 决策 + plan.md 10 决策）定制。

---

## 设计上下文（仅给 user 看，不放进 Claude Design prompt）

| 项       | 值                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面     | 5 page mockup:`settings/index`(设置主页)/ `account-security/index`(账号与安全)/ `account-security/phone`(手机号 mask)/ `legal/personal-info`(法规占位)/ `legal/third-party`(法规占位) |
| 路由     | `/(app)/settings/*` stack(位于 `(tabs)/` 之外,Expo Router 自动隐藏底 tab bar)                                                                                                         |
| 业务流   | my-profile ⚙️ → settings list → account-security list → phone mask;退出登录 / 法规页 / 注销入口(占位 push)                                                                            |
| 视觉前置 | **复用 my-profile mockup 已 establish 的 token**(login v2 base + my-profile +4 alpha + boxShadow.hero-ring);settings 是清爽 list,**无** photo blur / hero overlay 需求                |
| PHASE 1  | 业务流 + 占位 UI 已 ship(11 task T1~T11);占位 UI 使用全裸 RN(无精确间距 / 颜色 / 阴影 / list card 视觉)                                                                               |
| PHASE 2  | 本 mockup 决定:list card 视觉(分组 / 间距 / 圆角)/ list 行 layout / disabled 项视觉细节(opacity / 文字色)/ chevron 图标 / 法规页占位排版 / 退出登录 Alert 自定义 modal(可选)          |
| 反例参考 | my-profile mockup PHASE 2(同链 spec A,已落地)— `apps/native/spec/my-profile/design/source-v1/`                                                                                        |

---

## Prompt(拷贝粘到 claude.ai/design)

```text
请为「account-settings-shell」(账号设置 shell — 5 个相关页面)设计 mockup,技术栈 = React Native + NativeWind v4 + Tailwind。

# 业务上下文

「不虚此生」app 账号中心的「设置」shell — 用户从「我的」页顶 nav ⚙️ 齿轮进入,5 个相关页面构成完整设置流:

1. **settings/index**:设置主页(从「我的」⚙️ push 进入)
2. **account-security/index**:账号与安全子页(从设置主页 tap "账号与安全 >" 进入)
3. **account-security/phone**:手机号 mask 详情(从账号与安全 tap "手机号" 进入)
4. **legal/personal-info**:《个人信息收集与使用清单》(法规占位,从设置主页 footer 链接进入)
5. **legal/third-party**:《第三方共享清单》(同上)

5 页面均位于 Expo Router Stack 内,顶 nav 由 Stack header 默认提供(返回箭头 `<` + 标题居中);**无底 tab bar**(stack 在 `(tabs)/` 之外,自动隐藏)。

本 mockup 的核心 UI 决策点:
- list card 视觉系统(分组卡片背景 / 圆角 / 内边距 / 阴影)
- list 行 layout(左 label / 中 mask 或描述 / 右 chevron `>`)
- disabled 项视觉细节(opacity 0.5 是 PHASE 1 占位常量,PHASE 2 决具体灰度 / 文字色 / 是否额外加锁 icon)
- footer 法规链接视觉(蓝色 vs brand color)
- chevron 图标选型(Feather chevron-right / Material 等)
- 退出登录"行"在第三卡内的视觉分量(普通 list 行 vs 红色强调 — destructive 暗示)
- Alert 二次确认形式(可选:设计自定义 modal 留 PHASE 2 落地,或接受 RN 系统 Alert 降级 per 决策 5)
- 法规页占位文案排版(标题在 stack header,正文居中 / 上对齐)

# NEGATIVE CONSTRAINTS(硬约束,禁止)

- NO HTML elements(<div> / <span> / <input> / <button>)
- NO inline style={{...}}
- NO CSS variables in style
- NO @keyframes / CSS animation
- NO style attribute outside reanimated 复合 props

# POSITIVE REQUIREMENTS(必须)

- 用 React Native 组件(View / Text / Pressable / ScrollView)
- 视觉走 NativeWind className(bg-* / text-* / p-* / m-* / rounded-* / border-*)
- 任何动画(若需要)用 react-native-reanimated v3 hooks
- Token 命名采用语义化(ink / line / surface / accent / brand 等),非通用 text-* / border-*

# 页面结构(项目特定)

## Page 1 — settings/index(设置主页)

Stack header 标题 = `'设置'`;返回箭头 `<` 在左(返回 `(tabs)/profile`)。

### 内容布局(自上而下,3 cards + footer)

**Card 1**(单行,顶部):
- 账号与安全 > [chevron]

**Card 2**(4 行 disabled):
- 通用 > [chevron] (disabled,opacity 0.5)
- 通知 > [chevron] (disabled)
- 隐私与权限 > [chevron] (disabled)
- 关于 > [chevron] (disabled)

**Card 3**(2 行,无 chevron):
- 切换账号 (disabled,居中?或左对齐?)
- 退出登录 (active,语义 destructive — 红色文字?或 brand 强调?)

**Footer**(无卡片背景,纯居中文字链接):
- 《个人信息收集与使用清单》《第三方共享清单》(并排或两行均可)
- 蓝色文字(链接惯例)或 brand-soft

### 关键视觉决策(本 mockup 输出)

- 卡片间距(card-to-card vertical gap)
- 卡片内行间距(row height + divider 是否可见)
- 列表 cards 的整体页边距
- 退出登录行视觉强调度(普通 vs destructive 红字)

## Page 2 — account-security/index(账号与安全)

Stack header 标题 = `'账号与安全'`;返回箭头 `<` 返回 settings/index。

**注意:无 ID 行 / 无 🎧 客服 icon / 无"账号安全系数"banner / 无 4 盾牌**(per spec B 决策,反枚举 + M1 无客服)。

### 内容布局(3 cards)

**Card 1**(3 行):
- 手机号  +86 138****5678 [chevron]  (active,push phone)
- 实名认证 > [chevron] (disabled)
- 第三方账号绑定 > [chevron] (disabled)

**Card 2**(1 行 disabled):
- 登录设备与授权管理 > [chevron] (disabled)

**Card 3**(2 行):
- 注销账号 > [chevron] (active,push spec C 占位 — 视觉 destructive 暗示?)
- 安全小知识 > [chevron] (disabled)

### 关键视觉决策(本 mockup 输出)

- 手机号 mask 文本在行内的呈现(右对齐 + chevron 在最右,或者 mask 大字符体)
- 注销账号是否用 destructive 色(红字 / warn token)暗示风险
- disabled 项与 active 项的对比度(用户能一眼看出哪些可点)

## Page 3 — account-security/phone(手机号 mask 详情)

Stack header 标题 = `'手机号'`;返回箭头 `<` 返回 account-security/index。

### 内容布局(极简)

页面中央(或上 1/3)单一文本:**`+86 138****5678`**(读 store phone + maskPhone format)。

无操作按钮 / 无修改入口 / 无提示文案(per spec FR-008 + Q4 决议:仅 mask 显示)。

### 关键视觉决策(本 mockup 输出)

- mask 文本字号(2xl? 3xl?)
- 居中 vs 上对齐
- 是否加任何装饰(下划线 / 卡片背景 / icon)— 默认无,可选加最小装饰

## Page 4 — legal/personal-info(《个人信息收集与使用清单》)

Stack header 标题 = `'《个人信息收集与使用清单》'`;返回箭头 `<` 返回 settings/index。

### 内容布局(占位)

页面中央(或上 1/3)单段文本(per spec Q6):

> 本清单内容由法务团队定稿后填入,预计 M3 内测前完成。

### 关键视觉决策(本 mockup 输出)

- 文案排版(居中 / 左对齐 + 缩进)
- 文字色(ink / ink-muted)
- 是否加图标装饰(如 📄 / 🔒 等,默认无)

## Page 5 — legal/third-party(《第三方共享清单》)

同 Page 4 模板,标题改为 `'《第三方共享清单》'`,正文相同(per spec FR-011)。

# 状态变体 illustrate

请用 SettingsShellPreview.tsx 横排 illustrate 以下状态:

| 状态 | 描述 |
|---|---|
| `settings-default` | settings/index 默认态(3 cards + footer) |
| `account-security-default` | account-security/index 默认(phone mask 显示在第一卡 first row 右侧) |
| `phone-detail` | phone screen mask 居中 |
| `legal-personal-info` | 法规页占位文案 |
| `logout-alert`(可选) | settings/index 上叠加退出登录 Alert 弹窗(自定义 modal 设计)— **如本 mockup 接受 RN 系统 Alert 降级,跳过此状态** |

# DO NOT INCLUDE(项目特定负向,per spec.md FR / SC + notes.md 决策)

- ❌ **不重画 my-profile / 不动 `(tabs)/profile.tsx` 的 ⚙️ 齿轮**(独立 spec A 范围,已 ship);**如本 mockup 涉及 ⚙️ 引用(如某种返回 my-profile 的视觉提示),必须使用 Feather Icons "settings" 标准齿轮 SVG path**(per `e2b933d` 修复 commit:之前 my-profile mockup 误用太阳光芒图案被纠错)— 不是太阳光芒 / 不是放射状光芒 / 不是花朵图案
- ❌ ID 行 / 数字 ID 展示(SC-005 反枚举不变性,禁 accountId 暴露在 render)
- ❌ 🎧 客服 icon(M1 无客服系统,per notes.md § 04 删)
- ❌ "账号安全系数良好" banner / 4 盾牌图(评估系统不存在,假装显示是误导)
- ❌ "找回账号" 行(M1.2 SMS auth 已替代,per PRD § 3.2)
- ❌ "密码" 行(M1.2 PRD password 已废,per PRD § 3.2)
- ❌ "找回密码" 链接 / "修改密码" 入口
- ❌ "修改手机号" 按钮 / 入口(server endpoint 实现状态未知,本 spec 不预占位 surface)
- ❌ disabled 项的 "敬请期待" / "Coming soon" toast 或浮层(per spec FR-006:仅 a11y disabled,无视觉 hint)
- ❌ disabled 项加 lock 🔒 icon(可选 — mockup 决定,默认无;视觉对比 + opacity 已足够)
- ❌ 注销账号 UI(SMS + 6 位码 + 双确认)— spec C 范围;本 mockup 仅画"注销账号" list 行,目标 page 在 spec C
- ❌ 解封 UI(FROZEN 用户登录拦截弹窗)— spec C 范围,**与本 5 页面无视觉关系**
- ❌ 切换账号 list 项不需要画 active 多账号入口 — 本 spec 仅 disabled 占位
- ❌ 通用 / 通知 / 隐私权限 / 关于 等 disabled 项的子页设计(各起子 spec,本 mockup 仅画 list 行 disabled)
- ❌ 法规页的实际法务内容(法务定稿前严禁,per spec Q6)
- ❌ 任何账号 / 个人 / 设备指纹的真实数据(全部用 placeholder)
- ❌ 埋点视觉指示 / Telemetry overlay(per CL-004 不引埋点)

# 视觉语言(mirror my-profile mockup PHASE 2,期望最少新 token)

请复用 my-profile mockup PHASE 2 已 establish 的 design tokens(login v2 base + my-profile 4 alpha + boxShadow.hero-ring):

- Brand:`brand-{50..900}` + `brand-soft`
- Accent:`accent`(DEFAULT + soft)
- Text:`ink`(DEFAULT + muted + subtle)
- Border:`line`(DEFAULT + strong + soft)
- Surface:`surface`(DEFAULT + alt + sunken)
- Feedback:`ok / warn / err`(each + soft)— **destructive 退出登录 / 注销账号 用 `err` 或 `warn`**
- Spacing:`xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)`
- Radius:`xs(4) / sm(8) / md(12) / lg(16) / full`
- FontFamily:`sans (Inter + Noto Sans SC + PingFang)`
- BoxShadow:`card / cta`

预期可能需要新增的 token(如不需要则说明为何复用已有 token 满足):
- `list-divider`:list 行间分隔线(可能直接复用 `line-soft`)
- `link-text`:法规 footer 链接蓝色(可能复用 `accent` 或新加)
- `card-bg`:list card 背景(可能复用 `surface`)

如有其他新 token,请在 SettingsShellPreview.tsx 顶部注释列出 + 解释为何不能复用。

**禁止新增** photo blur / hero overlay 类视觉(本 spec 无 hero / 无沉浸式背景,无需对应 token);my-profile mockup 引入的 `hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` 在本 mockup **不消费**。

# DELIVERABLES(输出单 bundle)

- `SettingsScreen.tsx`(settings/index 主组件)
- `AccountSecurityScreen.tsx`(account-security/index 组件)
- `PhoneScreen.tsx`(account-security/phone mask 组件)
- `LegalScreen.tsx`(legal/personal-info / legal/third-party 共享模板,通过 props 切换标题)
- `SettingsShellPreview.tsx` 4-5 状态横排预览(settings-default / account-security-default / phone-detail / legal-personal-info / [optional] logout-alert)
- `IOSFrame.tsx` iOS 设备外框(仅展示用,沿用 my-profile 同款)
- `tailwind.config.js` 含全部 token 定义(复用 my-profile PHASE 2 base + 新增 token 高亮标注)
- `assets/`(如需新 placeholder 图,默认无 — 本 mockup 全部纯 list / 文本)
- `CLAUDE-DESIGN-BUNDLE-README.md`(Claude Design 自带)

请生成 mockup。
```

---

## 拿到 bundle 后(下次 session 翻译期 — PHASE 2 PR)

1. 解压到 `apps/native/spec/account-settings-shell/design/source/`(遵循 my-profile 同款结构)
2. 写 `apps/native/spec/account-settings-shell/design/handoff.md`(7 段,per `<meta>/docs/experience/claude-design-handoff.md` § 5):
   - Bundle 内容速览
   - 组件 breakdown(`<SettingsListCard>` / `<ListRow>` / `<LegalScreen>` 各自抽 packages/ui 还是 inline — 跨 5 page 复用度评估;参考 my-profile 0 抽 packages/ui 先例)
   - 状态机覆盖(mockup 5 状态 ↔ spec FR 对齐)
   - Token 决策记录(复用清单 + 新增 token 说明)
   - 翻译期注意点(5 条 gotcha audit,per § 5.1)
   - Drift 政策(代码 > mockup)
   - 引用
3. **T_mock**:bundle 落盘 + handoff.md 完成 ✅
4. **T12**:评估组件归属 — list card / list row / chevron 等是否抽 packages/ui(单 5 page 内复用度高,可能值得抽 `<ListCard>` + `<ListRow>` 通用组件;但参考 my-profile 0 抽 packages/ui 先例,默认 inline)
5. **T13**:改写 5 个 page — 删 PHASE 1 PLACEHOLDER banner + token-based className + Stack header 是否迁移自定义 header 组件(per plan 决策 3 alternative)
6. **T14**:回填 plan.md UI 段(从 4 边界占位 → 完整 UI 结构,含 5 page zone breakdown / 状态视觉转移 / Token 映射)
7. **T15**:视觉真后端冒烟(5 状态截图 → `apps/native/runtime-debug/<date>-account-settings-shell-mockup-translation/`)
8. tasks.md 标 ✅ T_mock / T12 / T13 / T14 / T15(per meta sdd.md § /implement 闭环 6 步)

---

## References

- [`../spec.md`](../spec.md) — FR-001..FR-020 + SC-001..SC-012(业务规则 + 视觉占位 4 边界 + 反枚举不变性)
- [`../plan.md`](../plan.md) — 10 决策 + UI 段 PHASE 1 占位(待 mockup 落地后 T14 回填)
- [`../tasks.md`](../tasks.md) — T_mock / T12-T15 待 ✅
- [`../my-profile/design/inspiration/notes.md`](../../my-profile/design/inspiration/notes.md) § 03-settings + § 04-account-security — 网易云参考截图保留 / 删除清单(本 spec B IA 来源)
- [`../my-profile/design/inspiration/03-settings.png`](../../my-profile/design/inspiration/03-settings.png) — 设置页 IA 主参照
- [`../my-profile/design/inspiration/04-account-security.png`](../../my-profile/design/inspiration/04-account-security.png) — 账号与安全 IA 主参照
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置(类 1 PHASE 2 入口)](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook
- [my-profile mockup-prompt.md](../../my-profile/design/mockup-prompt.md) — 同 SDD 链 spec A 的 mockup-prompt 模板,本 prompt 沿用其 token / 结构惯例
- [my-profile mockup PHASE 2 source](../../my-profile/design/source-v1/) — token 定义 baseline

---

## 修复 commit 引用(齿轮 icon 防覆盖)

`e2b933d` `fix(account): replace sun-ray icon with proper gear SVG in TopNav settings`

之前 my-profile mockup PHASE 2 翻译期 Claude Code 误用太阳光芒图案作为 ⚙️ settings icon,用户后续手动修复为 Feather Icons standard "settings" gear path。**本 mockup prompt 显式声明** 不重画 / 不动 my-profile ⚙️;若涉及 ⚙️ 引用必用标准齿轮 — 避免 PHASE 2 翻译期同样错误重演。
