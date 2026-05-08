# Feature Specification: Realname Verification UI (实名认证前端)

**Feature Branch**: `feature/real-name-auth`
**Created**: 2026-05-08（per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程）
**Status**: Draft（PHASE 1 Doc：业务流程 + 占位 UI；PHASE 2 mockup 后置）
**Module**: `apps/native/app/(app)/settings/account-security/realname`
**Input**: User description: "实名认证 UI — 三张图：图 1 录入页（真实姓名 + 证件号码 + 协议勾选 + 下一步）→ 图 2 阿里云活体 SDK 全屏接管 → 图 3 已认证 readonly 视图（mask 姓名/证件号）；下次进入直显图 3。v1 仅大陆二代证；删除『非中国大陆二代身份证』入口；文案『音乐人入驻、达人认证』改『达人入驻』。"

> **决策约束**：
>
> - 后端契约见 [server spec/account/realname-verification/spec.md](https://github.com/xiaocaishen-michael/my-beloved-server/tree/main/spec/account/realname-verification)（PR #149 ship）
> - 上游 PRD § 5.10 [account-center.v2](../../../../docs/requirement/account-center.v2.md#510-实名认证m1x-引入)（meta PR #65 ship）
> - **per ADR-0017 类 1 流程**：本 PR 阶段产出 spec/plan/tasks docs + 业务流程 + 占位 UI；视觉决策（精确 px / hex / 阴影 / 字重 / 自定义动画）**不进 spec / plan**，留 PHASE 2 mockup 落地后回填 plan.md UI 段
> - 路由 `apps/native/app/(app)/settings/account-security/realname/` — 在 `(app)` 路由组内，受 AuthGate 保护
> - **图 2 由阿里云 SDK 全屏接管**，不是我们 UI 责任；本 spec 不约束图 2 视觉
> - 当前 `account-security/index.tsx` 第 11 行 `realname:` 项为 disabled 占位；本 spec impl 后转 enabled

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 未实名用户首次完成认证（Priority: P1）

未实名用户从「设置 → 账号与安全 → 实名认证」进入 → 渲染录入页（图 1）→ 输入真实姓名 + 身份证号 + 勾选协议 → 「下一步」enabled → 提交 → 后端 init 阿里云 → 返回 livenessUrl → 跳活体 SDK（图 2，SDK 全屏接管）→ SDK 完成 → 客户端轮询查结果 → 状态=VERIFIED → router.replace 到 readonly（图 3）。

**Why this priority**: 主路径，所有未实名用户首次必经。

**Independent Test**: vitest + msw mock `GET /me` 返 `{status: UNVERIFIED}` + `POST /verifications` 返 `{providerBizId, livenessUrl}` + `GET /verifications/{bizId}` 返 `{status: VERIFIED, realNameMasked, idCardMasked}` → 渲染 realname 页 → fireEvent input + checkbox + 「下一步」→ 断言 SDK 启动调用 + 轮询完成后跳 readonly 视图。

**Acceptance Scenarios**:

1. **Given** UNVERIFIED 用户进入 realname 路由，**When** GET `/me` 返回 `{status: UNVERIFIED}`，**Then** 渲染录入页（form 含真实姓名 input + 身份证号 input + 协议复选框 + 「下一步」按钮 disabled）
2. **Given** 录入页，**When** 用户填合法姓名 "张三" + 测试证件号 `110101199001011237` + 勾选协议，**Then** 「下一步」enabled
3. **Given** 「下一步」enabled，**When** press 提交，**Then** 调 `POST /verifications` → 拿 `{providerBizId, livenessUrl}` → 启动阿里云活体 SDK（per FR-005 SDK 调用契约）
4. **Given** SDK 完成（成功 callback），**When** 客户端轮询 `GET /verifications/{providerBizId}`，**Then** 后端返 VERIFIED → router.replace 到 readonly 视图（图 3，mask 字段填充）

---

### User Story 2 — 已实名用户回访 readonly（Priority: P1，并列）

已认证用户进入 realname 路由 → 直接渲染 readonly 视图（图 3）→ 头像 + 用户名 + mask 姓名 + mask 证件号 → **无录入入口、无活体入口、无编辑/解绑入口**。

**Why this priority**: 主路径；与 PRD § 5.10 不变式 1（一经绑定不可解绑）对齐；防止 UI 层暴露任何"修改"入口。

**Independent Test**: vitest + msw mock `GET /me` 返 `{status: VERIFIED, realNameMasked: "*三", idCardMasked: "1***************7", verifiedAt}` → 渲染 realname 页 → 断言渲染 readonly 视图（含 mask 字段）+ 不渲染 form / 输入框 / 「下一步」按钮 / 任何 destructive 按钮（解绑 / 删除等）。

**Acceptance Scenarios**:

1. **Given** VERIFIED 账号进入 realname 路由，**When** GET `/me` 返回 `{status: VERIFIED, ...}`，**Then** 渲染 readonly 视图：「已认证实名信息」标题 + 默认头像 + 用户名 mask + 卡片含真实姓名 mask + 证件号码 mask
2. **Given** readonly 视图，**Then** **不存在**任何 input / button 触发修改 / 解绑 / 重新认证；仅 header 返回箭头可用
3. **Given** 同 VERIFIED 账号刷新或冷启 app 后再进入，**Then** 仍渲染 readonly 视图（per User Story 2 主流程，不抖到录入页）

---

### User Story 3 — 异常：公安比对 / 活体失败可重试（Priority: P1，并列）

用户填错信息或活体 SDK 失败 → 后端状态转 FAILED → 客户端展示错误态（错误文案 + input 保留用户输入） → 用户改输入或重新触发活体 → 再次提交 → 走完整 init → SDK → 查结果链路。

**Why this priority**: 真实用户输错 / 活体失败比例不低；UX 不允许"一次失败永久锁死"。

**Independent Test**: msw mock `POST /verifications` 第一次返 success → mock `GET /verifications/{bizId}` 返 `{status: FAILED, failedReason: NAME_ID_MISMATCH}` → 断言录入页保留输入 + 显示错误文案；用户改输入提交 → mock 第二次成功 → 跳 readonly。

**Acceptance Scenarios**:

1. **Given** 录入页提交后状态 PENDING，**When** 轮询 `GET /verifications/{bizId}` 返 `{status: FAILED, failedReason: NAME_ID_MISMATCH}`，**Then** 回到录入页（不跳走）+ 错误文案"姓名与身份证号不一致，请检查"+ form 保留用户输入 + 「下一步」disabled 直到用户改输入
2. **Given** 同样 FAILED 但 `failedReason: LIVENESS_FAILED`，**Then** 错误文案"人脸识别未通过，请重试"+ 用户可直接 press 「下一步」重试（保留同输入）
3. **Given** 同样 FAILED 但 `failedReason: USER_CANCELED`，**Then** 错误文案"已取消，可重新提交" + 同 LIVENESS_FAILED 处理（用户 cancel 不计 rate limit failure）
4. **Given** 后端返 429 `RATE_LIMIT_EXCEEDED`（24h 内 5 次失败已达上限），**Then** 错误文案"重试次数已达上限，请稍后再试" + 「下一步」disabled

---

### User Story 4 — 边缘：协议门禁 + 同号占用 + FROZEN（Priority: P2）

- 协议未勾选 → 「下一步」disabled，UI 层硬门禁；后端兜底 400 `REALNAME_AGREEMENT_REQUIRED` 不会被触发
- 身份证号已被其他账号绑定 → 提交后端返 409 `REALNAME_ID_CARD_OCCUPIED` → 错误文案"该证件号已被其他账号绑定"
- 账号 FROZEN（注销冻结期）→ 进入 realname 路由直接拦截（不调 GET `/me`）→ 错误页"账号处于注销冻结期，请先撤销注销"+ 「去撤销」按钮跳 cancel-deletion 路由（既有 spec C 落地）

**Why this priority**: 边缘但必须明确；与 PRD § 5.5 冻结期行为表 + § 5.10 不变式 2 对齐。

**Independent Test**: 三组场景独立 vitest case；msw mock 对应 4xx 响应 + AuthStore status mock。

**Acceptance Scenarios**:

1. **Given** 录入页，**When** 真实姓名 + 身份证号填好但协议未勾选，**Then** 「下一步」disabled
2. **Given** 提交，**When** 后端返 409 `REALNAME_ID_CARD_OCCUPIED`，**Then** 录入页保留输入 + 错误文案"该证件号已被其他账号绑定"
3. **Given** AuthStore.status=FROZEN，**When** 进入 realname 路由，**Then** 不渲染录入页 / readonly；渲染冻结期错误页 + 跳 cancel-deletion 入口

---

### Edge Cases

- **网络错时 GET `/me` 失败**：渲染错误占位 + 重试按钮（per FR-007 错误映射）；不 deadlock
- **轮询 `/verifications/{bizId}` 时 401**：access token 已过期 → packages/api-client 拦截器透明 refresh（既有契约）→ 自动重发；本页不感知
- **轮询超时**（30s 仍 PENDING）：错误文案"等待超时，请重试" + 回到录入页保留输入
- **SDK 启动失败 / livenessUrl invalid**：错误文案"活体启动失败，请重试" + 回录入页
- **iOS Safari Web 不支持阿里云原生 SDK**：本期 web 端走 H5 版本（阿里云提供）；具体兼容性 plan.md 决策
- **用户在活体页 press iOS 物理 back**：SDK 行为；客户端按"USER_CANCELED" 路径处理（per User Story 3 acceptance 3）
- **身份证号 input 软键盘**：iOS 数字键盘（`keyboardType="numeric"`），但末位 X 用户需切英文输入 — UX 接受
- **真实姓名输入限长**：≤ 20 字符（前端硬限）+ 后端兜底校验
- **网络断开**：fetch failure → toast "网络错误，请重试" + form 保留

## Functional Requirements _(mandatory)_

- **FR-001（路由）**：路径 `(app)/settings/account-security/realname/index.tsx`；嵌套在 `account-security/_layout.tsx` stack 内；受 `(app)/_layout.tsx` AuthGate 保护
- **FR-002（入口转 enabled）**：`account-security/index.tsx` 第 11 行 `realname: '实名认证'` 项**保留 disabled** 直到本 spec impl ship；ship 同 PR cycle 改为 enabled + tap 跳 `account-security/realname`
- **FR-003（页面状态机）**：`useRealnameStatus` hook 输出状态 ∈ {LOADING, UNVERIFIED, PENDING, VERIFIED, FAILED, FROZEN, ERROR}；状态决定 render 哪个视图：
  - `LOADING` → splash / skeleton
  - `UNVERIFIED` / `FAILED` → 录入页（图 1，FAILED 时附加错误文案 + 保留输入）
  - `PENDING` → 等待视图（"正在验证身份信息..." + 轮询 indicator；可点击「跳过等待，重新提交」回 UNVERIFIED）
  - `VERIFIED` → readonly 视图（图 3）
  - `FROZEN` → 冻结期错误页（含 cancel-deletion 跳转入口）
  - `ERROR` → 错误占位 + 重试按钮
- **FR-004（form 校验）**：录入页前端校验：
  - 真实姓名：≥ 2 字符 ≤ 20 字符（CJK + 字母）
  - 身份证号：18 位 / 前 17 位数字 / 末位 0-9X / GB 11643 末位校验码（与 server FR-002 一致）
  - 协议复选框必须勾选
  - 三者全 valid → 「下一步」enabled；任一 invalid → disabled
  - 入参 `agreementVersion` 由 client 写定 `"v1.0-placeholder"`（per server spec FR-011）
- **FR-005（SDK 调用契约）**：
  - 阿里云活体 SDK 走 H5 / native bridge（具体集成方案 plan.md）
  - 客户端不直接调阿里云；后端 `POST /verifications` 返回 `livenessUrl` → 客户端跳此 URL（H5）或调 SDK with bizId（native）
  - SDK 完成后回到 app — Web 走 url callback / native 走 SDK callback
  - 回调后**轮询** `GET /verifications/{providerBizId}` 至状态非 PENDING（轮询间隔 2s，最多 15 次 = 30s 超时）
- **FR-006（mask 显示）**：readonly 视图直接消费后端 `realNameMasked` / `idCardMasked` 字段（per server FR-008）；客户端**不**自行 mask（避免规则不一致）
- **FR-007（错误映射 mapApiError）**：复用既有 `lib/api/error.ts` 的 `mapApiError` 工具；本 use case 错误码 → 文案：
  - `REALNAME_INVALID_ID_CARD_FORMAT` → "证件号格式错误"（前端正则同步拦截，应不会触发）
  - `REALNAME_AGREEMENT_REQUIRED` → "请先勾选授权协议"（同上前端硬门禁，不会触发）
  - `REALNAME_ALREADY_VERIFIED` → 不展示错误，直接 router.replace 到 readonly（轮询触发）
  - `REALNAME_ID_CARD_OCCUPIED` → "该证件号已被其他账号绑定"
  - `REALNAME_NAME_ID_MISMATCH` (failed_reason) → "姓名与身份证号不一致，请检查"
  - `REALNAME_LIVENESS_FAILED` (failed_reason) → "人脸识别未通过，请重试"
  - `USER_CANCELED` (failed_reason) → "已取消，可重新提交"
  - `REALNAME_PROVIDER_TIMEOUT` (503) → "实名服务暂时不可用，请稍后再试"
  - `REALNAME_PROVIDER_ERROR` (502) → "实名服务异常，请稍后再试"
  - `RATE_LIMIT_EXCEEDED` (429) → "重试次数已达上限，请稍后再试"
  - `ACCOUNT_IN_FREEZE_PERIOD` (403) → 跳 FROZEN 错误页
- **FR-008（持久化策略）**：本页**不**用 zustand persist；每次进入路由都调 `GET /me` 取最新状态（VERIFIED 不频繁变，但 PENDING/FAILED 状态高频变）
- **FR-009（不可解绑 UI 层物理化）**：readonly 视图代码层面**无**任何"修改"/"解绑"/"重新认证"按钮 / 路由；vitest snapshot 测试断言不渲染 destructive 元素
- **FR-010（占位 UI 边界，per ADR-0017）**：PHASE 1 占位 UI **应包含**：路由配置 / form input + checkbox / 提交事件 / 状态机视觉指示（裸 `<Text>` 即可）/ 错误展示位置；**不应包含**：精确间距 / 颜色 / 字号 / 阴影 / 自定义动画 / 视觉装饰 / `packages/ui` 抽组件 — 占位用原生 RN component；占位 page 头部加 `// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.` banner
- **FR-011（埋点）**：进入录入页 → 埋点 `realname_init`（per PRD § 5.9 amend）；完成（VERIFIED/FAILED）→ 埋点 `realname_complete + result + failed_reason`；本期 commented `// TODO`，由埋点模块统一接入（M2+）
- **FR-012（一致性维护）**：`AuthStore` 加字段 `realnameStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED'`，从 `GET /me` 同步（既有 me API 已暴露 verified 字段，per server impl）；用于跨页面 quick check（如未来 mbw-billing 提现 gate）；本期不强依赖

## Success Criteria _(mandatory)_

- **SC-001（主流程）**：vitest 覆盖 User Stories 1-4 全部 acceptance scenario 100%；msw mock-based unit + behavior test
- **SC-002（不可解绑 UI 层物理化）**：readonly 视图渲染快照测试断言**0** destructive 按钮 / 修改 input / 重新认证入口；jsdom queryByRole / getByText 全部命中预期元素
- **SC-003（FROZEN 拦截）**：FROZEN status 进入路由 → 0 调 `GET /me`（前置 AuthStore.status 拦截）→ 渲染冻结页 + cancel-deletion 跳转
- **SC-004（错误文案一致性）**：8 条错误码 + 3 条 failed_reason → 文案映射 100% 覆盖；`mapApiError` 单测验证
- **SC-005（PHASE 2 mockup 后回填）**：本 PR ship 后 owner 跑 Claude Design 生成 mockup；mockup ship 后 amend plan.md UI 段；本 SC 在 PHASE 2 PR 中补完
- **SC-006（真后端冒烟）**：本 PR impl 阶段（PHASE 1）后跑真后端冒烟 — `MBW_REALNAME_DEV_BYPASS=true` + `_FIXED_RESULT=verified` 端到端走录入 → bypass → readonly；冒烟脚本由 plan.md 定义

## Clarifications

> 8 点澄清于 2026-05-08 与 server PR #149 + meta PR #65 同期完成。前 7 条与 server spec 同源（per CL-001 ~ CL-007）；CL-008 为前端特有。

### CL-001 ~ CL-007（同 server spec）

参见 [server spec/account/realname-verification/spec.md § Clarifications](https://github.com/xiaocaishen-michael/my-beloved-server/blob/main/spec/account/realname-verification/spec.md#clarifications)。

### CL-008：阿里云活体 SDK 集成方案 — H5 vs native vs Web 混合

**Q**：Expo + RN + Web 混合栈下，阿里云活体 SDK 怎么集成？

**A**：**v1 PHASE 1 占位 + PHASE 2 mockup 阶段一并决定**（推断 + 用户后续决策）。候选：

1. **统一 H5**：后端返 livenessUrl，客户端 `expo-web-browser` open；最简但 native 端体验降级
2. **Native SDK + Web H5 双模**：iOS/Android 用 expo dev-build 集成阿里云 native SDK；Web 走 H5；体验最佳但工程量大
3. **Web 优先**：本期 Web 走 H5 跑通；native 端等 EAS dev-build 接 SDK（M2+ 一并落地）

PHASE 1 写占位 UI + form / 状态机不依赖 SDK 选型；PHASE 2 mockup 后由用户在 plan.md 决定。

**落点**：FR-005 抽象"调 SDK / 跳 livenessUrl"，具体方案 plan.md PHASE 2；本 spec 不锁定。

## UI 占位边界（per ADR-0017 类 1）

PHASE 1 PHASE 1 占位 page **应包含**：

- 路由 `(app)/settings/account-security/realname/index.tsx` + 嵌套 layout 配置
- Form 输入：真实姓名 input + 身份证号 input + 协议复选框
- 提交事件：「下一步」按钮 + onSubmit handler
- 状态机视觉指示（裸 `<Text>` 即可）：LOADING "加载中..." / PENDING "正在验证身份信息..." / FAILED "<错误文案>" / VERIFIED 跳走（无需文案）/ FROZEN "<冻结文案>"
- 错误展示位置：错误文案 `<Text>` 在 form 上方或 input 下方（具体位置 PHASE 2 mockup 决定）
- readonly 视图（VERIFIED）：`<Text>已认证实名信息</Text>` + `<Text>真实姓名: {realNameMasked}</Text>` + `<Text>证件号码: {idCardMasked}</Text>`（裸 RN component；mask 字段直接消费后端）

PHASE 1 占位 page **不应包含**：

- 精确间距（`mt-4` / `gap-2` 等 NativeWind class 暂不用）
- 颜色 / 字号 / 阴影 / 字重（用 RN 默认即可）
- 自定义动画（如 form 入场 / 状态切换过渡）
- 视觉装饰（圆角卡片背景 / 分隔线 / icon）
- `packages/ui` 组件抽象（用原生 `<View>` / `<Text>` / `<TextInput>` / `<Pressable>`）

PHASE 1 page 头部加 banner：

```text
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
// per ADR-0017; visual decisions land in PHASE 2 (post Claude Design mockup).
```

## Out of Scope

- **图 2 视觉**（活体 SDK 全屏接管，由阿里云控制）
- **PHASE 2 mockup 视觉决策**（精确 px / hex / 阴影 / 动画 / packages/ui 抽组件） — 由 owner 跑 Claude Design 后回填 plan.md UI 段
- **非中国大陆二代身份证版面**（删除「非中国大陆二代身份证」入口，per user 红字标注 1）
- **"音乐人入驻、达人认证"文案** — 改为「**达人入驻**」（per user 红字标注 2，落在录入页说明文案）
- **后台管理员核身改名 UI**（M2+，独立 admin spec）
- **OCR 自动识别身份证照片**（永不规划，per server spec OoS）
- **下游 gate 接入**（提现 / 达人入驻路由前置 realname VERIFIED 检查）— M2+ 接入
- **iOS / Android 原生阿里云 SDK 集成**（CL-008 决议；PHASE 2 mockup 后决定 H5 vs native）
- **持久化 realname 状态到 zustand** — 仅 in-memory（FR-008）
- **"我的页"/"个人中心"显示 realname 状态徽章** — M2+ 评估

## References

- [server spec/account/realname-verification/](https://github.com/xiaocaishen-michael/my-beloved-server/tree/main/spec/account/realname-verification) — 后端契约（PR #149）
- [PRD § 5.10](../../../../docs/requirement/account-center.v2.md#510-实名认证m1x-引入)（meta PR #65 ship）
- [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程
- [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md) unified phone-SMS auth（同期上下文）
- 既有参考：[`apps/native/spec/onboarding/spec.md`](../onboarding/spec.md) — 类 1 spec 结构参照
- 既有参考：[`apps/native/spec/login/spec.md`](../login/spec.md) — form 类 1 spec 参照
- 路由锚点：`apps/native/app/(app)/settings/account-security/index.tsx` 第 11 行 `realname:` 项
