# Device Management UI mockup — Claude Design prompt

> 拿下文 prompt 全文（从 `## Prompt(拷贝)` 段以下的 ` ```text ... ``` ` 块内）粘到 [claude.ai/design](https://claude.ai/design)。运行后，把 mockup bundle 落到 `apps/native/specs/account/device-management/design/source/`，下次 session 进入翻译期（PHASE 3 PR — T_mock / T13 / T14 / T15 / T16）。
>
> 模板基于 `<meta>/docs/experience/claude-design-handoff.md` § 2.1 + § 2.1b，沿用 [`../../delete-account-cancel-deletion-ui/design/mockup-prompt.md`](../../delete-account-cancel-deletion-ui/design/mockup-prompt.md) 的结构，针对 device-management 的项目特定约束（per ADR-0017 类 2 变体 + spec.md FR-001..FR-018 + 用户提供 3 张截图作 IA 锚）定制。

---

## 设计上下文（仅 user 看，不放进 Claude Design prompt）

| 项       | 值                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面     | 3 视觉单元：`login-management/index`（list 页）/ `login-management/[id]`（detail 页）/ `RemoveDeviceSheet`（移除确认 bottom sheet）                                                                                                                                                                                                                         |
| 路由     | `(app)/settings/account-security/login-management/{index,[id]}.tsx`（spec B account-security shell 已 ship 入口 row；本 spec 把 `登录设备与授权管理` row 改名 `登录管理` + 启用 + onPress）                                                                                                                                                                 |
| 业务流   | 设置 → 账号与安全 → 登录管理（list）→ tap 单条 → 详情（4 字段 + 移除 CTA）→ tap 移除 → bottom sheet 二次确认 → 移除（DELETE）+ 自动 refetch list 回 list；本机条目详情**无**移除按钮                                                                                                                                                                        |
| IA 锚    | 用户提供 3 张参考截图（`design/inspiration/01-list.png` / `02-detail.png` / `03-sheet.png`）作 layout / 字段 / 交互参照                                                                                                                                                                                                                                     |
| 视觉前置 | **复用 login v2 + my-profile + account-settings-shell + delete-cancel mockup PHASE 2 已 establish 的 token**（含 `modal-overlay` / `boxShadow.card / cta` / brand / accent / err 系）；本 spec 仅可能加 1-2 个 device-management 专属 token（本机徽标 + sheet handle 视觉）                                                                                 |
| PHASE 1  | 本 spec **不走类 1 占位 UI 先行**（per ADR-0017 类 2 变体）— mockup 输入是 spec.md + 3 张截图，直接进 PHASE 2 mockup design                                                                                                                                                                                                                                 |
| PHASE 2  | 本 mockup 决定：list 卡片视觉 / 设备图标 SVG（PHONE / TABLET / DESKTOP / WEB / UNKNOWN 5 形态）/ 「本机」徽标视觉 / 「更多设备 >」分页 cta 视觉 / detail 字段排版（label + value 上下结构 vs sunken 卡片）/ 移除按钮 destructive 强调度 / bottom sheet overlay+card+button 视觉（取消 secondary / 移除 destructive primary / 右上 ✕ 关闭）/ 错误展示位 tone |

---

## Prompt（拷贝粘到 claude.ai/design）

```text
请为「device-management UI」（登录管理 — 列出当前账号已登录设备 + 详情 + 单设备移除确认）设计 mockup，技术栈 = React Native + NativeWind v4 + Tailwind。

# 业务上下文

「不虚此生」app 账号中心的「登录管理」流程 — 用户查看自己当前账号在哪些设备登录过，并可远程移除非本机设备。3 个视觉单元构成完整流：

1. **login-management/index**：登录管理 list 页（authenticated 路径，从「设置 → 账号与安全 → 登录管理」tap 进入）
   - 顶部副标题"已登录的设备 N"
   - Card 列表：每条 = 设备图标 + 设备名 + 「本机」徽标（仅当前设备显示）+ 最近活跃时间（YYYY.MM.DD HH:mm，分钟级）+ 登录地点（中文省市，如"上海"，可能 null → "—"）+ 右 chevron
   - 默认显示前 10 条；items.length < totalElements 时末尾 inline cta「更多设备 >」，tap 后 fetch page+1 + 合并
   - tap 单条 → push detail 页（含本机条目）
2. **login-management/[id]**：登录设备详情 page（authenticated 路径）
   - 4 个 label-value 字段：设备名称 / 登录地点 / 登录方式 / 最近活跃（精确到秒 YYYY.MM.DD HH:mm:ss）
   - 底部全宽「移除该设备」CTA（destructive 强调）— **本机条目隐藏此按钮**
   - tap 移除 → 弹起 bottom sheet（不立即调 DELETE）
3. **RemoveDeviceSheet**：移除确认 bottom sheet
   - 标题「移除设备」
   - 描述「移除设备后，该设备再次登录需要重新安全验证」
   - 双 button：取消（secondary，白底 border）/ 移除（destructive primary，红底 fill）
   - 右上 ✕ 关闭按钮（与「取消」等价，不立即 dismiss 时长按 / outside tap 关闭由实现决定）
   - tap 取消 / ✕ → 关 sheet + 留详情页
   - tap 移除 → loading 状态（button busy）→ 成功后关 sheet + router.back + list 自动 refetch；失败则 ErrorRow in sheet 等用户重试

3 个视觉单元的核心 UI 决策点：
- 设备图标 SVG 风格（5 形态：PHONE / TABLET / DESKTOP / WEB / UNKNOWN；mirror 既有 (tabs)/_layout.tsx 的 IconHome / IconUser 走 stroke outline 风格 — focused 时 fill，但 list 不需要 focused 态）
- 「本机」徽标视觉（截图为红色边框圆角小标签内置「本机」中文 — 用什么 token？brand-soft 蓝绿系？accent？err-soft 红系？— 强调度需要 *显眼但不抢戏*，用户能一眼分辨"我现在用的设备"，但不应让本机条目压过其他条目）
- list 卡片视觉（白底 surface 圆角 card，多条之间用 hairline divider；卡片整体阴影深度沿用 boxShadow.card）
- list 末尾「更多设备 >」cta 视觉（inline 链接形态贴截图：居中 ink-muted 文字 + 右 chevron；vs 标准 button — mockup 决定。截图风格倾向 inline 链接）
- detail 页字段排版（截图风格：label 灰小字 + value 大字，上下结构，4 字段同卡片内 divider 分隔；vs 4 个独立 card）
- 移除按钮 destructive 强调度（启用态：err 红 fill 强调，与"危险移除"语义对齐；disabled 态：surface-sunken 灰底，本机条目根本不显示按钮，所以不需要 disabled-本机 状态）
- bottom sheet 整体风格：是否有顶部拖拽 handle（@gorhom 风格 vs 静态弹出无 handle）/ overlay scrim 颜色透明度（复用既有 modal-overlay token）/ card 圆角（仅顶部圆角 vs 全圆角）/ 右上 ✕ icon 视觉
- 错误展示位 ErrorRow tone（list / detail / sheet 三处都可能出错 — 是否统一沿用既有 ErrorRow 组件，还是 sheet 内用更紧凑形式）

# NEGATIVE CONSTRAINTS（硬约束，禁止）

- NO HTML elements（<div> / <span> / <input> / <button>）
- NO inline style={{...}}
- NO CSS variables in style
- NO @keyframes / CSS animation
- NO style attribute outside reanimated 复合 props

# POSITIVE REQUIREMENTS（必须）

- 用 React Native 组件（View / Text / Pressable / ScrollView / FlatList / Modal / SafeAreaView）
- 视觉走 NativeWind className（bg-* / text-* / p-* / m-* / rounded-* / border-*）
- 任何动画（若需要）用 react-native-reanimated v3 hooks
- Token 命名采用语义化（ink / line / surface / accent / brand / ok / warn / err 等），非通用 text-* / border-*
- 设备图标用 react-native-svg 内联 path（mirror 既有 (tabs)/_layout.tsx IconHome / IconUser 同款）

# 页面结构（项目特定）

## Page 1 — login-management/index（登录管理 list）

Stack header 标题 = `'登录管理'`；返回箭头 `<` 在左 — Stack header 由 Expo Router 默认提供，本 mockup **不画 header**（my-profile / account-settings-shell / delete-cancel mockup PHASE 2 同款，header 已由 _layout.tsx 注册）。

### 内容布局（自上而下，单 column，vertical scroll）

**副标题段**（顶部，紧贴 header 下方）：
- `'已登录的设备 {totalElements}'`（per 截图 1，ink-muted 中等灰，左对齐，左 padding md）

**Card 列表**（副标题下，每条 row）：
- 设备图标（左侧，24×24 stroke outline SVG）
- 设备名 + 「本机」徽标（设备名第一行加粗 ink；徽标 inline 紧跟设备名右侧仅当前设备出现）
- 最近活跃时间 + 登录地点（设备名下方第二行，ink-muted 灰小字，"YYYY.MM.DD HH:mm 上海" 拼接，地点 null 时显 "—"）
- 右 chevron `>`（vertical center，line-strong 灰）
- 多条之间用 hairline divider（line-soft 极淡灰）
- 整个 row Pressable，pressed 态 surface-alt 微反馈

**「更多设备 >」cta**（list 末尾，items.length < totalElements 时渲染，per CL-002 决议 inline 链接形态）：
- 居中 ink-muted 文字 + 右 chevron
- tap 后 cta 自身保留、列表追加 page+1 items；items >= totalElements 时 cta 消失

### 设备图标 SVG 形态（5 种）

| enum 值 | SVG 语义（mockup 输出） |
|---|---|
| `PHONE` | 手机 outline（细长矩形 + home indicator 圆点；截图 1 第一行 MK-iPhone 风格） |
| `TABLET` | 平板 outline（宽矩形 + home indicator） |
| `DESKTOP` / `WEB` | 显示器 outline（矩形屏幕 + 底座；截图 1 第二行 macOS 风格） |
| `UNKNOWN` | 通用设备 outline（圆角矩形 + 中央点）— 兜底 |

### 状态变体（list page）

| 状态 | 描述 |
|---|---|
| `list-loading` | 副标题占位 + Card spinner 居中；不显 cta |
| `list-3-with-current` | 3 条 active devices；最上一条带「本机」徽标；不显 cta |
| `list-paginated-12-of-12` | 列表显 12 条 + cta「更多设备 >」隐藏（已加载完）|
| `list-paginated-10-of-12-with-cta` | 列表显前 10 条 + 末尾「更多设备 >」cta 可点 |
| `list-error` | ErrorRow 显示「网络错误，请重试」+ 重试按钮；副标题不显 |

### 关键视觉决策（本 mockup 输出）

- 「本机」徽标 token + 视觉（红框圆角 vs brand-soft 蓝底 vs accent 强调）
- list card 圆角与阴影深度（沿用 account-settings-shell card 还是更轻量）
- 设备图标 5 形态 SVG path
- 「更多设备 >」cta 与正常 row 的视觉差异（应明显但不抢戏）

## Page 2 — login-management/[id]（登录设备详情）

Stack header 标题 = `'登录设备详情'`；返回箭头 `<` 由 Stack header 默认提供。

### 内容布局（自上而下，单 column）

**4 字段卡片**（顶部，单 card 内 4 行，per 截图 2 风格）：
- 设备名称（label "设备名称" ink-subtle 小字 / value "MK-iPhone" ink 大字 / divider）
- 登录地点（label "登录地点" / value "上海" 或 "—"）
- 登录方式（label "登录方式" / value "快速登录"）— 按 enum 翻译表（PHONE_SMS=快速登录 / GOOGLE=Google 登录 / APPLE=Apple 登录 / WECHAT=微信登录）
- 最近活跃（label "最近活跃" / value "2026.05.07 17:23:48" — **精确到秒**；与 list page 分钟级形成层级差异）

**移除按钮**（4 字段卡片下方，full-width，仅 isCurrent === false 时渲染）：
- 默认态：`'移除该设备'`，destructive 强调（err 红系 fill 或 surface-sunken + err 文字 — mockup 决策）
- in-flight 态：`'移除中...'` + 可选 spinner（实际移除是 sheet 内动作，detail 页此按钮在 sheet 关闭后回归默认态，故不需要 detail 页 in-flight 状态；mockup 仅画默认态）

**本机条目专属 — 移除按钮隐藏**：
- isCurrent === true → 4 字段卡片下方留空白（不渲染移除按钮 placeholder）

### 状态变体（detail page）

| 状态 | 描述 |
|---|---|
| `detail-current-no-remove` | 4 字段（本机数据）+ 无移除按钮（截图 2 上半部分 + 不显示 CTA）|
| `detail-other-with-remove` | 4 字段（其他设备）+ destructive 移除按钮（截图 2 完整态）|

### 关键视觉决策（本 mockup 输出）

- 4 字段排版（label 字号 / value 字号 / divider 间距 / 整 card padding）
- 移除按钮强调度 token（err fill vs err outline vs err-soft + err text）— 与 delete-cancel mockup PHASE 2 的"确认注销"按钮形成视觉**协调**（同 destructive 语义）；可以复用同款 token

## Page 3 — RemoveDeviceSheet（移除确认 bottom sheet）

不是一个独立 page，而是 detail page 上覆盖的 sheet 组件。**Sheet 库选型**（CL-001 待 mockup 决）：
- 候选 (a) `@gorhom/bottom-sheet`（社区主流 + 跨端 + 手势 + spring 动画）
- 候选 (b) RN 内置 `Modal` + bottom-aligned 自定义视觉
- mockup 输出哪种风格 → plan.md UI 段回填库选型决议

### Sheet 内容（per 截图 3）

**overlay**：
- transparent backdrop（复用既有 `modal-overlay` token，深灰半透明 ~40% 黑）
- backdrop 上展示 detail page 内容降低对比度（用户感知"还在 detail 页"）

**card**（底部对齐，仅顶部圆角 vs 全圆角 mockup 决）：
- 整 card 白底 surface
- 内部 padding lg

**右上 ✕ 关闭**（card 右上角，inline icon button）：
- ⊗ icon（Feather x 标准 path）灰色 line-strong
- tap 等价「取消」action

**标题段**（card 顶部居中）：
- `'移除设备'`（ink 大字 semibold，居中）

**描述段**（标题下方）：
- `'移除设备后，该设备再次登录需要重新安全验证'`（ink-muted 中等灰，居中或左对齐 mockup 决，行距宽松 leading-relaxed）

**双 button**（描述下方，左右排列）：
- 左 [取消]：surface 白底 + line-strong border + ink 文字（secondary 视觉，无 fill）
- 右 [移除]：err 红 fill（destructive primary）+ surface-on-err 白文字
- 比例 50/50 或左短右长（截图风格右长更显眼，mockup 决）
- tap 取消 / ✕ → 关 sheet 留详情页
- tap 移除 → button busy（spinner + 文字"移除中..."）+ 不可关闭；成功 → 关 sheet + router.back；失败 → ErrorRow in sheet 顶部 + 保留 sheet 等用户重试

### 状态变体（sheet）

| 状态 | 描述 |
|---|---|
| `sheet-default` | 默认弹出态：标题 + 描述 + 取消 / 移除（截图 3 完整态） |
| `sheet-submitting` | 移除按钮 busy state：spinner + "移除中..." + 取消 disabled |
| `sheet-error` | 顶部 ErrorRow `'网络错误，请重试'` / `'操作太频繁，请稍后再试'` 等；按钮回归默认态 |

### 关键视觉决策（本 mockup 输出）

- sheet 库选型（@gorhom 含手势 vs RN Modal 静态）
- card 圆角（仅顶部 rounded-t-lg vs 全圆角 rounded-lg）
- ✕ 关闭按钮位置（card 右上 inline 在标题同一行 vs card 顶部独立 row）
- 取消 / 移除按钮视觉强度对比（取消 outline / 移除 fill 是行业惯例，截图风格相符）

# 状态变体 illustrate

请用 LoginManagementPreview.tsx 横排 illustrate 以下状态：

| 状态 | 描述 |
|---|---|
| `list-loading` | 副标题占位 + 居中 spinner；无 card row |
| `list-3-with-current` | 3 条 active devices；最上一条 (本机)；无 cta |
| `list-paginated-10-of-12` | 列表显 10 条 + 末尾「更多设备 >」cta 可点 |
| `detail-current-no-remove` | 4 字段（本机数据）+ 无移除按钮 |
| `detail-other-with-remove` | 4 字段 + destructive 移除按钮 |
| `sheet-active` | detail 页底部叠加 sheet（overlay + card + 取消/移除）|

# DO NOT INCLUDE（项目特定负向，per spec.md FR / SC）

- ❌ **不重画 account-security/index list / settings/index list**（spec B account-settings-shell 已 ship）；本 mockup **不画 entry 入口行**，从「账号与安全 → 登录管理」tap 跳转动作不需可视化
- ❌ **不重画其他 disabled rows**（"实名认证" / "第三方账号绑定" / "安全小知识" 等）— 各自独立 spec
- ❌ **不画底 tab bar**（settings 路由组在 (tabs)/ 之外，Expo Router 自动隐藏）
- ❌ **不画 login screen / freeze modal**（已由 spec C delete-cancel mockup PHASE 2 ship）
- ❌ raw IP 字符串展示（per server spec CL-002 决议：list response 仅暴 location 中文省市，不暴 raw ipAddress；mockup 显示"上海"而非"123.45.67.89"）
- ❌ device_id UUID 字符串展示（仅做内部识别，不展示给用户）
- ❌ token_hash / accountId 等敏感字段（隐私 + 反枚举）
- ❌ 「修改设备名称」交互（per Q2 决议 M2+ 单独 spec；本 mockup 不画 edit / pencil icon）
- ❌ 设备图标 photorealistic 风格（用 stroke outline SVG，mirror (tabs)/_layout.tsx 既有图标系统）
- ❌ admin 后台批量操作 / 多选 checkbox（M1 单条移除即可）
- ❌ device fingerprint 详细信息展示（screen 分辨率 / canvas hash / WebGL hash 等）— M3+ 评估
- ❌ 异常登录提醒 / 安全告警 banner（M2+ 单独 spec）
- ❌ 多步骤移除向导（step 1 / 2 / 3 progress bar）— sheet 单步即可
- ❌ "正在使用" 实时绿点动画 / "上次活跃 5 分钟前" 相对时间（M1 用绝对时间）
- ❌ 设备地理位置地图 / 城市坐标（仅文字"上海"够）
- ❌ 二次密码确认 / 二次 SMS 二因子（M1.X phone-sms-auth 无密码；本 spec 不要求二次验证）
- ❌ 移除成功 toast / 撤销移除按钮（移除即时生效不可撤销，sheet 已是二次确认）
- ❌ 主题切换 / dark mode 变体（M1 仅 light；dark 后续 spec）
- ❌ 任何账号 / 个人 / 真实数据（全部用 placeholder：`'MK-iPhone'` / `'macOS'` / `'张磊的 Mate 50'` / `'上海'` / `'2026.05.07 17:23:48'`）

# 视觉语言（mirror account-settings-shell + my-profile + login v2 + delete-cancel mockup，期望最少新 token）

请复用 delete-cancel mockup PHASE 2 已 establish 的 design tokens（login v2 base + my-profile 4 alpha + boxShadow.card/cta + delete-cancel modal-overlay；hero-overlay / white-soft / white-strong / hero-ring 在本 spec **不消费**）：

- Brand：`brand-{50..900}` + `brand-soft`
- Accent：`accent`（DEFAULT + soft）
- Text：`ink`（DEFAULT + muted + subtle）
- Border：`line`（DEFAULT + strong + soft）
- Surface：`surface`（DEFAULT + alt + sunken）
- Feedback：`ok / warn / err`（each + soft）— **destructive 移除按钮 / sheet 移除 button** 用 `err` 系 fill；**本机徽标** 候选 token：`accent` / `brand-soft` / `err-soft`（mockup 决）
- Spacing：`xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)`
- Radius：`xs(4) / sm(8) / md(12) / lg(16) / full`
- FontFamily：`sans (Inter + Noto Sans SC + PingFang)`
- BoxShadow：`card / cta`
- Modal：`modal-overlay`（已由 delete-cancel freeze modal 引入；sheet overlay 直接复用）

预期可能需要新增的 token（如不需要请说明为何复用已有 token 满足）：
- `current-badge-bg` + `current-badge-text`：「本机」徽标背景 / 文字色（候选复用 `accent` / `accent-soft` 或独立专属 token）
- `sheet-handle`（若 mockup 决定 sheet 顶部带拖拽 handle）：handle bar 颜色与尺寸
- `device-icon-stroke`：设备图标默认 stroke 颜色（候选直接用 `ink-muted` 或 `line-strong`，预期不需要专属 token）

如有其他新 token，请在 LoginManagementPreview.tsx 顶部注释列出 + 解释为何不能复用既有 token。

**禁止新增** photo blur / hero overlay 类视觉（本 spec 无 hero 沉浸式背景，无需对应 token）；my-profile mockup 引入的 `hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` 在本 mockup **不消费**。

# DELIVERABLES（输出单 bundle）

- `LoginManagementListScreen.tsx`（list 页）
- `LoginManagementDetailScreen.tsx`（detail 页，接受 isCurrent prop 切两态）
- `RemoveDeviceSheet.tsx`（bottom sheet 组件）
- `DeviceIcon.tsx`（5 形态 SVG icon set：PHONE / TABLET / DESKTOP / WEB / UNKNOWN — mirror (tabs)/_layout.tsx IconHome 风格）
- `LoginManagementPreview.tsx` 6 状态横排预览（per "状态变体 illustrate" 表）
- `IOSFrame.tsx` iOS 设备外框（沿用 my-profile / account-settings-shell / delete-cancel 同款）
- `tailwind.config.js` 含全部 token 定义（复用 delete-cancel mockup PHASE 2 base + 新增 token 高亮标注）
- `assets/`（默认无 — 本 mockup 全部纯列表 / 文本 / sheet）
- `CLAUDE-DESIGN-BUNDLE-README.md`（Claude Design 自带）

请生成 mockup。
```

