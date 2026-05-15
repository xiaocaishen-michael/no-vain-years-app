# Realname Verification UI Mockup Handoff

> Bundle 来源：Claude Design (claude.ai/design)，2026-05-08 PM 拿到
> Mockup prompt：[`mockup-prompt.md`](./mockup-prompt.md)（PR [#90](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/90) docs 段已 ship）
> 翻译期 PR：本 PR（`feature/real-name-auth-mockup-bundle`）— 仅 docs（bundle 归档 + handoff），UI impl 翻译走后续 PHASE 2 PR
> SDD 链：A spec 三件套 PR [#88](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/88) → B mockup-prompt + 3 inspiration PR [#90](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/90) → **本 PR PHASE 2 mockup bundle 归档** → 后续 PHASE 2 UI impl PR
> server 配套：[my-beloved-server PR #149](https://github.com/xiaocaishen-michael/my-beloved-server/pull/149) spec 已 ship；schema migration + 3 endpoint 待后续 impl session

## 1. Bundle 内容速览

| 文件                                                                               | 体积             | 作用                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`source/project/Realname Preview.html`](./source/project/Realname%20Preview.html) | ~24 KB（677 行） | **唯一 realname-specific 主预览** — 单 HTML 自带 React 18 + Babel standalone + nvyParseClasses className-to-style mapper；7 状态横排预览 + IOSFrame 容器 + 完整 NVY_TOKENS 表 + 自带 token diff annotation |
| [`source/project/tailwind.config.js`](./source/project/tailwind.config.js)         | 共享             | Token 定义（与 device-management PHASE 2 base 一致；本 spec **0 新增**）                                                                                                                                   |
| [`source/project/IOSFrame.tsx`](./source/project/IOSFrame.tsx)                     | 共享             | iPhone 设备外框（design-time 专用，**不进 implementation**）                                                                                                                                               |
| [`source/project/preview/`](./source/project/preview/)                             | 共享 shim        | Claude Design sandbox shim（reanimated / rn / tokens shim + jsx render entries），**不进 implementation**                                                                                                  |
| [`source/project/uploads/`](./source/project/uploads/)                             | —                | prompt 输入截图（若有），**不是产物**                                                                                                                                                                      |
| [`source/README.md`](./source/README.md)                                           | 1.6 KB           | Claude Design 通用 boilerplate                                                                                                                                                                             |

**丢弃的 bundle 内容**（同 thread 内多 spec 累积输出，本 spec 不消费）：

- `LoginScreen.tsx` / `LoginScreenPreview.tsx` / `Login Preview.html` / `PhoneScreen.tsx` — login v2 已 ship（PR #51）
- `OnboardingScreen.tsx` / `OnboardingScreenPreview.tsx` / `Onboarding Preview.html` — onboarding PHASE 2 已 ship（PR #66）
- `ProfileScreen.tsx` / `ProfileScreenPreview.tsx` / `Profile Preview.html` — my-profile PHASE 2 已 ship（PR #70）
- `SettingsScreen.tsx` / `SettingsShellPreview.tsx` / `Settings Preview.html` / `AccountSecurityScreen.tsx` / `LegalScreen.tsx` — account-settings-shell PHASE 2 已 ship（PR #75）
- `DeleteCancel Preview.html` — delete-cancel mockup 输出（PR #79 已翻译 ship）
- `LoginManagementListScreen.tsx` / `LoginManagementDetailScreen.tsx` / `RemoveDeviceSheet.tsx` / `DeviceIcon.tsx` / `Login Management Preview.html` — device-management mockup 输出（PR [#89](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/89) 已 ship）

> 同 conversation 多 spec 输出捆在一起属 Claude Design 已知行为（device-management / delete-cancel / my-profile handoff § 1 同款）。本 spec 落 source/ 时**保留全 bundle**作 design-time 视觉对照 + token consistency 检查参考；翻译期仅消费 `Realname Preview.html` + `tailwind.config.js`。

### Deliverable 命名一致性（prompt vs 实际）

mockup-prompt.md 列了 8 个 deliverable，**Claude Design 仅产出 1 个 HTML preview，未输出任何 .tsx**：

| Prompt 列出                      | 实际产出                  | 状态                                                   |
| -------------------------------- | ------------------------- | ------------------------------------------------------ |
| `RealnameInputForm.tsx`          | ❌ 未产出                 | HTML inline 在 `Realname Preview.html`                 |
| `RealnamePendingView.tsx`        | ❌ 未产出                 | HTML inline 同上                                       |
| `RealnameReadonlyView.tsx`       | ❌ 未产出                 | HTML inline 同上                                       |
| `RealnameFrozenView.tsx`         | ❌ 未产出                 | HTML inline 同上                                       |
| `RealnameScreenPreview.tsx`      | ❌ 未产出                 | HTML 自带 7 状态横排预览（line 615-672）               |
| `IOSFrame.tsx`                   | ✅ 共享自其他 spec bundle | 命中（沿用既有同款，本 spec 不消费）                   |
| `tailwind.config.js`             | ✅ 共享                   | 命中（device-management PHASE 2 base，本 spec 0 新增） |
| `CLAUDE-DESIGN-BUNDLE-README.md` | ✅ 共享                   | 命中（boilerplate）                                    |

**Why no .tsx**（fact-checked per [claude.ai/design Bundle Mechanics](https://claudefa.st/blog/guide/mechanics/claude-design-handoff)）：claude.ai/design 官方 handoff bundle baseline = HTML + screenshots + README，**不包含 .tsx**。.tsx 是 over-deliver 行为（onboarding / login / my-profile / device-management 出 .tsx 是好运气）。**单 route 多 state** 的 spec（delete-cancel 1 page + 1 modal / realname 1 page 4 view）回到 baseline，仅输出 HTML preview。本 spec 与 delete-cancel 同 pattern。

> 详见上轮 fact-check 调研报告：联网 + 5 spec 实证（onboarding source 302 行 vs prod 146 行 / login source 552 vs prod 296 / my-profile source 443 vs prod 325 → source `.tsx` 过半内容不进 prod；HTML preview 反而是更系统化的 token 真相源 — delete-cancel HTML 第 19-45 行 inline 完整 NVY_TOKENS 11 类 vs source `.tsx` 散落 className 片段化）。

## 2. 组件 breakdown（HTML-only 模式）

`Realname Preview.html` 内 inline 的子组件（line refs）+ 翻译处理：

| Mockup 子组件（HTML inline）                                                                         | line    | 翻译处理                                                                          | 理由                                                                             |
| ---------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `IconBack`（StackHeader 返回箭头）                                                                   | ~270    | **不翻译** — Stack header 由 Expo Router `_layout.tsx` 默认提供，prod 不画 header | 与 device / my-profile / delete-cancel 同款决议                                  |
| `IconAlertSmall`（ErrorRow 内圆形 ! icon）                                                           | ~250    | **inline svg in `index.tsx`**                                                     | 仅 ErrorRow 单处消费；mirror 既有 `(tabs)/_layout.tsx` IconHome 风格 inline path |
| `IconCheck`（Checkbox 勾选时白勾）                                                                   | ~260    | **inline svg in `index.tsx`**                                                     | 仅 Checkbox 单处消费                                                             |
| `IconUser`（ReadonlyView 头像 placeholder）                                                          | ~270    | **复用 `(tabs)/_layout.tsx` 既有 IconUser**                                       | 既有 tab bar IconUser 同款 stroke outline 风格，本 spec 直接 import 复用         |
| `IconAlert`（FrozenView warn 图标）                                                                  | ~270    | **inline svg in `index.tsx`** 或复用 ErrorRow 同款                                | 仅 FrozenView 单处消费；warn 黄系 stroke triangle                                |
| `StackHeader`（仅 design-time 用）                                                                   | 280-289 | **删除**                                                                          | \_layout.tsx 已提供                                                              |
| `ErrorRow`（err-soft bg + err text + alert icon）                                                    | 293-300 | **inline 在 `index.tsx`**                                                         | 项目惯例 0 抽 packages/ui（同 device / delete-cancel）；FAILED 状态使用          |
| `Checkbox`（圆形 18×18 brand-500 fill / line-strong border）                                         | 303-314 | **inline 在 `index.tsx`**                                                         | 仅 AgreementRow 消费                                                             |
| `FieldRow`（label 88px width + value 右对齐）                                                        | 327-340 | **inline 在 `index.tsx`**                                                         | 仅 InputForm 消费                                                                |
| `FormDivider`（line-soft 1px hairline + 16px 左右 inset）                                            | 342-344 | **inline 在 `index.tsx`**                                                         | 仅 InputForm 消费                                                                |
| `AgreementRow`（Checkbox + 协议文案 + brand-500 underline 链接）                                     | 346-358 | **inline 在 `index.tsx`**                                                         | 仅 InputForm 消费                                                                |
| `PrimaryCta`（3 态：disabled bg-brand-300 / enabled bg-brand-500+shadow-cta / submitting busy）      | 360-384 | **inline 在 `index.tsx`**                                                         | 与 onboarding `PrimaryButton` drift accepted 一致；不抽 packages/ui（项目惯例）  |
| `RealnameInputForm`（status='unverified' \| 'failed' + name + idNumber + agreed + submitting props） | 386-431 | **inline 在 `index.tsx` 状态机分支**（status=UNVERIFIED \| FAILED 时 render）     | 单 route 多 view 模式，4 视觉单元在同一 page 文件                                |
| `RealnamePendingView`（ActivityIndicator size=40 brand-500 + 大字 + 副文案）                         | 433-446 | **inline 在 `index.tsx` 状态机分支**（status=PENDING 时 render）                  | 同上                                                                             |
| `MaskCardRow`（label-value 横排 + line-soft divider）                                                | 449-459 | **inline 在 `index.tsx`**                                                         | 仅 ReadonlyView 消费                                                             |
| `RealnameReadonlyView`（标题 + accent-soft 头像 + mask username + surface-sunken 卡片）              | 461-485 | **inline 在 `index.tsx` 状态机分支**（status=VERIFIED 时 render）                 | 同上                                                                             |
| `RealnameFrozenView`（warn-soft 88×88 圆 + IconAlert + 大字 + 副文案 + brand fill「去撤销注销」CTA） | 487-509 | **inline 在 `index.tsx` 状态机分支**（status=FROZEN 时 render）                   | 同上                                                                             |
| `RealnameLoading`（splash skeleton + 居中 spinner + "加载中…"）                                      | 511-538 | **inline 在 `index.tsx` 状态机分支**（status=LOADING 时 render）                  | 同上                                                                             |
| `Page` wrapper（仅 design-time 加 StackHeader）                                                      | 540-548 | **删除**                                                                          | \_layout.tsx 已提供                                                              |
| `FRAMES` 数组 + `StateFrame` + `App`（preview 渲染容器）                                             | 551-672 | **删除**                                                                          | design-time 专用，production runtime 走真后端数据 + status                       |

### packages/ui 抽取决策

**结论：0 抽 packages/ui，全部 inline 在 `realname/index.tsx` 单 file**（沿用 my-profile / account-settings-shell / delete-cancel / device-management 同款决议）。

| 评估维度         | 结论                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本 spec 内复用度 | ErrorRow 1×（FAILED 状态）/ Checkbox 1×（AgreementRow）/ PrimaryCta 2×（InputForm + FrozenView）/ FieldRow 2×（姓名 + 证件号）/ MaskCardRow 2×（姓名 + 证件号）/ FormDivider 2×（dividers）                                      |
| 跨 spec 复用度   | Checkbox 仅 realname 协议消费（其他 spec 无协议复选场景）/ PrimaryCta 与 onboarding `PrimaryButton` 重叠但 drift accepted（onboarding 已 ship，inline override OK）/ ErrorRow 与 onboarding / delete-cancel 既有 inline 实现重叠 |
| 已 ship 同款先例 | spec B / C / my-profile / device-management 均 0 抽 packages/ui，page-local inline 是项目惯例                                                                                                                                    |
| 抽包代价         | 包结构 / TypeScript types export / 测试结构成本 vs 1× 跨 spec 复用收益不成正比                                                                                                                                                   |

### 翻译期组件文件结构（建议）

```text
apps/native/app/(app)/settings/account-security/realname/
├── _layout.tsx              ← Stack screen options（标题 '实名认证' / 返回箭头）
└── index.tsx                ← single route 多 view（按 hook status 分支 render 4 视觉单元 + LOADING/ERROR/FROZEN）
```

> 与 device-management 路径 `login-management/` 形成**对照**：device 是 list + detail 两 page → 拆 `index.tsx` + `[id].tsx` 双 route；本 spec 单 route 多 state → 单 file 状态机。

## 3. 状态机覆盖（mockup 7 状态 ↔ spec FR/SC 对齐）

| Mockup 状态                                                               | spec FR / SC 对应                                                                                              | 备注                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `01 LOADING`（splash skeleton + spinner）                                 | FR-003 状态机 / spec User Story 3 acceptance 3 rehydrate 不抖                                                  | GET /me in-flight；prod 直接 render skeleton |
| `02 UNVERIFIED-EMPTY`（空 form + CTA 弱态 bg-brand-300）                  | FR-003 / FR-004 form 校验 / FR-010 占位 4 边界                                                                 | 用户初次进入；form invalid → CTA disabled    |
| `03 UNVERIFIED-CAN-SUBMIT`（已填 + 已勾 + CTA 强态 bg-brand-500）         | FR-003 / FR-004 / FR-005 SDK 调用契约                                                                          | 用户填好可提交；tap 后转 PENDING             |
| `04 PENDING-WAITING`（spinner + 大字 + 副文案）                           | FR-003 / FR-005 客户端轮询 + 30s 超时                                                                          | 等待 SDK 完成；30s 超时自动转 FAILED         |
| `05 FAILED-NAME-ID-MISMATCH`（form 上方 ErrorRow + 保留输入）             | FR-003 / FR-004 / spec User Story 3 acceptance 1-3                                                             | 失败可重试；4 种 failedReason 文案 enum 全列 |
| `06 VERIFIED-READONLY`（标题 + 头像 + mask 用户名 + surface-sunken 卡片） | FR-003 / FR-006 mask 直接消费后端 / FR-009 不可解绑 / FR-015 / SC-002 readonly destructive 0 / SC-007 不可解绑 | 终态不可逆 / 不可解绑                        |
| `07 FROZEN-ERROR`（warn-soft icon + 大字 + 「去撤销注销」CTA）            | FR-003 / spec User Story 4 acceptance 3 / SC-003 FROZEN 拦截 0 调 GET /me                                      | AuthStore.status=FROZEN 前置拦截             |

**spec 状态 vs mockup 状态映射缺口**：

- spec FR-003 状态机含 `ERROR` 态（GET /me 网络错），mockup 未画 ERROR 独立 frame；翻译期 ERROR 态 fallback 复用 LOADING skeleton + 重试按钮（implementer 决策）
- spec User Story 3 acceptance 4（429 RATE_LIMIT_EXCEEDED）触发 FAILED + 文案 `重试次数已达上限，请稍后再试` — mockup HTML `FAILED_REASON_TEXT.RATE_LIMIT_EXCEEDED` 已 enum 列出（line 323），翻译期复用此 text mapping

## 4. Token 决策记录

### 复用 token 清单

`Realname Preview.html` 第 28-53 行 inline 完整 `NVY_TOKENS` 表，与 device-management PHASE 2 base **byte-identical**：

| 维度           | Token 集                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| Color brand    | `brand-50` ~ `brand-700` + `brand-soft`                                   |
| Color ink      | `ink` / `ink-muted` / `ink-subtle`                                        |
| Color line     | `line` / `line-strong` / `line-soft`                                      |
| Color surface  | `surface` / `surface-alt` / `surface-sunken`                              |
| Color feedback | `ok / ok-soft / err / err-soft / warn / warn-soft / accent / accent-soft` |
| Color misc     | `white / transparent / modal-overlay`                                     |
| Space          | `xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)`            |
| FontSize       | `[10px] / [11px] / xs / sm / base / lg / xl / 2xl / 3xl`                  |
| FontWeight     | `normal / medium / semibold / bold`                                       |
| Shadow         | `card / cta / cta-err / sheet`                                            |

### 0 新增 token

HTML 自带 token diff annotation（line 645-668）明示：

> +0 新 token

实际使用清单（HTML 视觉决策）：

- 头像 placeholder bg → **`accent-soft`**（与图 3 浅粉相符）
- mask 卡片 bg → **`surface-sunken`**
- 协议链接 → **`brand-500` + `underline`**
- CTA disabled → **`bg-brand-300`**（mirror onboarding `PrimaryButton` drift accepted）
- CTA enabled → **`bg-brand-500` + `shadow-cta`**
- ErrorRow → **`err-soft` bg + `err` text**
- FrozenView icon → **`warn`**（注销冻结非 destructive，仅警告；mirror delete-cancel freeze modal 视觉）
- 证件号 mask → **`font-mono`** 等宽便于读 18 位

### 不消费的 token（HTML 自带列出，line 663-666）

`hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring`（无 hero 沉浸式背景） / `modal-overlay` / `boxShadow.sheet`（无 modal / sheet） / `boxShadow.cta-err`（无 destructive 操作；不可解绑约束物理化）

## 5. 翻译期注意点（5 条 gotcha audit）

### Gotcha 1 — HTML preview 是真相源，不是中间产物

per fact-checked 调研结论：claude.ai/design 官方 handoff bundle baseline = HTML，**不是 .tsx**。implementer 翻译时**直接读 HTML**（在浏览器渲染或文本扫 className）即得视觉真相，**不需要**先把 HTML 转成 .tsx 中间产物再 production .tsx — 这会引入额外 drift 风险。

**实证支持**：上轮 5 spec 实证 — source `.tsx` 过半内容（46-52%）不进 prod，主要是 inline `@nvy/ui` 子组件 + 假 `useState` + iOS chrome 等 design-time 包装；从 HTML 翻译反而避免这些"伪可复用"诱惑。

### Gotcha 2 — mask 字段直接消费后端，前端禁止自行 mask

per spec FR-006：`realNameMasked` / `idCardMasked` / `usernameMasked` 由后端 GET /me 响应返回，**前端不自行 mask**。理由：

- mask 规则单源（避免前后端 mask 算法 drift）
- 反枚举：明文从未传到 client，前端没有 mask 能力的必要

mockup HTML 的 `RealnameReadonlyView` props（line 461）默认值 `*磊` / `3**************3` / `z***d` 是 demo 数据，**不是 mask 算法**。implementer 直接读后端字段即可。

### Gotcha 3 — FROZEN 由 AuthStore 前置拦截，不调 GET /me

per spec SC-003：FROZEN 状态进入 realname 路由 → AuthStore.status 前置拦截 → 0 调 GET /me → 直接 render `FrozenView`。

**避免反模式**：

```text
❌ useEffect(() => {
   loadRealnameStatus().then(...);  // 即使 FROZEN 也调用 GET /me，浪费请求 + race
});

✅ useEffect(() => {
   if (authStore.status === 'FROZEN') return;  // 前置拦截
   loadRealnameStatus().then(...);
});
```

### Gotcha 4 — form 输入保留语义（FAILED 重试时）

per spec User Story 3 acceptance 1-3：FAILED 状态下 form 输入**保留用户上次提交值**（不重置），用户改输入后即可重试。

实现：form state（`name` / `idNumber` / `agreed`）由 page 级 `useState` 持有，状态机切换 view 时**不卸载** form state（同 page file 内多 view 切换；不跨 page navigate）。

mockup HTML `RealnameInputForm` 通过 props 接受 `name` / `idNumber` / `agreed`（line 386）— prod 直接读 `useState` 局部变量。

### Gotcha 5 — 协议链接 tap 暂不跳转（M3 法务定稿后再决定）

per spec FR-011：协议《实名认证服务个人信息处理授权协议》文本 M1 阶段为 placeholder（前端静态页占位）；M3 真用户前由法务定稿。

mockup HTML `AgreementRow`（line 346）的 `《实名认证服务个人信息处理授权协议》` text 是 `brand-500 underline` Pressable 视觉，**但 tap handler 暂留空 / TODO**：

```text
<Pressable onPress={() => {
  // TODO: M3 法务定稿后接路由 → /(app)/legal/realname-auth-agreement
}}>
  <Text className="text-xs text-brand-500 underline">《实名认证...授权协议》</Text>
</Pressable>
```

plan.md UI 段回填时**显式声明**此 TODO，避免 implementer 误以为遗漏。

## 6. Drift 政策（代码 > mockup）

per ADR-0017 / 项目惯例：

> **代码是真相源，mockup drift 不算 bug。**

本 spec 实施时如发现：

- mockup 漏画的视觉元素 + spec.md / plan.md 已声明 → 按 spec 实施，**mockup 不补**
- mockup 与 spec 冲突 → spec 优先；amend mockup 不必须
- visual fidelity drift 在 ±2px / ±单 token 内可接受

**实证教训**（2026-05-08，cancel-deletion）：mockup HTML 未画 OTP placeholder，implementer PHASE 2 翻译时自加 `placeholder='请输入 6 位验证码'` 触发 RN Web `opacity-0` 不抑制 `input::placeholder` pseudo-element 渲染的 visual leak bug → PR [#92](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/92) 修复（删 placeholder + COPY entry orphan cleanup）。

**教训固化**：

> **mockup 未画的视觉元素，implementer 自加要慎重 —— 优先与 spec.md / 既有先例对齐，而不是凭"a11y 友好"等直觉添加。**

本 spec implementer 实施时遵守此约束：

- mockup HTML 未画的元素（如额外 placeholder / 提示文字 / icon 装饰）→ **不自加**
- 必加的需求由 spec.md FR / plan.md UI 段明文声明 → 按声明实施

## 7. References

- spec：[`../spec.md`](../spec.md) FR-001..FR-016 + SC-001..SC-007 + 8 个 CL
- plan：[`../plan.md`](../plan.md) § UI 结构（占位版）— 翻译期 PR 中**回填为完整版**（区域分块 / 状态视觉转移 / Token 映射 / 复用 packages/ui 组件清单 / a11y 落点）
- tasks：[`../tasks.md`](../tasks.md) T9-T11 — PHASE 2 mockup translate / UI Impl 入口
- mockup-prompt：[`./mockup-prompt.md`](./mockup-prompt.md)（PR [#90](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/90)）
- inspiration（用户 3 张参考截图）：[`./inspiration/01-input.png`](./inspiration/01-input.png) / [`./inspiration/02-liveness-sdk.png`](./inspiration/02-liveness-sdk.png) / [`./inspiration/03-verified.png`](./inspiration/03-verified.png)
- server 配套：[my-beloved-server PR #149](https://github.com/xiaocaishen-michael/my-beloved-server/pull/149) spec/account/realname-verification/
- PRD：[§ 5.10 实名认证（M1.X 引入）](../../../../docs/requirement/account-center.v2.md#510-实名认证m1x-引入)
- ADR-0014 NativeWind 跨端 UI 底座 / ADR-0015 Claude Design from M1.2 / ADR-0017 SDD 业务流先行 + mockup 后置
- 既有参考：[`../../device-management/design/handoff.md`](../../device-management/design/handoff.md)（含 .tsx 模式参照）/ [`../../delete-account-cancel-deletion-ui/design/handoff.md`](../../delete-account-cancel-deletion-ui/design/handoff.md)（HTML-only 模式同款先例）
- Claude Design 官方 baseline 调研 sources：
  - [Anthropic — Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs)
  - [claude.ai/design Bundle Mechanics (claudefa.st)](https://claudefa.st/blog/guide/mechanics/claude-design-handoff)
  - [Get started with Claude Design — Help Center](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
  - [How Good is Anthropic's Claude Design? (Victor Dibia)](https://newsletter.victordibia.com/p/how-good-is-anthropics-claude-design)
