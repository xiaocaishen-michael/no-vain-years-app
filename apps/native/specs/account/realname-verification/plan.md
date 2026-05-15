# Implementation Plan: Realname Verification UI (PHASE 1 Doc — 业务流程 + 占位 UI)

**Spec**: [`./spec.md`](./spec.md)
**Module**: `apps/native/app/(app)/settings/account-security/realname/`
**Phase**: PHASE 1 Doc（业务流；UI 段标占位，留 PHASE 2 mockup 后回填）
**Status**: Draft（pending impl + mockup PHASE 2）

> **per ADR-0017 类 1 流程**：本 plan PHASE 1 业务段完整 + UI 段写 "占位版（pending mockup）"；PHASE 2 mockup 后由 owner 翻译 `design/handoff.md` 后回填 UI 段。

## 数据流

```text
路由 (app)/settings/account-security/realname
   ↓
RealnameScreen (page-level)
   ↓ useRealnameStatus() hook
GET /api/v1/realname/me  ← packages/api-client RealnameApi.getMe()
   ↓ 状态 ∈ {UNVERIFIED, PENDING, VERIFIED, FAILED}（+ FROZEN 由 AuthStore 前置拦截）
分支 render：
   - UNVERIFIED / FAILED → InputForm（图 1 占位）+ submit handler
       ↓ POST /verifications {realName, idCardNo, agreementVersion}  ← RealnameApi.initiateVerification()
       ↓ 拿 {providerBizId, livenessUrl}
       → 跳活体 SDK（CL-008 决议方案；PHASE 1 占位 = expo-web-browser open livenessUrl）
       ← SDK 完成 callback / 返回 app
       ↓ 进入 PENDING 状态 + 启动轮询
   - PENDING → 等待视图 + 轮询（2s 间隔，max 15 次 = 30s 超时）
       ↓ GET /verifications/{providerBizId}  ← RealnameApi.getVerification()
       ↓ 状态非 PENDING → 转进对应分支
   - VERIFIED → ReadonlyView（图 3 占位，从 GET /me 已拿 mask 字段）
   - FAILED → 回 InputForm + 错误文案 + 保留输入
```

## 状态机

`useRealnameStatus` hook 输出：

```text
                   GET /me
                     ↓
                   LOADING
                     ↓ status
   ┌───────┬───────┬───────┬───────┬───────┐
   ↓       ↓       ↓       ↓       ↓       ↓
UNVERIFIED FAILED PENDING VERIFIED FROZEN ERROR
   │        │      │       │
   │ submit │      │       │
   ↓        ↓ submit       │
PENDING ──polling──┘       │
                           │
   PENDING → VERIFIED ─────┘
   PENDING → FAILED → (用户改输入或重试) → PENDING
```

| Status     | UI 渲染                                | 触发动作                                   |
| ---------- | -------------------------------------- | ------------------------------------------ |
| LOADING    | splash / skeleton                      | GET /me in-flight                          |
| UNVERIFIED | InputForm (图 1)                       | 用户填写 → submit → POST /verifications    |
| PENDING    | "正在验证身份信息..." + 轮询 indicator | 自动轮询 / 手动「重新提交」回 UNVERIFIED   |
| VERIFIED   | ReadonlyView (图 3)                    | terminal — 仅 header 返回箭头              |
| FAILED     | InputForm + 错误文案 + 保留输入        | 用户改输入 → submit                        |
| FROZEN     | 冻结期错误页 + cancel-deletion 跳转    | (前置 AuthStore.status 拦截，不调 GET /me) |
| ERROR      | 错误占位 + 重试按钮                    | 用户 press 重试 → 再调 GET /me             |

## 错误映射（mapApiError 复用契约）

