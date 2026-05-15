# Delete-Account & Cancel-Deletion UI Mockup Handoff

> Bundle 来源:Claude Design (claude.ai/design),2026-05-07 PM 拿到
> Mockup prompt:[`mockup-prompt.md`](./mockup-prompt.md)(PR [#76](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/76) docs 段已 ship)
> 翻译期 PR:本 PR(feature/spec-c-mockup-translation)
> SDD 链:A(my-profile,已 ship #68/#70/#71)→ B(account-settings-shell,已 ship #73/#75)→ **C(本 spec,PHASE 2 翻译期)**

## 1. Bundle 内容速览

| 文件                                                                                       | 体积      | 作用                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`source/project/DeleteCancel Preview.html`](./source/project/DeleteCancel%20Preview.html) | 28 KB     | **主产物** — 单 HTML 自带 React 18 + Babel standalone + nvyParseClasses className-to-style mapper;6 状态横排预览 + 9 inline components(StackHeader / WarningBlock / ... 见 § 2) |
| [`source/project/tailwind.config.js`](./source/project/tailwind.config.js)                 | 2.5+ KB   | Token 定义 — **完全沿用** account-settings-shell PHASE 2 base + 仅新增 1 token(`color.modal-overlay`)                                                                           |
| [`source/project/IOSFrame.tsx`](./source/project/IOSFrame.tsx)                             | 2.0 KB    | iPhone 设备外框(设计期专用,不进 implementation)                                                                                                                                 |
| [`source/project/preview/`](./source/project/preview/)                                     | 5 个 shim | Claude Design sandbox shim(reanimated / rn / svg / tokens / IOSFrame.preview),不进 implementation                                                                               |
| [`source/project/uploads/`](./source/project/uploads/)                                     | —         | prompt 输入参考截图(若有),不是产物                                                                                                                                              |
| [`source/README.md`](./source/README.md)                                                   | 1.6 KB    | Claude Design 通用 boilerplate(meta `docs/experience/claude-design-handoff.md` 已覆盖)                                                                                          |

**丢弃的 bundle 内容**(原 export 含,不入 implementation):

- `LoginScreen.tsx` / `LoginScreenPreview.tsx` / `Login Preview.html` / `preview/Login*.preview.jsx` — login v2 已 ship(PR [#51](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/51));本 spec 仅替换 freeze modal section,不重画 login form
- `OnboardingScreen.tsx` / `OnboardingScreenPreview.tsx` / `Onboarding Preview.html` / `preview/Onboarding*.preview.jsx` — onboarding PHASE 2 已 ship(PR [#66](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/66))
- `ProfileScreen.tsx` / `ProfileScreenPreview.tsx` / `Profile Preview.html` / `preview/Profile*.preview.jsx` — my-profile PHASE 2 已 ship(PR [#70](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/70))
- `SettingsScreen.tsx` / `SettingsShellPreview.tsx` / `Settings Preview.html` / `AccountSecurityScreen.tsx` / `LegalScreen.tsx` / `PhoneScreen.tsx` — account-settings-shell PHASE 2 已 ship(PR [#75](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/75))

> 同 conversation 多 spec 输出捆在一起属 Claude Design 已知行为(my-profile / account-settings-shell handoff § 1 同款)。落 source/ 时按"只取本 spec 文件"过滤,但本 spec 因 freeze modal 嵌入 login,**保留 LoginScreen 系列**作 design-time 视觉对照参考(标注不入 implementation)。

### Deliverable 命名 drift(prompt vs 实际)

mockup-prompt.md 列了 7 个独立 deliverable(`DeleteAccountScreen.tsx` / `CancelDeletionScreen.tsx` / `FreezeModal.tsx` / `DeleteCancelPreview.tsx` / `IOSFrame.tsx` / `tailwind.config.js` / `assets/`),实际 Claude Design 产出**单 HTML 文件 `DeleteCancel Preview.html`** 内嵌全部 9 inline components + 6 状态预览。

**处理**:翻译期把 HTML 内 component 拆解抽出按 spec FR 分配到 3 个 page(`delete-account.tsx` / `cancel-deletion.tsx` / `login.tsx`),不入 implementation 的"中间层 .tsx" mockup 文件。

## 2. 组件 breakdown(T13/T14/T15 决策)

mockup `DeleteCancel Preview.html` 内 inline 9 个 components,跨 3 个视觉单元复用。

| Mockup 组件            | 处理                                                | 理由                                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StackHeader`          | **不翻译,改用 Expo Router default header**          | T2/T7 PHASE 1 已 ship `<Stack.Screen options={{ title: ... }}>`,iOS native 返回箭头 + 居中标题已是 default 体验;mockup 自画 header 是 design-time 替身(IOSFrame 没 Stack);account-settings-shell 同款决策 |
| `WarningBlock`         | **inline 在 `delete-account.tsx`**                  | 仅 delete-account 单页消费(per FR-001 警示双段);spec C 内 0 复用                                                                                                                                          |
| `CheckboxRow`          | **inline 在 `delete-account.tsx`**                  | 仅 delete-account 单页消费(per FR-002 双勾);brand fill + ✓ icon 真控件,替 PHASE 1 占位的 ☐/☑ 字符                                                                                                         |
| `SendCodeRow`          | **inline 在 T13 + T14 各页本地复制**(0 抽 packages) | 跨 delete-account / cancel-deletion 两页(2× 复用),但 cooldown 文案 + 3 态视觉规则一致 → 翻译期两页 inline 一致实现;sub-spec future cancel-deletion 同步即可                                               |
| `CodeInput`            | **inline 在 T13 + T14 各页本地复制**(0 抽 packages) | 6 格 OTP-style **项目首次**;login v2 既有 SmsInput 是单 input pattern,本 spec 重新设计为 6 cell;同 SendCodeRow 0 抽,后续 forgot-password 类引入时再评估 promote 到 packages/ui                            |
| `PrimaryButton`        | **inline 在 T13 + T14 + T15 各处本地复制**          | 3 tone(brand / destructive / destructive-ghost / disabled);account-settings-shell 已用 inline `<Pressable>` + `<Text>` 同款;不抽 packages/ui                                                              |
| `ErrorRow`             | **inline 在 T13 + T14 各页本地复制**                | 既有 PHASE 1 已用 inline `<Text>` 渲染 errorMsg;PHASE 2 升级为 err-soft 底卡 + alert icon,仍 inline                                                                                                       |
| `PhoneInputBlock`      | **inline 在 `cancel-deletion.tsx`**                 | 仅 cancel-deletion 消费;prefilled lock + sunken / editable 两 mode 由 prop 切换                                                                                                                           |
| `SectionLabel`         | **inline 在 T13 + T14 各页本地复制**                | 装饰性编号 + 大写 mono 文字 SECTION 标签(`01 RISK · 风险告知` / `02 CONFIRM · 双重知晓确认` / `03 VERIFY · 短信验证`);仅 2 页消费                                                                         |
| `IconAlert`            | **inline 在 \_primitives 复用 / 或新建 inline svg** | mockup 用自画 SVG,翻译期复用 my-profile / settings 已 establish 的 Feather Icons 标准 path;若无既有 alert path,inline 新建                                                                                |
| `IconLock`             | **inline svg 新建**                                 | mockup PhoneInputBlock prefilled 态消费;仅 cancel-deletion 单页 once-only                                                                                                                                 |
| `LoginFormPlaceholder` | **删除(不进 implementation)**                       | mockup 仅 design-time 用,production 用既有 login v2 form(PR #51 已 ship)                                                                                                                                  |
| `FreezeModalCard`      | **inline 在 `login.tsx` freeze modal section**(T15) | 仅 login.tsx 消费;PHASE 1 已 ship 占位 modal,T15 替为本 mockup 视觉                                                                                                                                       |

### packages/ui 抽取决策

**结论:0 抽 packages/ui,全部 inline 在对应 page**(per user 拍板 + 沿用 my-profile / account-settings-shell / onboarding baseline)。

| 评估维度                                | 结论                                                                                                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本 spec 内复用度                        | SendCodeRow 2× / CodeInput 2× / PrimaryButton 3× / SectionLabel 2× / ErrorRow 2× / 其他 page-specific 1×                                                                                                         |
| 跨 spec(future)预期复用                 | **中** — SendCodeRow + CodeInput 的 OTP 6 格 pattern 在后续 forgot-password / 2FA 等流程预期复用;但本次 0 抽,**触发条件**:第 2 个独立流程引入 SMS code 6 cell pattern 时 promote 到 `packages/ui/src/SmsCodeRow` |
| my-profile / onboarding / settings 先例 | 全部 0 抽 packages/ui                                                                                                                                                                                            |
| 改造成本(本 PR vs 抽 packages/ui)       | 本 PR inline ≈ 30min;抽 packages/ui 需 export entry / pnpm link / TS path / NativeWind preset 共享配置 + 跨 page 接口冻结 ≈ 2-4h,无业务收益                                                                      |
| Premature abstraction 风险              | 高 — SendCodeRow 当前是 disabled / cooldown / default 3 态;OTP 6 格当前是 brand / err 两 tone,propmote 后接口冻结会限制后续 variant(如 keyboard-avoidance / paste-from-clipboard / focus-on-mount 等)            |

**触发抽 packages/ui 的条件**(future):第 2 个独立 spec 引入 OTP 6 格输入(forgot-password / 2FA)时 promote `SmsCodeRow + CodeInput` 到 `packages/ui` + 加 variant props。

## 3. 状态机覆盖

mockup `FRAMES` 6 状态横排 ↔ spec.md FR-001 ~ FR-022:

| Mockup state              | Spec FR               | 视觉                                                                                                                                                                         |
| ------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DELETE-IDLE`             | FR-001 ~ FR-005       | delete-account 默认态 — 警示双段 err-soft + warn-soft dot 对比 / 双 checkbox 全空 / SendCodeRow disabled / CodeInput sunken disabled / PrimaryButton destructive disabled 灰 |
| `DELETE-CHECKED-COOLDOWN` | FR-006 + FR-007       | 双勾(brand fill + ✓)/ SendCodeRow cooldown `45s 后可重发` 灰底 / CodeInput 第一格 focused brand ring / PrimaryButton destructive disabled(输码 6 位前)                       |
| `DELETE-ERROR`            | FR-008 + FR-009       | 输 6 位 code(`493718`) 提交失败 / CodeInput 切 err 红 ring / ErrorRow `验证码错误` err-soft 底 / PrimaryButton destructive 红 fill active 状态                               |
| `CANCEL-PREFILLED`        | FR-013 + FR-019       | 顶部 brand-soft accent bar `恢复账号` / phone read-only sunken + 🔒 lock icon + maskPhone(`+86 138****5678`)/ SendCodeRow cooldown / CodeInput focused / PrimaryButton brand |
| `CANCEL-DEEPLINK`         | FR-013 deep-link 路径 | phone editable empty + placeholder / SendCodeRow disabled until 输完手机号 / CodeInput disabled / PrimaryButton brand disabled                                               |
| `FREEZE-MODAL-ACTIVE`     | FR-010 ~ FR-012       | login form 低饱和占位 + scrim modal-overlay 0.48 / Card w296 rounded-md(16) shadow.modal / warn icon-circle + 双 button [保持] ghost / [撤销] brand fill                     |

**6/6 完全 match,无 spec drift**。

## 4. Token 决策记录

| 维度                                                 | 状态                                                                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tailwind.config.js vs account-settings-shell PHASE 2 | **+1 token**(`color.modal-overlay = rgba(15,18,28,0.48)`)+ shadow.modal(若 settings shell base 未含)                                                                                |
| 新增 token                                           | **1**:`modal-overlay`(freeze modal scrim 颜色)— 语义明确,语义化命名优于内联 rgba                                                                                                    |
| 复用清单                                             | brand-{50..900,soft} / accent / ink / line-{soft,strong} / surface-{alt,sunken} / ok / warn / err(+soft) / spacing(xs~3xl) / radius(xs~lg+full) / fontFamily / shadow.card+cta      |
| **首次消费**                                         | shadow.modal(`0 12px 32px -8px rgba(15,18,28,0.28), 0 4px 12px -4px rgba(15,18,28,0.18)`)— 若 base 已含则复用,若无则与 modal-overlay 同步新增                                       |
| **不消费**                                           | `hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` — my-profile 引入,本 spec 无 hero / 无沉浸式背景                                                             |
| Hex / px 字面量(业务代码)                            | 0(除 SVG `stroke={color}` / Pressable layout 维度 `style={{ height: 48/52 }}` / CodeInput cell `width 48`,详 § 5)                                                                   |
| 关键复用决策                                         | `destructive (delete-account submit) → err 系` / `recover (cancel-deletion submit) → brand-500 主色`(对比体现"危险 vs 恢复")/ `cooldown text → ink-muted` / `disabled → ink-subtle` |

**落地动作**:`packages/design-tokens/src/index.ts` 加 `modal-overlay`(+ `shadow.modal` 若 base 未含);`apps/native/tailwind.config.ts` re-export 即可。

## 5. 翻译期注意点

### 5.1 5 条通用 gotcha audit(per meta playbook § 5.1)

| #   | 检查项                                  | spec C 落点                                                                                                                                                                                                           |
| --- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 非档 spacing / radius 静默 drop         | mockup 用 `px-md` / `pt-md` / `pb-xl` / `gap-md` / `gap-2` / `gap-3` 等 — 全在 NativeWind v4 default + tokens scale ✓                                                                                                 |
| 2   | reanimated 包安装                       | **本 spec 无动画**(无 modal 入退动画 — RN `<Modal animationType="fade">` default 由 RN 提供),不消费 reanimated ✓                                                                                                      |
| 3   | 不规范 inline style                     | 4 处:CodeInput cell `style={{ height: 48 }}` + cell `boxShadow={focusedRingColor}` / SendCodeRow `style={{ height: 48 }}` / PrimaryButton `style={{ height: 52 }}` / FreezeModal `width: 296` — 全是 layout 维度,豁免 |
| 4   | className token 是否在 design-tokens 内 | 1 token 新增(modal-overlay),其余既有 ✓                                                                                                                                                                                |
| 5   | flex-row gap-N 在 spacing scale 内      | `gap-md` / `gap-2` / `gap-3` / `gap-1` / `gap-1.5` 全在 NativeWind v4 default + tokens ✓                                                                                                                              |

### 5.2 spec C 特定 gotcha

| #   | 检查项                                                  | 详情                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | mockup `<StackHeader>` 与 Expo Router Stack header 冲突 | mockup 自画 header 是 design-time 替身(IOSFrame 没 Stack)。**翻译版删 `<StackHeader>` 整段**;3 page 由 PHASE 1 已 ship 的 `Stack.Screen options={{ title: ... }}` 提供 default header                                                                                |
| 2   | mockup `LoginFormPlaceholder` 仅设计期占位              | mockup line 543-567 是低饱和 placeholder 用于 freeze modal 状态可视化。**翻译版完全删除**;production login.tsx 用既有 login v2 form(PR #51),T15 仅替 freeze modal section                                                                                            |
| 3   | mockup primitives "反向 export" 模式(无)                | spec C mockup 不像 account-settings-shell 那样反向 export — 本 mockup 各 component 均 inline 在 HTML 内,无跨文件引用,翻译期直接拆解到对应 page 即可                                                                                                                  |
| 4   | CodeInput 6 格 OTP-style 是项目首次                     | login v2 SmsInput 是单 input pattern;本 spec 6 cell 视觉首次。**翻译版需自实 keyboard-avoidance + autofocus + paste-from-clipboard 6 位拆分**;a11y `accessibilityRole="adjustable"` + `accessibilityValue={{text: code}}`;暂不 promote packages/ui                   |
| 5   | 反枚举守则(cancel-deletion only,per FR-020)             | mockup CANCEL frames 提示 `所有错误统一显示「凭证或验证码无效」`。**翻译版严守**:cancel-deletion ErrorRow 文案 hard-code `凭证或验证码无效`,**不**根据 401 / 429 / 5xx 区分;delete-account 反枚举不适用,**可** 区分文案(`验证码错误` / `操作太频繁,请稍后再试` / 等) |
| 6   | a11y 必须从 PHASE 1 完整继承                            | mockup 仅写视觉,未写 a11y。**翻译版必须保留 PHASE 1 a11y 全套**(per FR-014 + T2/T3/T4/T7/T8 测试 case): `accessibilityRole=button/checkbox` / `accessibilityState={{checked, disabled, busy}}` / `accessibilityLabel` / `accessibilityHint`                          |
| 7   | 测试 surface 兼容性                                     | PHASE 1 测试经 `accessibilityLabel/Role` + 文本字符串 `getByText` 选择器 query。翻译版 className 重写 + JSX 嵌套基本不变(checkbox / Pressable / TextInput 仍在,只是包了一层 Card / Section)— **应不失效**;如失效需调测试 selector 而非业务流                         |
| 8   | mockup `state` prop 自管 demo 模式                      | DeleteAccountScreen / CancelDeletionScreen / LoginFreezeScreen 都 `({ state }: ScreenProps)` 是 preview demo 用,**不要复制**;翻译版只用 `useState` + 业务 hook(`useDeleteAccountForm` / 等价),无 `state` prop                                                        |
| 9   | mockup CodeInput err mode 视觉 vs PHASE 1 err 处理      | mockup `tone="err"` 切红 ring(2px)+ ErrorRow err-soft 同步显示。翻译版 `errorMsg !== null` 时 CodeInput tone 切 err + ErrorRow 渲染 — 两者 atomic 联动,不可分裂                                                                                                      |
| 10  | mockup PHASE 1 `'submitting...'` 占位 vs 中文友好文案   | PHASE 1 plan.md UI 段 COPY `submitting: 'submitting...'` 是 dev 占位。**翻译版改为**:delete-account = `'正在注销...'`;cancel-deletion = `'正在撤销...'`;一致 PrimaryButton 内显                                                                                      |
| 11  | mockup `key={i}` warning(CodeInput / 6-cell loop)       | `cells.map((ch, i) => <View key={i}>...)` — RN 接受 numeric key,但 ESLint plugin-react `react/jsx-key` 可能警告;翻译版用 `key={'cell-' + i}` 或 `key={String(i)}` 显式字符串                                                                                         |
| 12  | mockup IconAlert / IconLock SVG path(本 spec 引入)      | 沿用 my-profile / settings 已 establish 的 Feather Icons 标准 path(若 IconAlert 已存在 \_primitives,复用;若无,inline 新建并标 `// from Feather Icons (alert-triangle / lock)` 注释)                                                                                  |

## 6. Drift 政策

| 情况                                                                          | 处理                                                                                                                  |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| mockup `<StackHeader>` 自画 vs Expo Router default                            | **以 Expo Router default 为准**(已 ship + iOS native 体验 + 0 维护);mockup `<StackHeader>` 整段删,不入 implementation |
| mockup `LoginFormPlaceholder` vs 既有 login v2 form                           | **以 login v2 实际 form 为准**(PR #51 已 ship + PHASE 2 视觉系统 establish);mockup placeholder 整段删                 |
| mockup `'submitting...'` 占位文案 vs 翻译版 `'正在注销...'` / `'正在撤销...'` | **以中文友好文案为准**;mockup 占位仅 dev preview                                                                      |
| mockup CodeInput err mode 切红 ring vs PHASE 1 ErrorRow 单独渲染              | **以 mockup 视觉为准**(联动);PHASE 2 翻译期 CodeInput tone + ErrorRow 同步显示                                        |
| mockup PHASE 1 PLACEHOLDER banner / 字符 ☐/☑ checkbox                         | **以 PHASE 2 视觉为准**;翻译版删 banner + 替换为真 checkbox 控件(Pressable + ✓ icon)                                  |
| mockup 反枚举守则(cancel-deletion only)                                       | **以 spec FR-020 为准**(强制反枚举);delete-account 错误可区分文案 — 与 cancel-deletion 不同                           |
| mockup 与 spec.md 状态机不符                                                  | 6/6 一致,无冲突                                                                                                       |
| mockup 引入新 token                                                           | 1 新增(`modal-overlay`)+ 可能 1 新增(`shadow.modal` 若 base 未含)                                                     |
| mockup `<HeroBlurBackdrop>` / 复杂动画                                        | N/A(本 spec 无 hero;modal 入退用 RN `<Modal animationType="fade">` default,无 reanimated)                             |

## 7. 引用

- [`spec.md`](../spec.md) — FR-001 ~ FR-022 业务流 / SC-001 ~ SC-009 视觉占位 4 边界 + 反枚举不变性 / Q3 freeze modal 文案
- [`plan.md`](../plan.md) — 决策 1-5 + UI 段本 PR 从占位回填完整版(T16)
- [`tasks.md`](../tasks.md) — T_mock / T13 / T14 / T15 / T16 本 PR 同步 ✅(T11 真后端冒烟仍 deferred 等 server release 0.2.0 production)
- [`mockup-prompt.md`](./mockup-prompt.md) — Claude Design prompt(PR #76 docs 段已 ship)
- [account-settings-shell handoff.md](../../account-settings-shell/design/handoff.md) — 同 SDD 链 spec B 的 handoff,本文件沿用 7 段结构 + token base
- [my-profile handoff.md](../../my-profile/design/handoff.md) — token base 起源 + 0 抽 packages/ui 先例
- [login v2 design source](../../login/design/source-v2/) — login form 视觉系统(本 spec freeze modal 嵌入此页面)
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [meta `docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 5 handoff 模板
