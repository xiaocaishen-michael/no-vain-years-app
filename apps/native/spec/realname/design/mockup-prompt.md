# Realname Verification UI mockup — Claude Design prompt

> 拿下文 prompt 全文（从 `## Prompt(拷贝)` 段以下的 ` ```text ... ``` ` 块内）粘到 [claude.ai/design](https://claude.ai/design)。运行后，把 mockup bundle 落到 `apps/native/spec/realname/design/source/`，下次 session 进入翻译期（PHASE 2 PR — T_mock / T9 / T10 / T11）。
>
> 模板基于 `<meta>/docs/experience/claude-design-handoff.md` § 2.1 + § 2.1b，沿用 [`../../device-management/design/mockup-prompt.md`](../../device-management/design/mockup-prompt.md) 的结构，针对 realname 的项目特定约束（per ADR-0017 类 1 标准 UI + spec.md FR-001..FR-016 + 用户提供 3 张截图作 IA 锚）定制。

---

## 设计上下文（仅 user 看，不放进 Claude Design prompt）

| 项       | 值                                                                                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面     | 单路由 `realname/index` 多状态 view：`InputForm`（图 1）/ `PendingView`（等待 SDK）/ `ReadonlyView`（图 3）/ `FrozenView`（冻结期错误）                                                                                                                                                                       |
| 路由     | `(app)/settings/account-security/realname/index.tsx`（spec B account-security shell 已 ship 入口 row；本 spec 把第 11 行 `realname:` 从 disabled 转 enabled + onPress）                                                                                                                                       |
| 业务流   | 设置 → 账号与安全 → 实名认证 → GET /me 状态分支：UNVERIFIED → InputForm → submit → PendingView → 跳活体 SDK → 回 app 轮询 → VERIFIED → ReadonlyView；FAILED → InputForm + 错误文案 + 保留输入 → 重试；FROZEN → FrozenView                                                                                     |
| IA 锚    | 用户提供 3 张参考截图（[`design/inspiration/01-input.png`](./inspiration/01-input.png) / [`02-liveness-sdk.png`](./inspiration/02-liveness-sdk.png) / [`03-verified.png`](./inspiration/03-verified.png)）作 layout / 字段 / 交互参照；**图 2 由阿里云 SDK 全屏接管，不画**，仅作 SDK 行为参考                |
| 视觉前置 | **复用 onboarding + login v2 + my-profile + account-settings-shell + delete-cancel + device-management mockup PHASE 2 已 establish 的 token**（含 `modal-overlay` / `boxShadow.card / cta` / brand / accent / err 系 / surface-sunken）；本 spec 期望 **0 新增 token**                                        |
| PHASE 1  | 已 ship（PR #88）：spec 三件套 doc-only；占位 page 4 边界声明；GB 11643 schema / hook / usecase 等业务流 — 都不依赖 mockup 即可 impl                                                                                                                                                                          |
| PHASE 2  | 本 mockup 决定：录入页 form 输入框风格（underline 底线 vs border）/ 「下一步」按钮 disabled 与 enabled 强调度 / 协议链接 token / 错误文案位置（banner vs input 下方）/ ReadonlyView 头像 placeholder + 用户名 mask + label-value 卡片排版 / PendingView spinner 大小 / FrozenView 复用既有 freeze modal style |

---

## Prompt（拷贝粘到 claude.ai/design）

```text
请为「realname-verification UI」（实名认证 — 录入身份信息 → 跳活体 SDK → 回到 readonly 已认证视图）设计 mockup，技术栈 = React Native + NativeWind v4 + Tailwind。

# 业务上下文

「不虚此生」app 账号中心的「实名认证」流程 — 用户在「设置 → 账号与安全 → 实名认证」入口录入真实姓名 + 身份证号 + 勾选授权协议 → 提交后跳阿里云实人认证 SDK 完成活体 → 回到 app 轮询查公安比对结果 → 状态 = VERIFIED 后显示已认证 readonly 视图（一经绑定不可解绑）。

**单路由多状态**：所有视觉单元都在同一路由 `(app)/settings/account-security/realname/index.tsx` 内，按 GET /me 返回的状态切换 view（**不**跳子路由）。完整状态机：

LOADING → UNVERIFIED → submit → PENDING → SDK 完成 → 轮询 → VERIFIED（终态，不可解绑）/ FAILED（可重试回 UNVERIFIED）；FROZEN 由 AuthStore.status 前置拦截，不调 GET /me。

4 个视觉单元 + 1 个由 SDK 接管（不画）：

1. **InputForm**（图 1 风格，对应 UNVERIFIED + FAILED 双态）：
   - Stack header `'实名认证'` + 返回箭头 `<`（由 Expo Router 默认提供，本 mockup **不画 header**）
   - 顶部说明文案 2 段（ink-muted 灰中字）：
     - 段 1: `'实名认证信息一经绑定，不支持解绑，平台将依据隐私政策对您的实名认证信息进行严格保密'`（部分关键短语**加粗** ink-strong：「一经绑定，不支持解绑」/「严格保密」）
     - 段 2: `'完成实名认证可开通提现、达人入驻等功能或服务，也可找回您的账号或验证您账号的安全性'`（"达人入驻"是合并词，**不要**写成"音乐人入驻、达人认证"）
   - Form 字段（label 左 / input 右 横排，per 图 1）：
     - `真实姓名` label + `请填写真实姓名` placeholder
     - `证件号码` label + `请填写真实证件号码` placeholder（keyboardType numeric）
   - 协议复选框 row：`☐ 我已阅读并同意《实名认证服务个人信息处理授权协议》`（协议名称 brand-500 underline 强调）
   - 底部 CTA：`下一步`（默认 disabled / 协议未勾选 + form invalid → 浅色弱态；form valid + 协议勾选 → enabled 强态）
   - **FAILED 态附加**：form 上方 ErrorRow 显示错误文案（如 "姓名与身份证号不一致，请检查" / "人脸识别未通过，请重试" / "重试次数已达上限，请稍后再试"），form 输入保留用户上次提交值
   - **不画**「非中国大陆二代身份证」入口（v1 仅大陆二代证）
2. **PendingView**（等待 SDK + 服务端轮询）：
   - 中央显式 indicator（spinner 中等大小）
   - 大字标题 `正在验证身份信息...`（ink semibold）
   - 副文案 `请稍候，最多需要 30 秒`（ink-muted 小字）
   - 不需要可点击元素（用户等待中）；超时（30s）自动转 FAILED + 错误文案"等待超时，请重试"
3. **ReadonlyView**（图 3 风格，对应 VERIFIED 终态）：
   - Stack header `'实名认证'` + 返回箭头 `<`（同上由 _layout 默认提供）
   - 大字居中标题 `已认证实名信息`（顶部 padding 大间距）
   - 默认头像 placeholder（圆形约 64×64，浅色 bg + 中央通用人形 icon stroke outline）
   - 用户名 mask 文字（如 `z***d`，标题下方居中，ink medium）
   - mask 信息卡片（surface-sunken 或 line-soft 浅灰底，圆角 lg，内部 2 行 label-value）：
     - 第 1 行：label `真实姓名`（左对齐 ink-muted） · value `*磊`（右对齐 ink）
     - 第 2 行：label `证件号码`（左对齐 ink-muted） · value `3**************3`（右对齐 ink mono）
   - **不画**任何修改 / 解绑 / 重新认证按钮（per spec FR-015 不可解绑）
4. **FrozenView**（FROZEN 错误，user 在注销冻结期进入此页）：
   - 中央错误 icon（warn 黄系 / err-soft 红软系）
   - 大字 `账号处于注销冻结期`
   - 副文案 `请先撤销注销才能完成实名认证`（ink-muted）
   - CTA `去撤销注销`（brand fill primary，tap 跳 cancel-deletion 路由）
5. **图 2 SDK 全屏页**（**不画**）：阿里云实人认证 SDK 全屏接管的活体检测页 — 圆形相机预览 + 「保持面部在框内」overlay + 「请正对手机屏幕」底部文案。**这页不在我们 UI 责任范围**，仅作 SDK 行为参考；用户参考截图见 `inspiration/02-liveness-sdk.png`。

4 个视觉单元的核心 UI 决策点：

- form 输入框风格（mirror 既有 onboarding / login DisplayNameInput 风格 — underline 底线 vs border 框；图 1 看起来是 underline 风格）
- 「下一步」CTA disabled 视觉（mirror onboarding PrimaryButton drift accepted = bg-brand-300，默认低强度态；vs 图 1 的浅粉色，候选 brand-soft 系）
- 「下一步」CTA enabled 视觉（brand fill 蓝绿系强态 vs accent 系强态 — 与"提交去活体"语义对齐）
- 协议链接强调度（《实名认证...授权协议》— brand-500 underline vs ink underline only — 截图风格倾向 brand 强调）
- ErrorRow 位置（form 上方独立 banner row vs input 下方红字 inline；mirror onboarding ErrorRow 复用既有 @nvy/ui 组件）
- ReadonlyView 头像 placeholder（图 3 是浅粉色圆形 + 中性人形 icon — 候选 token：`accent-soft` bg + `ink-muted` icon；vs `brand-soft` 蓝绿系）
- ReadonlyView 用户名 mask 文字大小（图 3 看 base 或 text-lg，居中）
- ReadonlyView mask 卡片背景（图 3 浅灰底 — 候选 `surface-sunken` 或 `line-soft` 浅灰系）
- ReadonlyView label-value 排版（label 左 / value 右；与 device-management detail 卡片风格协调还是独立）
- ReadonlyView 证件号 mask 字体（mono `font-mono` vs sans `font-sans`；mono 更易读 18 位）
- PendingView spinner 大小（@nvy/ui Spinner 既有 size=12 / 15，候选 size=24 居中突出）
- FrozenView 视觉与既有 delete-cancel mockup 的 freeze modal 协调（同 destructive 警告语义；可复用类似 layout）

# NEGATIVE CONSTRAINTS（硬约束，禁止）

- NO HTML elements（<div> / <span> / <input> / <button>）
- NO inline style={{...}}
- NO CSS variables in style
- NO @keyframes / CSS animation
- NO style attribute outside reanimated 复合 props

# POSITIVE REQUIREMENTS（必须）

- 用 React Native 组件（View / Text / Pressable / TextInput / ScrollView / SafeAreaView）
- 视觉走 NativeWind className（bg-* / text-* / p-* / m-* / rounded-* / border-*）
- 任何动画（若需要）用 react-native-reanimated v3 hooks
- Token 命名采用语义化（ink / line / surface / accent / brand / ok / warn / err 等），非通用 text-* / border-*
- 头像 placeholder + 错误 icon 用 react-native-svg 内联 path（mirror 既有 (tabs)/_layout.tsx IconHome / IconUser 同款）

# 页面结构（项目特定）

## Page 1 — InputForm（UNVERIFIED + FAILED）

Stack header 标题 = `'实名认证'`；返回箭头 `<` 在左 — Stack header 由 Expo Router 默认提供，本 mockup **不画 header**。

### 内容布局（自上而下，单 column，vertical scroll）

**说明文案段**（顶部，紧贴 header 下方，px-md py-sm）：
- 段 1（ink-muted 中字 leading-relaxed，关键短语 ink-strong + font-medium 加粗）：
  - 完整文案 `'实名认证信息一经绑定，不支持解绑，平台将依据隐私政策对您的实名认证信息进行严格保密'`
  - 加粗子串：「一经绑定，不支持解绑」/「严格保密」
- 段 2（ink-muted 中字 leading-relaxed）：
  - 完整文案 `'完成实名认证可开通提现、达人入驻等功能或服务，也可找回您的账号或验证您账号的安全性'`

**Form 段**（说明下方，py-lg 上下间距）：
- 真实姓名 row（label `真实姓名` ink-strong font-medium 左 + 横排 input 右；input 占位 `请填写真实姓名` line-strong 灰；value 输入 ink；底部 hairline divider line-soft）
- 证件号码 row（label `证件号码` ink-strong font-medium 左 + input 右；占位 `请填写真实证件号码` line-strong；value 输入 ink + 候选 font-mono 等宽便于读 18 位；底部 hairline divider）

**FAILED 态错误展示**（form 上方独立 ErrorRow row，仅 status=FAILED 时渲染）：
- ErrorRow @nvy/ui 复用（err-soft bg + err text + alert icon left）
- 4 种文案（按 failedReason 分支）：
  - `'姓名与身份证号不一致，请检查'`（NAME_ID_MISMATCH）
  - `'人脸识别未通过，请重试'`（LIVENESS_FAILED）
  - `'已取消，可重新提交'`（USER_CANCELED）
  - `'重试次数已达上限，请稍后再试'`（RATE_LIMIT_EXCEEDED）

**协议复选框 row**（form 下方，px-md py-md，左对齐）：
- 圆形复选框 ☐（unchecked：line-strong border + transparent bg；checked：brand-500 fill + 白色勾√）
- 文案 `'我已阅读并同意《实名认证服务个人信息处理授权协议》'`（ink-muted 中字；协议名称 `《实名认证服务个人信息处理授权协议》` brand-500 underline tap pressable —— 但 tap 协议名暂不跳转，留 plan UI 段填法务定稿后路由）

**「下一步」CTA**（协议下方，px-md mt-md，full-width）：
- disabled 态（form invalid 或协议未勾选）：浅色弱态（候选 `bg-brand-300` mirror onboarding drift accepted；或 brand-soft bg + ink-muted text）
- enabled 态：brand fill 强态（`bg-brand-500 text-white` mirror onboarding PrimaryButton enabled）
- submitting 态（POST /verifications in-flight）：spinner + 文案 `提交中...` + 不可点击

### 状态变体（InputForm page）

| 状态 | 描述 |
|---|---|
| `unverified-empty` | UNVERIFIED 空 form：所有 input 占位灰；协议未勾选；CTA disabled 弱态；无 ErrorRow |
| `unverified-can-submit` | UNVERIFIED 填好可提交：input 含 placeholder 数据（`张三` / `110101199001011237`）；协议勾选 √；CTA enabled 强态 |
| `unverified-submitting` | submit POST in-flight：CTA busy（spinner + `提交中...`）；input 不可编辑 opacity-60 |
| `failed-name-id-mismatch` | FAILED form 上方 ErrorRow `'姓名与身份证号不一致，请检查'`；input 保留用户上次输入；协议保留勾选 |
| `failed-rate-limit` | FAILED + ErrorRow `'重试次数已达上限，请稍后再试'`；CTA disabled |

### 关键视觉决策（本 mockup 输出）

- 输入框风格：underline 底线（hairline divider line-soft）vs border（border line-strong rounded-md）— mockup 决（截图风格倾向 underline）
- label 字号 / 字重（截图看 ink-strong + font-medium）
- 协议复选框圆 vs 方（截图看圆形）
- CTA disabled 态颜色（图 1 浅粉色 — 候选 brand-soft / brand-300 / accent-soft）
- ErrorRow tone（复用 @nvy/ui ErrorRow 既有 err-soft 风格）

## Page 2 — PendingView（等待 SDK + 轮询）

Stack header 标题 = `'实名认证'`（同上由 _layout 默认提供）。

### 内容布局（自上而下，单 column，居中）

**Spinner**（页面中央偏上，size 24+）：
- @nvy/ui Spinner 既有 size=12 / 15 候选；本页推荐 size=24 居中突出
- brand-500 stroke

**大字标题**（spinner 下方 mt-lg）：
- `正在验证身份信息...`（ink-strong font-semibold text-lg）

**副文案**（标题下方 mt-sm，ink-muted text-sm，居中）：
- `请稍候，最多需要 30 秒`

### 状态变体（PendingView page）

| 状态 | 描述 |
|---|---|
| `pending-waiting` | spinner + 大字 + 副文案；唯一态 |

### 关键视觉决策（本 mockup 输出）

- spinner 大小（24 vs 32）
- 整页 vertical 居中 vs 顶部偏上 layout

## Page 3 — ReadonlyView（VERIFIED 终态）

Stack header 标题 = `'实名认证'`（同上）。

### 内容布局（自上而下，单 column，居中）

**大字标题**（顶部 mt-2xl 大间距居中）：
- `已认证实名信息`（ink-strong font-semibold text-xl）

**头像 placeholder**（标题下方 mt-xl 居中）：
- 圆形 64×64 浅色 bg（候选 `accent-soft` 浅红粉 mirror 截图，或 `brand-soft`）
- 中央 IconUser stroke outline（mirror (tabs)/_layout.tsx IconUser 同款 24×24，stroke ink-muted）

**用户名 mask 文字**（头像下方 mt-md 居中）：
- ink-strong font-medium text-base
- 形如 `z***d`（前后各保留 1 字符，中间 3 个 `*`）

**mask 信息卡片**（用户名下方 mt-xl，px-md，rounded-lg）：
- 卡片 bg：`surface-sunken` 浅灰底（mirror 截图风格 vs `line-soft`）
- 内部 padding lg
- 2 行 label-value（label 左 ink-muted text-sm + value 右 ink text-base，每行底部 hairline divider 除最后一行）：
  - `真实姓名` · `*磊`
  - `证件号码` · `3**************3`（候选 font-mono 等宽便于阅读 18 位）

### 状态变体（ReadonlyView page）

| 状态 | 描述 |
|---|---|
| `verified-readonly` | 标题 + 头像 + 用户名 + mask 卡片；无任何 destructive / edit 按钮（唯一态） |

### 关键视觉决策（本 mockup 输出）

- 头像 placeholder bg token（`accent-soft` 浅粉 vs `brand-soft` vs 独立 `avatar-placeholder-bg`；本 spec 期望复用 `accent-soft`）
- 卡片 bg token（`surface-sunken` 浅灰 vs `line-soft` vs 独立 `mask-card-bg`；本 spec 期望复用 `surface-sunken`）
- mask 字体（mono vs sans）
- 整页 vertical layout（居中 vs 顶部偏上）

## Page 4 — FrozenView（FROZEN 错误页）

Stack header 标题 = `'实名认证'`（同上）。

### 内容布局（自上而下，单 column，居中）

**Warning icon**（顶部 mt-2xl 居中，56×56）：
- IconAlert stroke outline（warn 黄系 / err-soft 红软系；mirror 既有 ErrorRow alert icon 风格）

**大字标题**（icon 下方 mt-lg）：
- `账号处于注销冻结期`（ink-strong font-semibold text-lg 居中）

**副文案**（标题下方 mt-sm）：
- `请先撤销注销才能完成实名认证`（ink-muted text-sm 居中）

**CTA**（副文案下方 mt-xl，px-md full-width）：
- `去撤销注销` brand fill primary（mirror onboarding PrimaryButton enabled）
- tap → router.push `/settings/account-security/delete-account`（既有 spec C 路由，已 ship）

### 状态变体（FrozenView page）

| 状态 | 描述 |
|---|---|
| `frozen-error` | warning icon + 大字 + 副文案 + 「去撤销注销」CTA（唯一态）|

### 关键视觉决策（本 mockup 输出）

- icon tone（warn 黄系警告 vs err-soft 红软系拒绝 — 注销冻结是 user 主动行为非 destructive，倾向 warn 系）
- 与 delete-cancel mockup 的 freeze modal 视觉协调（同 FROZEN 状态信号源，layout 风格一致）

# 状态变体 illustrate

请用 RealnameScreenPreview.tsx 横排 illustrate 以下状态：

| 状态 | 描述 |
|---|---|
| `loading` | splash / skeleton（GET /me in-flight）|
| `unverified-empty` | 空 form + CTA disabled 弱态 |
| `unverified-can-submit` | 填好 form + 协议勾选 + CTA enabled 强态 |
| `pending-waiting` | spinner + 大字 + 副文案 |
| `failed-name-id-mismatch` | InputForm + 顶部 ErrorRow `'姓名与身份证号不一致...'` + form 保留输入 |
| `verified-readonly` | 标题 + 头像 + 用户名 mask + 卡片 mask |
| `frozen-error` | warning icon + `账号处于注销冻结期` + CTA `去撤销注销` |

# DO NOT INCLUDE（项目特定负向，per spec.md FR / SC）

- ❌ **不重画 account-security/index list / settings/index list**（spec B account-settings-shell 已 ship）；本 mockup **不画 entry 入口行**，从「账号与安全 → 实名认证」tap 跳转动作不需可视化
- ❌ **不重画其他 disabled rows**（"第三方账号绑定" / "登录设备与授权管理" / "安全小知识" 等）— 各自独立 spec
- ❌ **不画底 tab bar**（settings 路由组在 (tabs)/ 之外，Expo Router 自动隐藏）
- ❌ **不画图 2 阿里云活体 SDK 页**（圆形相机 + 「保持面部在框内」/ 「请正对手机屏幕」）— 阿里云 SDK 全屏接管，不在我们 UI 责任范围
- ❌ **不画「非中国大陆二代身份证」入口** —— v1 仅大陆二代证（per CL-001 / 用户红字标注 1）
- ❌ **不画修改 / 解绑 / 重新认证按钮** —— VERIFIED 终态不可逆 / 不可解绑（per spec FR-015 + SC-002）
- ❌ raw 真实姓名 / 身份证号字符串展示（仅 mask 形态：`*磊` / `3**************3`；server FR-008 mask 字段直接消费）
- ❌ OCR 拍照上传身份证入口（永不规划，per spec OoS）
- ❌ 二要素纯文本无活体方案（拒绝，per CL-004 v1 即三要素 + 实人活体）
- ❌ 后台管理员核身改名 UI（M2+ 单独 admin spec）
- ❌ 提现 / 达人入驻等下游 gate 视觉（per spec OoS，M2+ 接入 mbw-billing）
- ❌ 协议《实名认证服务个人信息处理授权协议》详情页（M3 法务定稿，本 mockup 仅画 inline 链接占位 + brand 强调）
- ❌ "音乐人入驻、达人认证" 旧文案（per 用户红字标注 2，**改为「达人入驻」单一合并词**；mockup 严格按新文案）
- ❌ 用户头像真实图片（仅默认 placeholder 圆形 + 通用人形 icon）
- ❌ 实名状态徽章（"已实名"/"未实名" tag 在「我的」页 / 主 nav）— M2+ 单独评估
- ❌ 错误恢复"重试"按钮独立 row（form 保留输入 + 用户改输入即可重试，CTA 自然 enable）
- ❌ "联系客服" / 工单入口（M2 起补管理员后台核身工单，本期不画）
- ❌ 主题切换 / dark mode 变体（M1 仅 light；dark 后续 spec）
- ❌ 任何账号 / 个人 / 真实数据（全部用 placeholder：`'张三'` / `'110101199001011237'` / `'*磊'` / `'3**************3'` / `'z***d'`）

# 视觉语言（mirror onboarding + login + delete-cancel + device-management mockup，期望 0 新 token）

请复用 device-management mockup PHASE 2 已 establish 的 design tokens（onboarding base + login v2 + my-profile + account-settings-shell + delete-cancel + device-management 累积；本 spec 期望 **0 新增 token**）：

- Brand：`brand-{50..900}` + `brand-soft`
- Accent：`accent`（DEFAULT + soft）
- Text：`ink`（DEFAULT + strong + muted + subtle）
- Border：`line`（DEFAULT + strong + soft）
- Surface：`surface`（DEFAULT + alt + sunken）
- Feedback：`ok / warn / err`（each + soft）— **ErrorRow 用 `err-soft` bg + `err` text**；**FrozenView icon** 候选 `warn`（注销冻结非 destructive，仅警告）
- Spacing：`xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)`
- Radius：`xs(4) / sm(8) / md(12) / lg(16) / full`
- FontFamily：`sans (Inter + Noto Sans SC + PingFang)` + `mono (优先 SF Mono / Menlo)` (mask 数字候选)
- BoxShadow：`card / cta`
- Modal / Overlay：`modal-overlay`（既有，本 spec 不消费 — 无 modal / sheet）

预期**不应**新增 token。如果生成时坚持需要新 token，请在 RealnameScreenPreview.tsx 顶部注释列出 + 解释为何不能复用既有 token。**严禁**新增以下 token（视觉相符既有可用）：
- 头像 placeholder bg → 复用 `accent-soft`（与图 3 浅粉相符）
- mask 卡片 bg → 复用 `surface-sunken` 或 `line-soft`
- 协议链接 color → 复用 `brand-500` + className `underline`
- CTA disabled 态 → 复用 `bg-brand-300` mirror onboarding PrimaryButton drift accepted

**禁止新增** photo blur / hero overlay 类视觉（本 spec 无 hero 沉浸式背景，无需对应 token）；my-profile mockup 引入的 `hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` 在本 mockup **不消费**。

# DELIVERABLES（输出单 bundle）

- `RealnameInputForm.tsx`（图 1 录入页 — 接受 status: 'unverified' | 'failed' + failedReason prop 切多态）
- `RealnamePendingView.tsx`（等待页 — 单态）
- `RealnameReadonlyView.tsx`（图 3 已认证 readonly 页 — 单态）
- `RealnameFrozenView.tsx`（冻结期错误页 — 单态）
- `RealnameScreenPreview.tsx` 7 状态横排预览（per "状态变体 illustrate" 表）
- `IOSFrame.tsx` iOS 设备外框（沿用 onboarding / my-profile / account-settings-shell / delete-cancel / device-management 同款）
- `tailwind.config.js` 含全部 token 定义（复用 device-management mockup PHASE 2 base，**0 新增**；如有违反请高亮标注 + 注释解释）
- `assets/`（默认无 — 本 mockup 全部纯文本 / form / 卡片）
- `CLAUDE-DESIGN-BUNDLE-README.md`（Claude Design 自带）

请生成 mockup。
```