---

## 拿到 bundle 后（下次 session 翻译期 — PHASE 3 PR）

1. 解压到 `apps/native/specs/account/device-management/design/source/`（遵循 my-profile / account-settings-shell / delete-cancel 同款结构）
2. 写 `apps/native/specs/account/device-management/design/handoff.md`（7 段，per `<meta>/docs/experience/claude-design-handoff.md` § 5）：
   - Bundle 内容速览
   - 组件 breakdown（`<DeviceCard>` / `<CurrentBadge>` / `<DeviceIcon>` / `<DetailFieldRow>` / `<RemoveSheet>` / `<MoreDevicesCta>` 抽 packages/ui 还是 inline — 跨 spec 复用度评估；参考 my-profile / account-settings-shell / delete-cancel 0 抽 packages/ui 先例，倾向 inline）
   - 状态机覆盖（mockup 6 状态 ↔ spec FR / SC 对齐）
   - Token 决策记录（复用清单 + 「本机」徽标 token 选型）
   - 翻译期注意点（5 条 gotcha audit，per § 5.1）：尤其 list/detail 数据流（detail 不调单独 GET，从 list TanStack Query cache 取，per spec FR-003）/ device header 上报中间件（FR-013/14 写在 packages/api-client 中间件，不让每个 wrapper 手填）/ JWT did claim 升级后老 access token 401 强制重 login（spec FR-006）
   - Drift 政策（代码 > mockup）
   - 引用