| 错误源                         | 错误码 / failed_reason                | 文案                                     | UI 落点                               |
| ------------------------------ | ------------------------------------- | ---------------------------------------- | ------------------------------------- |
| API 4xx/5xx                    | `REALNAME_INVALID_ID_CARD_FORMAT` 400 | "证件号格式错误"                         | form 错误位（理论不触发，前端硬门禁） |
|                                | `REALNAME_AGREEMENT_REQUIRED` 400     | "请先勾选授权协议"                       | 同上（理论不触发）                    |
|                                | `REALNAME_ALREADY_VERIFIED` 409       | (无文案)                                 | 触发 router.replace 到 readonly       |
|                                | `REALNAME_ID_CARD_OCCUPIED` 409       | "该证件号已被其他账号绑定"               | form 错误位                           |
|                                | `REALNAME_PROVIDER_TIMEOUT` 503       | "实名服务暂时不可用，请稍后再试"         | toast                                 |
|                                | `REALNAME_PROVIDER_ERROR` 502         | "实名服务异常，请稍后再试"               | toast                                 |
|                                | `RATE_LIMIT_EXCEEDED` 429             | "重试次数已达上限，请稍后再试"           | form 错误位 + 「下一步」disabled      |
|                                | `ACCOUNT_IN_FREEZE_PERIOD` 403        | (跳冻结页)                               | router.replace                        |
| 业务结果（GET /verifications） | `failed_reason: NAME_ID_MISMATCH`     | "姓名与身份证号不一致，请检查"           | form 错误位                           |
|                                | `failed_reason: LIVENESS_FAILED`      | "人脸识别未通过，请重试"                 | form 错误位 + 用户可保留输入直接重试  |
|                                | `failed_reason: USER_CANCELED`        | "已取消，可重新提交"                     | form 错误位                           |
| 网络层                         | fetch failure                         | "网络错误，请重试"                       | toast                                 |
|                                | 401                                   | (透明 refresh by api-client，本页不感知) | —                                     |

## 复用既有代码

| 来源                                       | 用途                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `packages/api-client`                      | OpenAPI 自动生成的 `RealnameApi` (`pnpm api:gen` 后产出)                 |
| `packages/auth.useAuthStore`               | 读 `status`（FROZEN 拦截）+ 读 `accountId`；不写 realname 状态（FR-008） |
| `lib/api/error.ts.mapApiError`             | 错误码 → 文案映射（扩展 8 条 REALNAME\_\* + 3 条 failed_reason）         |
| `expo-router`                              | 路由 push / replace / back                                               |
| `expo-web-browser`                         | (CL-008 PHASE 1 占位方案) open livenessUrl                               |
| `lib/validation/identity-number.ts`        | (新建) GB 11643 末位校验，与 server FR-002 一致                          |
| 既有 layout `account-security/_layout.tsx` | 嵌套路由 stack                                                           |

## RN Web 兼容点（per `.claude/nativewind-mapping.md` 既有 gotcha）

| 元素            | iOS / Android                                                              | Web                                               | 备注                                                                                   |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 身份证号软键盘  | `keyboardType="numeric"` 数字键盘；末位 X 切英文                           | `inputMode="numeric"` HTML5                       | UX 接受                                                                                |
| 协议复选框      | RN `<Pressable>` + `<View>` mock                                           | Web 用 `<input type="checkbox">` 还是 RN 同一抽象 | PHASE 2 mockup 决定，PHASE 1 占位用 RN `<Pressable>` 即可                              |
| 软键盘遮挡      | `KeyboardAvoidingView` 包裹 form                                           | 不需要                                            | 既有 onboarding 模式参照                                                               |
| 活体 SDK        | iOS / Android 走 expo dev-build native bridge（CL-008 候选 2/3，M2+ 决定） | Web 走 H5（livenessUrl）                          | PHASE 1 占位仅 Web；native 端 PHASE 1 仅打通 `expo-web-browser`，native SDK 集成留 M2+ |
| Header 返回箭头 | RN `<Pressable>`                                                           | Web 同                                            | 既有 stack `_layout.tsx` 控制                                                          |

## UI 结构（占位版，pending mockup）

> **PHASE 1 状态**：仅业务流 + 占位 page；视觉决策（精确 px / hex / 阴影 / 字重 / 自定义动画 / packages/ui 抽组件）**不进 plan**，留 PHASE 2 mockup 后回填本段为完整版（参考 onboarding plan.md PHASE 2 后的 UI 段）。
>
> **占位 page 头部 banner**：

```text
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
// per ADR-0017; visual decisions land in PHASE 2 (post Claude Design mockup).
```

### 占位区域分块（per spec FR-010 + 占位 4 边界）

**InputForm 占位（UNVERIFIED / FAILED）**：

```text
<View>  {/* 默认布局，无 className */}
  <Text>实名认证</Text>  {/* header 标题，由 stack layout 提供 */}
  <Text>实名认证信息一经绑定，不支持解绑...</Text>  {/* 说明文案 1 */}
  <Text>完成实名认证可开通提现、达人入驻等功能或服务...</Text>  {/* 说明文案 2，per user 红字标注 2 改为「达人入驻」 */}
  <Text>真实姓名</Text>
  <TextInput value={realName} onChangeText={setRealName} />
  <Text>证件号码</Text>
  <TextInput value={idCardNo} onChangeText={setIdCardNo} keyboardType="numeric" />
  <Pressable onPress={() => setAgreed(!agreed)}>
    <Text>{agreed ? '☑' : '☐'} 我已阅读并同意《实名认证服务个人信息处理授权协议》</Text>
  </Pressable>
  {failureMessage && <Text>{failureMessage}</Text>}  {/* 错误位 */}
  <Pressable onPress={onSubmit} disabled={!isSubmittable}>
    <Text>下一步</Text>
  </Pressable>
</View>
```

**ReadonlyView 占位（VERIFIED）**：

```text
<View>
  <Text>实名认证</Text>  {/* header */}
  <Text>已认证实名信息</Text>
  <View>{/* 默认头像 placeholder */}</View>
  <Text>{userNicknameMasked}</Text>
  <View>
    <Text>真实姓名: {realNameMasked}</Text>
    <Text>证件号码: {idCardMasked}</Text>
  </View>
</View>
```

**FROZEN 占位**：

```text
<View>
  <Text>账号处于注销冻结期</Text>
  <Pressable onPress={() => router.push('/settings/account-security/delete-account')}>
    <Text>去撤销注销</Text>
  </Pressable>
</View>
```

**LOADING / PENDING / ERROR 占位**：裸 `<Text>` "加载中..." / "正在验证身份信息..." / "出错了，请重试"。

> **占位 4 边界（per ADR-0017）显式 check**：
>
> - ✅ 路由：`(app)/settings/account-security/realname/index.tsx`
> - ✅ Form 输入：真实姓名 / 证件号码 / 协议复选框
> - ✅ 提交事件：「下一步」+ onSubmit handler
> - ✅ 状态机视觉指示（裸 `<Text>`）
> - ✅ 错误展示位置（form 上方或下方 `<Text>`）
> - ❌ 精确间距 / 颜色 / 字号 / 阴影 / 字重（用 RN 默认）
> - ❌ 自定义动画
> - ❌ 视觉装饰
> - ❌ packages/ui 组件（用原生 `<View>` / `<Text>` / `<TextInput>` / `<Pressable>`）

### Token 映射（PHASE 2 待补）

PHASE 1 占位无 className；PHASE 2 mockup 后回填 `tailwind` token 清单。

### 复用 packages/ui 组件清单（PHASE 2 待补）

PHASE 1 占位 0 引用 `@nvy/ui`；PHASE 2 mockup 后决定复用 `PrimaryButton` / `TextInput` / `Card` / `ErrorRow` 等组件。

### a11y 落点（PHASE 2 待补）

PHASE 1 占位仅基础 `accessibilityLabel`；PHASE 2 mockup 后扩展 `accessibilityHint` / `accessibilityRole` / `accessibilityState`。

## 测试策略

| 层                  | 工具                            | 覆盖范围                                                                                                                                                                                           | 阶段            |
| ------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 单测（schema）      | vitest                          | `identityNumberSchema` GB 11643 校验 9 case（合法 / 非法长度 / 非法字符 / 末位错 / 行政区划码错 / 日期错 / null 等）                                                                               | PHASE 1 PR      |
| 单测（usecase）     | vitest + msw                    | `useRealnameStatus` happy / 401 / 网络错；`initiateVerification` happy / 4xx / 5xx；`getVerification` 轮询 + 终态 + 超时                                                                           | PHASE 1 PR      |
| 单测（hook）        | vitest + @testing-library/react | `useRealnameForm` 4 form-state（空 / valid / submitting / errored） + 协议门禁                                                                                                                     | PHASE 1 PR      |
| 组件测              | @testing-library/react-native   | realname/index.tsx render + 状态分支（UNVERIFIED / VERIFIED / FAILED / FROZEN / LOADING / ERROR）+ submit 流程 + readonly 视图 destructive 元素 0                                                  | PHASE 1 PR      |
| E2E（真后端冒烟）   | Playwright `runtime-debug.mjs`  | server `MBW_REALNAME_DEV_BYPASS=true` + `_FIXED_RESULT=verified` 场景：UNVERIFIED → InputForm → submit → bypass → VERIFIED → readonly；截图归档 `runtime-debug/2026-05-XX-realname-business-flow/` | PHASE 1 PR 末尾 |
| 组件测（PHASE 2）   | (相同工具)                      | mockup 视觉回归 + a11y 维度补全 + Token 映射验证                                                                                                                                                   | PHASE 2 PR      |
| 视觉回归（PHASE 2） | (TBD)                           | mockup vs 实际渲染像素对比                                                                                                                                                                         | PHASE 2 PR      |

## Constitution / 边界 Check

- ✅ 占位 UI 0 视觉决策（per ADR-0017 类 1 + spec FR-010）
- ✅ 不引 packages/ui（per spec FR-010）
- ✅ 身份证号校验镜像 server FR-002（GB 11643）
- ✅ 不引入新 dep（仅 `expo-web-browser` 既有 + 扩既有 store / usecases / mapApiError）
- ✅ readonly 视图 0 destructive 元素（per spec FR-009 + SC-002）
- ✅ FROZEN 拦截 0 调 GET /me（per spec SC-003）
- ✅ realname 状态不入 zustand persist 白名单（per spec FR-008）
- ✅ mask 字段直接消费后端（per spec FR-006）

## 反模式（明确避免）

- ❌ 在占位 UI 阶段写视觉细节（间距 / 颜色 / 字号 / 阴影 / 自定义动画 / packages/ui 抽组件）— 该工作留给 mockup PHASE 2
- ❌ 在客户端自行 mask 真实姓名 / 身份证号（破坏 spec FR-006，规则双源风险）
- ❌ 在 readonly 视图加任何"修改"/"解绑"/"重新认证"按钮（破坏 spec FR-009 不可解绑约束）
- ❌ 持久化 realname 状态到 zustand persist（破坏 spec FR-008 — 状态高频变化，每次进路由重拉新）
- ❌ 在 hook 内部直接 `router.replace`（应让 page 监听 status 变化触发，与 onboarding 同模式）
- ❌ FROZEN 状态下仍调 GET `/me`（应前置 AuthStore.status 拦截，不浪费请求 + 防 race condition）
- ❌ 客户端直接调阿里云 API（应通过后端 POST /verifications + GET /verifications/{bizId} 中转）
- ❌ 协议复选框未勾选时仍允许 submit（前端硬门禁 + 后端兜底双层防御）

## 风险 + 缓解

| 风险                                                     | 缓解                                                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| server PR #149 未合并前先做 app impl，OpenAPI spec drift | T0 任务前置：等 server PR merge + `pnpm api:gen:dev` 拉新 client；CI typecheck 兜底                              |
| 阿里云活体 SDK 集成方案未定（CL-008）                    | PHASE 1 占位仅用 `expo-web-browser` open livenessUrl（H5 路径）；native SDK 集成 M2+ 决定                        |
| 真后端冒烟依赖 server `MBW_REALNAME_DEV_BYPASS` 启用     | PHASE 1 PR impl 阶段确认 server 已 ship dev-bypass；dev-server.sh 脚本配置默认 `_FIXED_RESULT=verified`          |
| 前端 mask 字段消费失败（后端格式变化）                   | 兜底：后端字段 null 时显示 "**\*\***"；vitest 单测覆盖                                                           |
| FROZEN 状态拦截误触发（status stale）                    | AuthStore.status 由 GET `/me` 同步；rehydrate 后 status 旧值刷新到最新；既有 expose-frozen-status spec 已落地    |
| 用户活体取消后无明确"重试"路径                           | UI 在 FAILED + USER_CANCELED 文案下保留输入 + 「下一步」按钮立即可点击重试（per spec User Story 3 acceptance 3） |

## References

- [`./spec.md`](./spec.md) / [`./tasks.md`](./tasks.md)
- [server spec/account/realname-verification/plan.md](https://github.com/xiaocaishen-michael/my-beloved-server/blob/main/spec/account/realname-verification/plan.md) — 后端 plan 对照
- [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程
- [`apps/native/specs/auth/onboarding/plan.md`](../onboarding/plan.md) — 类 1 plan PHASE 2 完整版参考
- [`apps/native/specs/auth/phone-sms-auth/plan.md`](../login/plan.md) — 类 1 form plan 参考
- 既有 `account-security/_layout.tsx` — 嵌套路由 stack