---

## 拿到 bundle 后（下次 session 翻译期 — PHASE 2 PR）

1. 解压到 `apps/native/spec/realname/design/source/`（遵循 onboarding / my-profile / account-settings-shell / delete-cancel / device-management 同款结构）
2. 写 `apps/native/spec/realname/design/handoff.md`（7 段，per `<meta>/docs/experience/claude-design-handoff.md` § 5）：
   - Bundle 内容速览
   - 组件 breakdown（`<RealnameInputForm>` / `<RealnameReadonlyView>` / `<RealnamePendingView>` / `<RealnameFrozenView>` / `<AvatarPlaceholder>` / `<MaskCard>` 抽 packages/ui 还是 inline — 跨 spec 复用度评估；参考 onboarding / device-management 0 抽 packages/ui 先例，倾向 inline 单文件多态）
   - 状态机覆盖（mockup 7 状态 ↔ spec FR / SC 对齐）
   - Token 决策记录（复用清单 + 验证 0 新增 token；如确实新增了请说明为何不能复用）
   - 翻译期注意点（5 条 gotcha audit，per § 5.1）：尤其 form 输入保留语义（FAILED 重试时 input 保留用户上次输入，per spec User Story 3 acceptance 1-3）/ 协议链接 tap 暂不跳转（plan UI 段写 TODO 法务定稿后再决定路由）/ mask 字段直接消费后端响应（per spec FR-006，**不**自行 mask）/ FROZEN 由 AuthStore 前置拦截不调 GET /me（per spec SC-003）/ status='UNVERIFIED' 与 'FAILED' 共享 InputForm 但 FAILED 多 ErrorRow + 保留输入
   - Drift 政策（代码 > mockup）
   - 引用
3. **T_mock**：bundle 落盘 + handoff.md 完成 ✅
4. **T9**：bundle 落盘（user 跑 Claude Design 完成）
5. **T10**：handoff.md 落盘 + plan.md UI 段从"占位版（pending mockup）"回填为完整版（参考 onboarding plan.md PHASE 2 后的 UI 段格式 — 区域分块 / 状态视觉转移 / Token 映射 / 复用 packages/ui 组件清单 / a11y 落点）
6. **T11**：UI 完成 impl + 替换占位 — 改 `realname/index.tsx`（PHASE 1 ship 的占位 page）：
   - 替换占位 `<View>` / `<Text>` 为 NativeWind className 视觉实现
   - 复用 `packages/ui` 组件（如 ErrorRow / Spinner / PrimaryButton 等，per handoff 决策）
   - 加 a11y props（accessibilityLabel / accessibilityHint / accessibilityRole / accessibilityState）
   - 删 PHASE 1 banner 注释
   - 既有 vitest test 0 regression（视觉不影响行为）
7. tasks.md 末尾"实施记录"段：T_mock / T9 / T10 / T11 标 ✅ + PR # / commit ref

---

## References

- [`../spec.md`](../spec.md) — FR-001..FR-016 + SC-001..SC-007 + 8 个 CL（业务规则 + UI 流 + GB 11643 校验 + mask 显示 / 占位 4 边界）
- [`../plan.md`](../plan.md) § UI 结构（占位版） — 业务流 + 状态机 + 错误映射 + 复用代码 + RN Web 兼容点
- [`../tasks.md`](../tasks.md) T9-T11 — PHASE 2 mockup translate / UI Impl 入口
- [`../../device-management/design/mockup-prompt.md`](../../device-management/design/mockup-prompt.md) — 模板基线（最近 ship，token 集最全）
- [`../../delete-account-cancel-deletion-ui/design/source/`](../../delete-account-cancel-deletion-ui/design/source/) — token 系统 baseline（含 freeze modal style，FrozenView 协调参考）
- [`../../onboarding/design/source/`](../../onboarding/design/source/) — form 类 1 标准 UI baseline（input + CTA 风格继承）
- [`../../my-profile/design/source/`](../../my-profile/design/source/) — Stack header 风格 + IconUser SVG 风格 baseline（ReadonlyView 头像 placeholder 参考）
- [`./inspiration/01-input.png`](./inspiration/01-input.png) / [`./inspiration/02-liveness-sdk.png`](./inspiration/02-liveness-sdk.png) / [`./inspiration/03-verified.png`](./inspiration/03-verified.png) — 用户提供的 3 张 IA 锚截图（来源：用户业务 mockup 设计稿，仅作 layout / 字段 / 交互参照；图 2 SDK 页不画）
- [PRD § 5.10 实名认证（M1.X 引入）](../../../../docs/requirement/account-center.v2.md#510-实名认证m1x-引入)
- [my-beloved-server PR #149](https://github.com/xiaocaishen-michael/my-beloved-server/pull/149) — server 配套 spec（contracts 源头）
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)（本 spec 走类 1 标准 UI 流程）
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook
