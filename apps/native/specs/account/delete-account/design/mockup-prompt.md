# Delete-Account & Cancel-Deletion UI mockup — Claude Design prompt

> 拿下文 prompt 全文(从 `## Prompt(拷贝)` 段以下,即 ` ```text ... ``` ` 块内)粘到 [claude.ai/design](https://claude.ai/design),跑出 mockup bundle 后落 `apps/native/specs/account/delete-account/design/source/`,下次 session 进入翻译期(PHASE 3 PR — T_mock / T13 / T14 / T15 / T16)。
>
> 模板基于 `<meta>/docs/experience/claude-design-handoff.md` § 2.1 + § 2.1b,针对 spec C 的项目特定约束(per ADR-0017 类 1 PHASE 2 + spec.md FR-001..FR-022 + plan.md 决策 1-5 + plan.md UI 段占位结构)定制。

---

## 设计上下文(仅 user 看,不放进 Claude Design prompt)

| 项       | 值                                                                                                                                                                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面     | 3 视觉单元:`delete-account`(注销账号 page) / `cancel-deletion`(撤销注销 page) / `login + freeze modal`(已 ship 的 login.tsx 末端追加 modal,**不重画 login form**)                                                                                                                                                                 |
| 路由     | `delete-account` 在 `(app)/settings/account-security/` 内(spec B shell 已 ship);`cancel-deletion` 在 `(auth)/`(deep-link 入口)                                                                                                                                                                                                    |
| 业务流   | login → 输入 phone+code → server 返 ACCOUNT_IN_FREEZE_PERIOD → freeze modal 弹起 → tap [撤销] → cancel-deletion(phone 预填)→ 输码 → home;另一路径:account-security → 注销账号 → 双勾 → 输码 → 退 login                                                                                                                            |
| 视觉前置 | **复用 login v2 + my-profile + account-settings-shell 已 establish 的 token**(login v2 base + 4 alpha + boxShadow.card / cta);spec C 仅可能加 destructive 强调度调优                                                                                                                                                              |
| PHASE 1  | 业务流 + 占位 UI 已 ship(T0-T10 + T12,PR #78);占位 UI 全裸 RN(无精确间距 / 颜色 / 阴影 / 按钮强调度)                                                                                                                                                                                                                              |
| PHASE 2  | 本 mockup 决定:警示文案视觉(字号 / 行距 / 颜色 / 是否 destructive 红 tone)/ 双 checkbox 视觉(☐/☑ char vs 真 checkbox 组件)/ 发码按钮 3 态(active/disabled/cooldown)/ code input 6 位输入(单 input vs OTP-style 6 格)/ 提交按钮 destructive 强调度 / freeze modal overlay+card+button 顺序 / 错误展示位 ErrorRow tone(warn vs err) |
| 反例参考 | account-settings-shell mockup PHASE 2(同链 spec B,已落地)— `apps/native/specs/account/settings-shell/design/source/`;login v2(`apps/native/specs/auth/login/design/source-v2/`)PHASE 2 已 establish 的 form 视觉系统                                                                                                              |

---

## Prompt(拷贝粘到 claude.ai/design)

```text
请为「delete-account-cancel-deletion-ui」(注销账号 + 撤销注销 UI — 3 个视觉单元)设计 mockup,技术栈 = React Native + NativeWind v4 + Tailwind。

# 业务上下文

「不虚此生」app 账号中心的「注销 / 撤销注销」流程 — 高风险不可逆操作的视觉系统,3 个视觉单元构成完整流:

1. **delete-account**:注销账号 page(从「账号与安全」list tap "注销账号 >" 进入,authenticated 路径)
   - 警示双段文案("15 天冻结期可撤销" / "期满匿名化不可逆")+ 2 个 checkbox 双确认 + 6 位 SMS code 输入 + 提交按钮(destructive)+ 错误展示位
   - 提交成功后 server 端账号 ACTIVE → FROZEN,session 已废,本地 clearSession 后跳 (auth)/login
2. **cancel-deletion**:撤销注销 page(deep-link 路径,在 (auth)/ 路由组下,不需 access token)
   - 入口 1:freeze modal tap [撤销] → push '/(auth)/cancel-deletion?phone=<phone>' → 自动 setParams undefined 清 URL
   - 入口 2:用户从其他渠道 deep-link 进入(无 phone 预填)
   - 内容:phone 输入(预填态 read-only + maskPhone / 编辑态可输)+ 6 位 SMS code 输入 + "撤销注销" 提交按钮 + 错误展示位
   - 提交成功后 server 返 LoginResponse,前端 setSession + loadProfile,跳 (app)/(tabs) 主页
3. **freeze modal**(嵌入既有 login.tsx 末端,**不重画 login form**)
   - 触发条件:server 返 403 + ACCOUNT_IN_FREEZE_PERIOD 错误码,login form catch 弹起 modal
   - 内容:overlay scrim + 中央 card(描述文字 "账号处于注销冻结期,可撤销注销恢复账号" + 双 button [撤销] [保持])
   - tap [撤销] → modal 关 + push cancel-deletion(phone 预填)
   - tap [保持] / Android back / scrim tap → modal 关 + 清 login form

3 个视觉单元的核心 UI 决策点:
- 注销账号 page 警示文案的视觉强调度(字号 / 行距 / 颜色 / 是否 destructive 红 tone / 是否加 ⚠ icon)
- 双 checkbox 视觉(占位用了 ☐/☑ 字符,可替换为真 checkbox 组件 / Pressable 包 icon;label 字号 / 颜色)
- 发送验证码按钮 3 态视觉(active brand 强调 / disabled 灰 / cooldown "60s 后可重发" 文案布局)
- 6 位 SMS code 输入视觉(沿用 login v2 既有的 SmsInput 组件 vs 重新设计 OTP-style 6 格输入)
- 提交按钮 destructive 强调度(注销账号 = err token 红?cancel-deletion 撤销注销 = brand 主色?— 强调度对比体现"危险操作 vs 恢复操作")
- 错误展示位 ErrorRow tone(warn 黄 vs err 红 / 是否加 icon / 行内 vs 卡片 / 显示位置)
- freeze modal overlay 视觉(透明度 / 颜色 / blur 是否)+ card 视觉(圆角 / 阴影 / 内边距 / 最大宽度)+ button 顺序与视觉强度([撤销] = brand primary 强调 / [保持] = ink-muted secondary)

# NEGATIVE CONSTRAINTS(硬约束,禁止)

- NO HTML elements(<div> / <span> / <input> / <button>)
- NO inline style={{...}}
- NO CSS variables in style
- NO @keyframes / CSS animation
- NO style attribute outside reanimated 复合 props

# POSITIVE REQUIREMENTS(必须)

- 用 React Native 组件(View / Text / Pressable / TextInput / Modal / ScrollView)
- 视觉走 NativeWind className(bg-* / text-* / p-* / m-* / rounded-* / border-*)
- 任何动画(若需要)用 react-native-reanimated v3 hooks
- Token 命名采用语义化(ink / line / surface / accent / brand / ok / warn / err 等),非通用 text-* / border-*

# 页面结构(项目特定)

## Page 1 — delete-account(注销账号)

Stack header 标题 = `'注销账号'`;返回箭头 `<` 在左(返回 account-security/index)— Stack header 由 Expo Router 默认提供,本 mockup **不画 header**(my-profile / account-settings-shell PHASE 2 同款,header 已由 _layout.tsx 注册)。

### 内容布局(自上而下,单 column,vertical scroll)

**警示段**(顶部,占据视觉最强位置):
- 段 1:`'注销后账号进入 15 天冻结期，期间可登录撤销恢复'`
- 段 2:`'冻结期满后账号数据将永久匿名化，不可恢复'`

**双 checkbox 段**(警示段下,行高紧凑):
- ☐ 我已知晓 15 天冻结期可撤销
- ☐ 我已知晓期满后数据匿名化不可逆

**发码按钮**(checkbox 下;disabled until 双勾):
- 默认态:"发送验证码"
- cooldown 态:"60s 后可重发"(s 数倒计时)
- in-flight 态:可加 spinner(可选)

**SMS code 输入**(发码按钮下,disabled until 发码成功):
- 6 位数字 input(沿用 login v2 SmsInput 组件视觉?或自定义 6 格 OTP-style?— 决策点)

**提交按钮**(底部,disabled until 输码 6 位 + 未在 submitting):
- 默认态:"确认注销"
- in-flight 态:"submitting..."(占位文案,可换为更友好的 "正在注销..." 或 spinner;mockup 决定)
- **视觉强调度**:destructive 暗示(err 红?warn 黄?或就是 brand primary 但用 outline 而非 filled?— mockup 决策)

**错误展示位**(提交按钮下方,errorMsg !== null 时渲染):
- 单行 Text(默认占位 — 已用 ErrorRow 组件;mockup 可建议沿用 login v2 ErrorRow 或自定义 inline 红字)

### 关键视觉决策(本 mockup 输出)

- 警示段是否 destructive 化(红 / 橙 tone vs 普通 ink)
- checkbox 选择控件视觉(☐ char 占位 vs Feather square / square-check icon vs 真 checkbox 组件)
- 提交按钮强调度("确认注销" 是 destructive 红 button 还是 brand 主色 outline?)
- 6 位 code 输入是否复用 login v2 SmsInput

## Page 2 — cancel-deletion(撤销注销)

Stack header 标题 = `'撤销注销'`;返回箭头 `<` 由 Stack header 默认提供。

### 内容布局(自上而下,单 column)

**描述文案**(顶部):
- `'请通过手机号验证码撤销注销，恢复账号'`(普通 ink-muted,不需要 destructive)

**phone input**(描述下):
- 状态 A — 预填(从 freeze modal [撤销] push 进入,query param 含 phone):read-only + maskPhone 显示 `+86 138****5678`
- 状态 B — 编辑态(deep-link 直接进入,无 phone param):editable + placeholder `'请输入手机号（如 +86138...）'`
- mockup 决策:read-only 时是否在视觉上明显区分(如 sunken / disabled tone)

**发码按钮**(phone 下):同 delete-account 模式

**SMS code 输入**(发码按钮下):同 delete-account 模式

**提交按钮**(底部):
- 默认态:"撤销注销"
- in-flight 态:"submitting..."(同上)
- **视觉强调度**:**与 delete-account 提交按钮形成对比** — 撤销 = 恢复账号 = brand 主色 strong;注销 = destructive
- 这种对比让用户在两个 page 视觉上一眼分辨"危险 vs 恢复"

**错误展示位**(提交按钮下方):
- 反枚举不变性(per spec FR-020):**所有 4xx 错误都必须显示同一文案** `'凭证或验证码无效'`(不分 phone 未注册 / 已匿名化 / SMS 错码)
- mockup **不画**多文案变体;只画一个 ErrorRow 占位即可

### 关键视觉决策(本 mockup 输出)

- 预填 phone 的 read-only 视觉(锁定感 vs 普通)
- "撤销注销" 提交按钮与 delete-account "确认注销" 按钮的视觉对比(同源 token 不同强调)

## Page 3 — login + freeze modal(modal 嵌入既有 login)

**只画 modal,不重画 login form。** login.tsx 已是 PHASE 2(login v2 mockup 已 ship in 既有源 `specs/auth/login/design/source-v2/`)。本 mockup 仅设计 modal overlay 部分。

### Modal 触发与结构

- 触发:用户在 login form 提交,server 返 403 + ACCOUNT_IN_FREEZE_PERIOD → useLoginForm 拦截 → setShowFrozenModal(true)
- visible:full-screen overlay(transparent backdrop)+ 中央 card

### Modal 内容(中央 card)

**描述文字**:
- `'账号处于注销冻结期，可撤销注销恢复账号'`(简化文案,无天数,per spec.md Q3 决议)

**双 button(右下对齐 or 居中并排)**:
- [保持] — secondary 视觉(ink-muted text,无 fill);tap → modal 关 + 清 login form
- [撤销] — primary 视觉(brand text 或 brand-soft fill);tap → modal 关 + push cancel-deletion(phone 预填)
- 顺序:左 [保持] / 右 [撤销](primary 在右 — 沿用 iOS / Material 惯例)

### Android back / scrim tap

- onRequestClose 等价 [保持](per plan 决策 5 — 关 modal 不push,form 清)
- mockup 在 SettingsShellPreview / FreezeModalPreview 状态下展示 modal-active 一态即可

### 关键视觉决策(本 mockup 输出)

- overlay scrim 颜色 / 透明度(black/50?black/40?加 blur?)
- card 圆角 / 阴影 / 最大宽度 / 内边距
- 双 button 视觉强度对比(text-only 双链接式 vs 一 fill 一 outline vs 一 brand fill 一 ghost)
- 整体 modal 风格(轻量 dialog vs iOS Action Sheet vs Material elevated card)

# 状态变体 illustrate

请用 DeleteCancelPreview.tsx 横排 illustrate 以下状态:

| 状态 | 描述 |
|---|---|
| `delete-account-idle` | delete-account page 默认态:checkbox 全空 / 发码 disabled / code input disabled / 提交 disabled |
| `delete-account-checked-cooldown` | 双勾 + 发码已点(showing "45s 后可重发" cooldown)/ code input 启用(空)/ 提交 disabled |
| `delete-account-error` | 输 6 位 code 后提交失败:ErrorRow 显示 `'验证码错误'` / 提交按钮回到 active |
| `cancel-deletion-prefilled-cooldown` | 预填 phone 进来:phone read-only + mask / 已发码 / cooldown 显示 / code input 启用 |
| `cancel-deletion-deeplink-empty` | deep-link 入口:phone editable empty / 发码 disabled |
| `freeze-modal-active` | login form(可用低饱和占位即可)+ overlay + freeze modal card visible |

# DO NOT INCLUDE(项目特定负向,per spec.md FR / SC + plan.md 决策)

- ❌ **不重画既有 login.tsx form**(login v2 已 ship in `specs/auth/login/design/source-v2/`)— 本 mockup 仅画 freeze modal overlay 嵌入态;在 freeze-modal-active 状态下用占位 box 代表 login form 即可
- ❌ **不重画 account-security/index list / settings/index list**(spec B account-settings-shell 已 ship);本 mockup **不画 entry 入口行**,从 account-security tap "注销账号 >" 跳转动作不需可视化
- ❌ **不画底 tab bar**(注销 page 在 stack 内,Expo Router 自动隐藏底 tab;cancel-deletion 在 (auth)/ 也无 tab)
- ❌ ID 行 / 数字 ID 展示(SC-008 反枚举,禁 accountId 暴露)
- ❌ 多文案错误变体(per FR-020 反枚举:cancel-deletion 所有 4xx 必须显示同一文案 `'凭证或验证码无效'`,**严禁** "phone 未注册" / "账号已匿名化" / "已注销" 等差异文案)
- ❌ 注销原因调研 / 反馈 textarea(M1 不做,per spec 范围)
- ❌ 客服联系入口 / 找回入口(M1 无客服系统)
- ❌ 倒计时 modal(冻结期剩余天数显示)— per Q3 决议,modal 文案不含天数
- ❌ 多步骤注销向导(step 1 / 2 / 3 progress bar)— 单页 form 即可
- ❌ 注销成功 toast / 撤销成功 toast — 反枚举一致响应,UI 不弹特殊提示;直接 router.replace 跳转
- ❌ 二次密码确认 / 二次 SMS 二因子(M1.3 phone-sms-auth 无密码,per PRD)
- ❌ 数据导出按钮 / 数据备份链接(M1 不做)
- ❌ 隐藏 / 静音账号等"软关闭"选项(M1 仅注销;静音 = 后续 spec)
- ❌ "继续登录" 第三 button 在 freeze modal(per Q3:仅 [撤销] / [保持] 双 button)
- ❌ 任何账号 / 个人 / 设备指纹真实数据(全部用 placeholder)
- ❌ 埋点视觉指示 / Telemetry overlay(per CL-005:console.warn 仅诊断,不引埋点 SDK)
- ❌ 主题切换 / dark mode 变体(M1 仅 light;dark 后续 spec)

# 视觉语言(mirror account-settings-shell + my-profile + login v2,期望最少新 token)

请复用 account-settings-shell mockup PHASE 2 已 establish 的 design tokens(login v2 base + my-profile 4 alpha + boxShadow.card/cta;hero-overlay / white-soft / white-strong / hero-ring 在本 spec **不消费**):

- Brand:`brand-{50..900}` + `brand-soft`
- Accent:`accent`(DEFAULT + soft)
- Text:`ink`(DEFAULT + muted + subtle)
- Border:`line`(DEFAULT + strong + soft)
- Surface:`surface`(DEFAULT + alt + sunken)
- Feedback:`ok / warn / err`(each + soft)— **destructive 注销账号 提交按钮 / 警示文案 强调** 用 `err` 或 `warn` 系
- Spacing:`xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)`
- Radius:`xs(4) / sm(8) / md(12) / lg(16) / full`
- FontFamily:`sans (Inter + Noto Sans SC + PingFang)`
- BoxShadow:`card / cta`

预期可能需要新增的 token(如不需要则说明为何复用已有 token 满足):
- `modal-overlay`:freeze modal scrim 颜色(可能直接用 `rgba(0,0,0,0.4)` 内联 / 或新加语义 token)
- `destructive-bg-soft`:注销按钮 hover/pressed 软背景(可能复用 `err-soft`)
- `code-input-cell`:6 格 OTP-style 输入单元格背景(若决定 OTP-style 而非沿用 login v2 SmsInput)

如有其他新 token,请在 DeleteCancelPreview.tsx 顶部注释列出 + 解释为何不能复用。

**禁止新增** photo blur / hero overlay 类视觉(本 spec 无 hero 沉浸式背景,无需对应 token);my-profile mockup 引入的 `hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` 在本 mockup **不消费**。

# DELIVERABLES(输出单 bundle)

- `DeleteAccountScreen.tsx`(注销账号 page)
- `CancelDeletionScreen.tsx`(撤销注销 page,prefilled + deep-link 两态用 props 切换)
- `FreezeModal.tsx`(嵌入 login 末的 modal 组件;login form 用低饱和 mock placeholder 代表)
- `DeleteCancelPreview.tsx` 6 状态横排预览(per "状态变体 illustrate" 表)
- `IOSFrame.tsx` iOS 设备外框(仅展示用,沿用 my-profile / account-settings-shell 同款)
- `tailwind.config.js` 含全部 token 定义(复用 account-settings-shell 同款 base + 新增 token 高亮标注)
- `assets/`(默认无 — 本 mockup 全部纯 form / 文本 / modal)
- `CLAUDE-DESIGN-BUNDLE-README.md`(Claude Design 自带)

请生成 mockup。
```

---

## 拿到 bundle 后(下次 session 翻译期 — PHASE 3 PR)

1. 解压到 `apps/native/specs/account/delete-account/design/source/`(遵循 my-profile / account-settings-shell 同款结构)
2. 写 `apps/native/specs/account/delete-account/design/handoff.md`(7 段,per `<meta>/docs/experience/claude-design-handoff.md` § 5):
   - Bundle 内容速览
   - 组件 breakdown(`<WarnBanner>` / `<DoubleCheckbox>` / `<SmsCodeRow>` / `<DestructiveButton>` / `<FreezeModal>` 抽 packages/ui 还是 inline — 跨 3 page 复用度评估;参考 my-profile / account-settings-shell 0 抽 packages/ui 先例)
   - 状态机覆盖(mockup 6 状态 ↔ spec FR / SC 对齐)
   - Token 决策记录(复用清单 + 新增 token 说明)
   - 翻译期注意点(5 条 gotcha audit,per § 5.1)
   - Drift 政策(代码 > mockup)
   - 引用
3. **T_mock**:bundle 落盘 + handoff.md 完成 ✅
4. **T13**:翻译 `delete-account.tsx` — 删 PHASE 1 PLACEHOLDER banner + token-based className + 警示段视觉 + 双 checkbox 真控件 + 提交按钮 destructive 强调
5. **T14**:翻译 `cancel-deletion.tsx` — 同上 + read-only phone 视觉区分 + 撤销提交按钮 brand 强调(与注销提交对比)
6. **T15**:翻译 freeze modal in `login.tsx` — overlay scrim + card + 双 button 真视觉
7. **T16**:回填 plan.md UI 段(从 4 边界占位 → 完整 UI 结构 + token 映射)+ tasks.md T11 真后端冒烟(visual smoke,4-6 状态截图归 `runtime-debug/<date>-delete-cancel-mockup-translation/`)+ T_mock / T13 / T14 / T15 / T16 标 ✅

---

## References

- [`../spec.md`](../spec.md) — FR-001..FR-022 + SC-001..SC-009(业务规则 + 视觉占位 4 边界 + 反枚举不变性 + freeze modal 文案 Q3)
- [`../plan.md`](../plan.md) — 决策 1-5 + UI 段 PHASE 1 占位结构(待 mockup 落地后 T16 回填)
- [`../tasks.md`](../tasks.md) — T0-T10 + T12 ✅;T_mock / T13 / T14 / T15 / T16 待 ✅(T11 真后端冒烟在 PHASE 3 / spec D production deploy 后跑)
- [`../../my-profile/design/inspiration/04-account-security.png`](../../my-profile/design/inspiration/04-account-security.png) — 网易云账号与安全 IA 参照(注销 / 撤销注销不在网易云截图内,本 mockup 自行设计)
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook
- [account-settings-shell mockup-prompt.md](../../account-settings-shell/design/mockup-prompt.md) — 同 SDD 链 spec B 的 mockup-prompt 模板,本 prompt 沿用其 token / 结构惯例
- [account-settings-shell mockup PHASE 2 source](../../account-settings-shell/design/source/) — token 定义 baseline
- [login v2 mockup source](../../login/design/source-v2/) — login form / SmsInput 视觉系统 baseline(本 spec freeze modal 嵌入此页面)

---

## 修复 commit 引用(齿轮 icon 防覆盖,跨 spec 提示)

`e2b933d` `fix(account): replace sun-ray icon with proper gear SVG in TopNav settings`(my-profile / spec A 修复)

注销 / 撤销 流程不直接依赖 ⚙️ 齿轮,但本 prompt **显式声明** 不重画 my-profile / account-settings-shell;若 mockup 翻译期(PHASE 3)在 modal / page 视觉中需要任何 settings 或返回类 icon,必须使用 Feather Icons 标准 path(`settings` / `chevron-left` / `x` 等)— 不是太阳光芒 / 不是放射状光芒 / 不是花朵图案。