3. **T_mock**：bundle 落盘 + handoff.md 完成 ✅
4. **T13**：翻译 `login-management/index.tsx` — token-based className + 副标题 + Card 列表 + 设备图标 + 「本机」徽标 + 「更多设备 >」cta + 4 状态（loading / 3 items / 10 of 12 / error）
5. **T14**：翻译 `login-management/[id].tsx` — 4 字段卡片 + 移除按钮（仅 isCurrent=false 显示）destructive 强调 + 2 状态（current-no-remove / other-with-remove）
6. **T15**：实现 `RemoveDeviceSheet`（库选型由 mockup 决定 → 落 plan.md UI 段；@gorhom 装包走 `expo install @gorhom/bottom-sheet` per app CLAUDE.md AI 协作纪律 6）+ 3 状态（default / submitting / error）+ DELETE 调用 + invalidate `['devices']` query
7. **T16**：回填 plan.md UI 段（从 4 边界占位 → 完整 UI 结构 + token 映射）+ tasks.md T11 真后端冒烟（visual smoke，6 状态截图归 `runtime-debug/<date>-device-management-mockup-translation/`）+ T_mock / T13 / T14 / T15 / T16 标 ✅

---

## References

- [`../spec.md`](../spec.md) — FR-001..FR-018 + SC-001..SC-012 + 5 个 CL（业务规则 + UI 流 + 反枚举 / 本机识别 / 字段契约）
- [`../../delete-account-cancel-deletion-ui/design/mockup-prompt.md`](../../delete-account-cancel-deletion-ui/design/mockup-prompt.md) — 模板基线（spec C 同 SDD 链）
- [`../../delete-account-cancel-deletion-ui/design/source/`](../../delete-account-cancel-deletion-ui/design/source/) — token 系统 baseline（modal-overlay / boxShadow / err 系等）
- [`../../account-settings-shell/design/source/`](../../account-settings-shell/design/source/) — settings 路由组卡片 / row 视觉 baseline（card 风格继承）
- [`../../my-profile/design/source/`](../../my-profile/design/source/) — Stack header 风格 + IconUser SVG 风格 baseline
- [`./inspiration/01-list.png`](./inspiration/01-list.png) / [`./inspiration/02-detail.png`](./inspiration/02-detail.png) / [`./inspiration/03-sheet.png`](./inspiration/03-sheet.png) — 用户提供的 3 张 IA 锚截图（来源：用户业务 mockup 设计稿，仅作 layout / 字段 / 交互参照）
- [PRD § 5.4 强制退出其他设备](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/requirement/account-center.v2.md#54-强制退出其他设备)
- [my-beloved-server PR #150](https://github.com/xiaocaishen-michael/my-beloved-server/pull/150) — server 配套 spec（contracts 源头）
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)（本 spec 走类 2 变体）
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook
