# Feature Specification: Account Settings Shell (M1.X — 设置入口 + 账号与安全 + 法规占位)

**Feature Branch**: `feature/account-settings-shell-spec`
**Created**: 2026-05-07（per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程）
**Status**: Draft（pending /speckit.clarify + plan + tasks）
**Module**: `apps/native/app/(app)/settings/*`（新建 settings stack;含 `account-security/` + `legal/` 两个子段）
**Input**: User description: "建一个『设置』shell — 从『我的 → ⚙️』进入。设置主页 list 含『账号与安全』入口 + 4 项 disabled 占位（通用 / 通知 / 隐私权限 / 关于）+ 切换账号 disabled + 退出登录真功能 + 法规链接 ×2;账号与安全子页含手机号 mask + 4 项 disabled 占位（实名认证 / 第三方绑定 / 登录设备管理 / 安全小知识）+ 注销账号入口（实现是 spec C）;法规页 ×2 静态占位。本 spec 是 SDD 拆分链 A → B → C 的 B,衔接 my-profile（A,已 ship）与 delete-account-cancel-deletion-ui（C,后置）。"

> 决策约束:
>
> - **per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 流程**:本 spec 阶段产出 docs + 业务流 + 占位 UI;视觉决策（精确 px / hex / 阴影 / 自定义动画 / list card 视觉 / 法规 page 排版 / Alert 自定义 modal）**不进 spec / plan**,留 PHASE 2 mockup 落地后回填 plan.md UI 段
> - **server 端 0 工作量**:`GET /accounts/me`(spec onboarding 已用,SDK 已生)与 `POST /auth/logout-all`(既有 `packages/auth#logoutAll()`)全部已落地;本 spec 仅消费这 2 个 endpoint
> - **路由 `apps/native/app/(app)/settings/*` 位于 `(tabs)/` 之外**(per spec A CL-002 (b)),Expo Router 默认隐藏底 tab bar
> - **占位 UI 阶段不引入 packages/ui 新组件**(per FR-015);现有共享组件(Spinner 等)按需复用,新组件等 PHASE 2 mockup 评估
> - 本 spec 是 SDD 拆分链 A → B → C 的 B;A → B 入口 ⚙️ 已在 spec A `(tabs)/profile` FR-005 占位 `router.push('/(app)/settings')`;B → C 入口"注销账号"本 spec 仅占位 `router.push('/(app)/settings/account-security/delete-account')`,目标实现是 spec C 范围
> - **退出登录已完整实现**:server `POST /auth/logout-all` + client `packages/auth#logoutAll()` 已落地;本 spec 仅 UI 接入 + Alert 二次确认 + best-effort 容错

## Visual References

参考截图归档于 spec A 的 [`apps/native/specs/account/profile/design/inspiration/`](../my-profile/design/inspiration/),本 spec 直接引用,不重复归档:

| 图  | 文件                                                                                | 角色             | 本 spec 引用                       |
| --- | ----------------------------------------------------------------------------------- | ---------------- | ---------------------------------- |
| 03  | [03-settings.png](../my-profile/design/inspiration/03-settings.png)                 | 设置页 IA 主参照 | **本 spec 主参照(设置主页结构)**   |
| 04  | [04-account-security.png](../my-profile/design/inspiration/04-account-security.png) | 账号与安全 IA    | **本 spec 主参照(账号与安全子页)** |

参考来源: 网易云音乐 iOS 端,**仅作 layout / IA 参照**,不引用任何品牌资产、文案、配色;PHASE 2 mockup 阶段产出本项目自身视觉系统(完整决策见 [`notes.md` § 03-settings / § 04-account-security / § SDD 拆分](../my-profile/design/inspiration/notes.md))。

## Information Architecture

```mermaid
flowchart TB
    subgraph A_Profile["(app)/(tabs)/profile (spec A — 已 ship)"]
        TopNav["顶 nav ⚙️"]
    end

    subgraph B_Settings["(app)/settings/* (本 spec)"]
        S1["settings/index<br/>设置主页 list"]
        AS1["settings/account-security/index<br/>账号与安全 list"]
        ASP["settings/account-security/phone<br/>手机号只读 detail"]
        LPI["settings/legal/personal-info<br/>《个人信息收集与使用清单》占位"]
        L3P["settings/legal/third-party<br/>《第三方共享清单》占位"]
    end

    subgraph C_Delete["(app)/settings/account-security/delete-account (spec C — 后置)"]
        DA["delete-account UI"]
    end

    TopNav -->|router.push '/(app)/settings'| S1
    S1 -->|账号与安全 >| AS1
    S1 -->|《个人信息收集与使用清单》| LPI
    S1 -->|《第三方共享清单》| L3P
    S1 -->|退出登录| Logout[(Alert 确认 → logoutAll<br/>+ 清本地 + replace login)]
    AS1 -->|手机号 >| ASP
    AS1 -->|注销账号| DA
```

## User Flow

```mermaid
flowchart TD
    P["(tabs)/profile"] -->|tap ⚙️| S1["settings/index 主页"]

    S1 -->|账号与安全 >| AS1["settings/account-security"]
    S1 -->|《个人信息收集与使用清单》| LPI["legal/personal-info"]
    S1 -->|《第三方共享清单》| L3P["legal/third-party"]
    S1 -->|tap disabled<br/>5 项: 通用/通知/隐私权限/关于/切换账号| Disabled1[(无反馈, 无 router 调用)]
    S1 -->|tap 退出登录| Confirm{Alert.alert<br/>确定要退出登录?}

    Confirm -->|取消| S1
    Confirm -->|确定| Logout[best-effort logoutAll<br/>+ 清本地 token<br/>+ router.replace /(auth)/login]

    AS1 -->|手机号 >| Phone["phone detail mask"]
    AS1 -->|注销账号| C["spec C delete-account 占位 surface"]
    AS1 -->|tap disabled<br/>4 项: 实名认证/第三方绑定/登录设备/安全小知识| Disabled2[(无反馈, 无 router 调用)]

    Phone -->|< 返回| AS1
    LPI -->|< 返回| S1
    L3P -->|< 返回| S1
    AS1 -->|< 返回| S1
    S1 -->|< 返回| P
```

## Clarifications

5 个核心待决问题已按用户决策对齐(2026-05-07,详见 [`notes.md`](../my-profile/design/inspiration/notes.md) § 03 / § 04 + 本对话 Q1-Q6):

### Q1 — 路由结构(嵌套 per-section)

- **决议**: 嵌套(B 选项),共 8 文件

  ```text
  apps/native/app/(app)/settings/
  ├── _layout.tsx
  ├── index.tsx                              # 设置主页
  ├── account-security/
  │   ├── _layout.tsx
  │   ├── index.tsx                          # 账号与安全 list
  │   └── phone.tsx                          # 手机号 mask 详情
  └── legal/
      ├── _layout.tsx
      ├── personal-info.tsx                  # 《个人信息收集与使用清单》
      └── third-party.tsx                    # 《第三方共享清单》
  ```

- **理由**: spec C 注销 UI 路径 `(app)/settings/account-security/delete-account` 已在 spec A plan.md § 衔接边界锚定,嵌套与之天然对齐;未来加 disabled 子项(实名认证 / 第三方绑定 / 登录设备管理)进 `account-security/` 子目录最自然;legal 子目录给后续法务定稿留扩展空间(可能加更多清单 / 协议文档)

### Q2 — 退出登录 confirm 形式

- **决议**: RN 内置 `Alert.alert` 系统对话框
  - 标题: `确定要退出登录?`
  - 正文: 空(标题已自描述,无需冗余)
  - 按钮: `[取消]`(default style)/ `[确定]`(destructive style)
- **理由**: 误触防护行业惯例(设置页底部 + tap target 大);RN 内置 `Alert.alert` 跨端兼容(iOS native alert / Android system dialog / RN Web 自带 polyfill 基于 `window.confirm`),无新组件依赖;PHASE 2 mockup 决定是否升级为自定义 modal

### Q3 — `logoutAll()` 失败容错

- **决议**: best-effort

  ```ts
  try {
    await logoutAll();
  } catch (e) {
    console.warn('[settings] logoutAll failed', e);
  }
  // 总是清本地 + replace /(auth)/login
  ```

- **理由**: 退出登录是不可逆 UX 期望(用户点了"确定"就期望已退出);refresh_token 即使 server 未作废也无设备触发 refresh,access_token 15min 后失效(per PRD § 6.4 + § 3.4);服务器临时不可用时不该卡用户在已"心理退出"状态;错误日志走 console.warn 即可,不打扰用户

### Q4 — 手机号 detail 占位页内容

- **决议**: 仅 mask 显示,无修改入口
  - 渲染: `<Text>+86 138****0000</Text>`(从 `useAuthStore(s => s.phone)` 读 + 客户端 mask 函数)
  - 不预占位"修改手机号"按钮 / 不写"用于验证码登录"等提示文案
- **理由**: M1.x server 是否已实现"修改手机号" endpoint 实现状态未知,前端不预占位 surface 避免污染未来真实现的设计空间;提示文案 PHASE 2 mockup 决定;手机号 store 字段是否存在 → 见 Open Question 1

### Q5 — disabled 占位项交互

- **决议**: 灰色 + `accessibilityState.disabled` + `<Pressable>` 无 `onPress` (`onPress={undefined}`)
- **理由**: 与 spec A `(tabs)/profile` T6 顶 nav ≡ / 🔍 disabled pattern 完全一致(用户已在 spec A 中接受);占位 UI 阶段不引入 toast / 公共占位页 / Alert 等任何新交互依赖;a11y `disabled=true` + opacity 0.5 已传达"未来可点击但本批次不可"的意图;PHASE 2 mockup 决定是否加 tap 反馈

### Q6 — 法规 placeholder 内容深度

- **决议**: 极简一行
  - 标题: 《个人信息收集与使用清单》/ 《第三方共享清单》
  - 正文: `<Text>本清单内容由法务团队定稿后填入,预计 M3 内测前完成。</Text>`
  - 无结构占位 / 无反馈邮箱 / 无 [placeholder] 标记
- **理由**: 法务文案是 M3 内测前合规模块强需求,现在写结构占位反易与法务定稿冲突 / 误导用户;一行交代足够;PHASE 2 mockup 阶段如有视觉风格调整(如分卡片 / icon 装饰)同步处理

### Cross-cutting Clarifications(/speckit.clarify round 1 — 2026-05-07)

- **CL-001 — 退出登录 store reset 字段清单**(Domain Model)→ **(B) 显式逐个 null 化 5 字段**:`accessToken / refreshToken / displayName / accountId / phone`;不清非 auth 字段(如 onboarding flag / PKM 草稿 / 偏好等);plan.md 阶段 grep 确认 `packages/auth#logoutLocal()` 是否已实现 → 若是则**优先复用**(同名等价语义),否则新增 `clearAuth()` action。理由: 契约清晰可单测断言;不误清未来添加的非 auth 字段。**FR-005 已同步修订含字段清单。**
- **CL-002 — `maskPhone` 国际化范围**(Domain / Security)→ **(B) generic 实现**:保留 phone 字符串前缀所有非数字字符(`+` / 空格 / 破折号),提取数字部分 → 保留首 N 位(国码 + 本地号首 3,通常 N = 国码长度 + 3)+ 末 4 位 + 中段所有数字 mask 为 `****`;输入 null → 输出 `'未绑定'`。理由: M1 仅中国号(`+86`),但 generic 实现不增成本;未来 ADR-0016 接国际号(M3+)时无需重写;首 3 末 4 是 GSMA E.164 通行规则。**FR-010 已同步修订为 generic 描述。**
- **CL-003 — `disabled` 项 `opacity 0.5` vs 占位 UI 4 边界**(UX 内部矛盾)→ **(B) 保留 `opacity 0.5` 为占位常量**:per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 占位 UI 4 边界第 4 项明文允许"状态机视觉指示";具体 0.5 vs 0.4 vs 0.6 PHASE 2 mockup 决,但需有可视差异。理由: `disabled` 是状态机指示(enabled / disabled 二态),非自由视觉决策。**FR-006 已加脚注澄清"0.5 是占位常量,PHASE 2 mockup 替换"。**
- **CL-004 — 埋点是否本 spec 引入**(Observability)→ **(B) 不加** — 本 spec 是 M1.X UI shell;埋点 infra 由 M1.3 单独引入(per PRD account-center.v2 § 5.9);提前埋点会与 M1.3 埋点 SDK 选型冲突;`console.warn` for logoutAll 失败是诊断日志非埋点。理由: 范围切分清晰。**Out of Scope 段已同步加显式条目。**

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 已登录用户从 ⚙️ 进入设置主页(Priority: P1)

已登录用户在 `(tabs)/profile` 点击顶 nav ⚙️ → `router.push('/(app)/settings')` → settings stack push → settings/index 渲染含 3 个 list cards + footer 法规链接 + 顶 nav 返回 + 标题"设置";底 tab bar 自动隐藏(stack 在 `(tabs)/` 之外,per spec A CL-002 (b))。

**Why this priority**: A → B 主路径,所有用户从 spec A ⚙️ 进入设置的入口路径。

**Independent Test**: vitest + RTL → 渲染 settings/index → 断言 3 cards 渲染 + footer 双链接渲染 + 顶 nav 含返回箭头 + 集成测验证 `_layout.tsx` 配置正确(底 tab bar 由 Expo Router 自动管理)。

**Acceptance Scenarios**:

1. **Given** 用户在 `(tabs)/profile`,**When** tap ⚙️,**Then** router.push '/(app)/settings' + settings/index 渲染
2. **Given** settings/index render 完成,**When** 检查 list 结构,**Then** 渲染 3 cards: 第一卡(账号与安全 1 项)/ 第二卡(通用 / 通知 / 隐私与权限 / 关于 4 项 disabled)/ 第三卡(切换账号 disabled / 退出登录 2 项)
3. **Given** settings/index render 完成,**When** 检查 footer,**Then** 渲染 2 链接《个人信息收集与使用清单》《第三方共享清单》
4. **Given** settings/index 在 stack 中,**When** 检查底 tab 可见性,**Then** 底 tab 不可见(per spec A CL-002 (b))
5. **Given** settings/index 顶 nav,**When** 检查标题与返回,**Then** 标题"设置" + 左 `<` 返回箭头(Expo Router Stack 默认提供)

---

### User Story 2 — 进入账号与安全子页(Priority: P1,并列)

settings/index 主页 → tap 账号与安全 → router.push '/(app)/settings/account-security' → account-security/index 渲染 3 cards;顶 nav 标题"账号与安全",**无 ID 行 / 无 🎧 客服 icon**(per notes.md § 04 / 反枚举 SC-005 / M1 无客服系统)。

**Why this priority**: B 子段主导航 + 反枚举不变性验证。

**Independent Test**: vitest + RTL → 渲染 account-security/index → 断言 3 cards 渲染 + 顶 nav 标题正确 + 不含 account.id 数字渲染(grep `accountId` 不在 `<Text>` 内 + grep `\d{7,11}` 0 命中)。

**Acceptance Scenarios**:

1. **Given** 用户在 settings/index,**When** tap "账号与安全",**Then** router.push '/(app)/settings/account-security' + account-security/index 渲染
2. **Given** account-security/index render 完成,**When** 检查 cards,**Then** 渲染 3 cards: 第一卡(手机号 / 实名认证 disabled / 第三方账号绑定 disabled,3 项)/ 第二卡(登录设备与授权管理 disabled,1 项)/ 第三卡(注销账号 / 安全小知识 disabled,2 项)
3. **Given** 同上,**When** grep `<Text>{accountId}</Text>` / `<Text>ID:` 字串,**Then** 0 命中(反枚举不变性,per notes.md § 04)
4. **Given** 同上,**When** 检查顶 nav 右侧,**Then** 无 🎧 客服 icon(已删,per notes.md § 04)

---

### User Story 3 — 用户查看手机号 mask(Priority: P1,并列)

account-security/index → tap "手机号" 行 → router.push '/(app)/settings/account-security/phone' → phone screen 渲染 mask `+86 138****5678`(从 store 读 phone + 客户端 mask)。

**Why this priority**: 手机号是账号 identity 主键(per ADR-0016 / PRD § 2.1),用户需能看到当前绑定。

**Independent Test**: vitest + RTL → mock store phone="+8613812345678" → 渲染 phone screen → 断言渲染 `+86 138****5678`(中段 mask) + 不含明文 phone 任何 7 位连续子串。

**Acceptance Scenarios**:

1. **Given** store phone="+8613812345678",**When** phone screen render,**Then** 渲染 mask `+86 138****5678`(保留首 3 位 + 末 4 位,中 4 位 `****`,首尾以空格分隔国家码)
2. **Given** store phone=null(罕见,理论上 ADR-0016 起 phone 必有,但 store 类型可空作兼容防御),**When** phone screen render,**Then** 渲染 fallback "未绑定"(降级,不闪 onboarding)
3. **Given** 用户在 phone screen,**When** tap 顶 nav `<` 返回,**Then** stack pop 回 account-security/index
4. **Given** phone screen,**When** grep 明文 phone 子串(`13812345678` / 任何 7+ 位连续数字),**Then** 0 命中(反枚举不变性)

---

### User Story 4 — 退出登录正常路径(Priority: P1,并列)

settings/index 第三卡 → tap "退出登录" → `Alert.alert('确定要退出登录?', undefined, [取消, 确定])` → 用户点"确定" → 调用 `logoutAll()`(`POST /auth/logout-all`) → 清本地 token / displayName / phone → `router.replace('/(auth)/login')`。

**Why this priority**: 设置页主真功能(其他都是入口 / 占位);失败会让用户进入死状态。

**Independent Test**: vitest + msw mock `POST /auth/logout-all` 返 204 + spy `Alert.alert` → fireEvent tap "退出登录" → 模拟 Alert "确定" callback 触发 → 断言 logoutAll 被调用 + auth store 清空 + router.replace 调用为 '/(auth)/login'。

**Acceptance Scenarios**:

1. **Given** 用户已登录,**When** tap "退出登录",**Then** Alert 弹出标题"确定要退出登录?" + 双按钮(取消 / 确定)
2. **Given** Alert 弹出,**When** 用户点"取消",**Then** Alert 关闭 + 用户停留 settings/index + 无任何 store / router 副作用
3. **Given** Alert 弹出,**When** 用户点"确定",**Then** 顺序: ① 调用 `logoutAll()` → ② store.clear() / 等价 reset → ③ `router.replace('/(auth)/login')`(顺序保证 logoutAll 失败时本地仍清,见 US5)

---

### User Story 5 — 退出登录 server 失败容错(Priority: P1,并列)

`logoutAll()` 因 server 5xx / 网络错误 reject → catch 吞错 → 仍清本地 + 跳 login(best-effort,per Q3)。

**Why this priority**: 退出登录是不可逆 UX 期望,server 临时不可用不该卡死;反之卡用户在已"心理退出"状态会引导用户强行清缓存破坏 install state。

**Independent Test**: vitest + msw mock `POST /auth/logout-all` 返 503 → fireEvent 走完 US4 路径 → 断言 logoutAll 抛错 + store 仍清 + router.replace 仍调用为 '/(auth)/login' + console.warn 含 logoutAll 错误日志。

**Acceptance Scenarios**:

1. **Given** logoutAll() reject(server 503 / 网络断),**When** US4 catch 块捕获,**Then** swallow error(console.warn log) + store.clear() + router.replace 仍执行
2. **Given** 用户已登出,**When** 重新打开 app,**Then** AuthGate 第一态(`!authed`)→ 跳 /(auth)/login(本 spec 不验,沿用 onboarding spec 既有 SC)

---

### User Story 6 — disabled 占位项(Priority: P2)

用户 tap 设置主页 / 账号与安全页中任一 disabled 项(共 9 项: 设置主页 5 + 账号与安全 4)→ 无任何反馈(无 router / 无 alert / 无 toast)。

**Why this priority**: 占位入口可见性 + 防误用;真功能后置 spec(各起子 spec)。

**Independent Test**: vitest + RTL → render 各页 → fireEvent.press 各 disabled 项 → 断言无 router 调用 + 无 Alert 调用 + 视觉上 opacity reduced + a11y `disabled=true`。

**Acceptance Scenarios**:

1. **Given** 任一 disabled 项渲染,**When** 检查视觉,**Then** opacity 减(具体值 PHASE 2 mockup 决,占位用 0.5);**When** 检查 a11y,**Then** `accessibilityState.disabled=true` 已设
2. **Given** 同上,**When** 用户 tap,**Then** 无 router.push / router.replace 调用 + 无 Alert.alert / Toast 调用(无 `onPress` handler 即 noop)
3. **Given** screen reader 读到 disabled 项,**When** 听 a11y,**Then** 含"已停用"系统标记(由 RN 默认 disabled state 处理)

---

### User Story 7 — 法规页静态占位(Priority: P2,并列)

settings/index footer → tap 任一法规链接 → router.push 对应 legal route → 法规页渲染标题 + 一行占位文案(per Q6 决议)。

**Why this priority**: 合规可见性 — 即使内容是占位,链接可达性是 M3 内测前合规要求最小信号(用户能看到入口而非 broken 链接)。

**Independent Test**: vitest + RTL → 渲染 settings/index → fireEvent tap 各 footer 链接 → 断言 router.push 路径正确 + legal page render 含标题 + 占位文案。

**Acceptance Scenarios**:

1. **Given** settings/index footer,**When** tap "《个人信息收集与使用清单》",**Then** router.push '/(app)/settings/legal/personal-info' + 页面渲染标题"《个人信息收集与使用清单》" + 正文"本清单内容由法务团队定稿后填入,预计 M3 内测前完成。"
2. **Given** 同上,**When** tap "《第三方共享清单》",**Then** 类似流程,目标路径 '/(app)/settings/legal/third-party'
3. **Given** 法规页 render 完成,**When** tap 顶 nav `<` 返回,**Then** stack pop 回 settings/index

---

### User Story 8 — 注销账号入口(B → C 衔接,Priority: P1,并列)

account-security/index 第三卡 → tap "注销账号" → router.push '/(app)/settings/account-security/delete-account';目标实现是 spec C 范围,本 spec 仅声明 push 路径不预占位 page surface(per spec A 决策 4 同款 — 不污染下游 spec surface)。

**Why this priority**: B → C 衔接,链路验证;spec C impl 落地后 push 立即可用,本 spec 落地期间 dev warning(目标 route 缺失)接受。

**Independent Test**: vitest + RTL → 渲染 account-security/index → fireEvent tap "注销账号" → 断言 router.push 调用为 '/(app)/settings/account-security/delete-account'(目标实现在 spec C,本 spec 仅断言路径)。

**Acceptance Scenarios**:

1. **Given** account-security/index render 完成,**When** 用户 tap "注销账号",**Then** router.push '/(app)/settings/account-security/delete-account'
2. **Given** spec C 未实现(目标 route 缺失),**When** 用户 tap,**Then** Expo Router 行为容错(导航失败不 crash;此期间用户视觉上停留账号与安全页;实际 spec C impl 会让 route 存在)

---

### User Story 9 — Stack 返回行为(Priority: P2)

用户在 settings stack 任意层 tap 顶 nav `<` 返回 → stack pop 一层。

**Why this priority**: 沿用 Expo Router Stack 默认行为,验证以确保不被错误覆盖(如自定义 backBehavior 等)。

**Independent Test**: 集成测 — render settings/index → push 'account-security' → push 'phone' → pop pop pop → URL 应为 (tabs)/profile + 底 tab 重新可见。

**Acceptance Scenarios**:

1. **Given** 用户在 phone screen,**When** tap 顶 nav `<`,**Then** stack pop → URL 为 account-security/index
2. **Given** 用户在 account-security/index,**When** tap 顶 nav `<`,**Then** stack pop → URL 为 settings/index
3. **Given** 用户在 settings/index,**When** tap 顶 nav `<`,**Then** stack pop → URL 为 (tabs)/profile + 底 tab bar 重新可见
4. **Given** Android 用户在 settings stack 任意层,**When** 按硬件 back 键,**Then** 行为同 `<`(Expo Router 默认 hardware back 接管 stack pop)

---

### Edge Cases

- **未登录用户 deep link 直接访问 `/(app)/settings/*`**: AuthGate 第一层拦截 → router.replace `/(auth)/login`(per spec A FR-016 同款逻辑;本 spec 不重复实现 auth 检查)
- **logoutAll 调用中,用户重复 tap "退出登录"**: 第二次 tap 应被忽略(可能 race);plan.md 决定是否加 isLoading guard(简单实现 = `useState`)
- **phone store 为 null**(理论 ADR-0016 起不该出现,但兼容防御): phone screen 渲染 fallback "未绑定";不闪 onboarding(由 AuthGate 上层处理)
- **法规页 deep link**(`/(app)/settings/legal/personal-info` 直接访问): 与 stack push 行为一致;返回去到 settings/index(stack 默认 fallback)/(tabs)/profile;具体由 Expo Router Stack initialRouteName 决定,plan.md 验
- **小屏 / 长 label 文字溢出**: `numberOfLines=1` + `ellipsizeMode='tail'`(沿用 spec A Edge Cases);M1 中文 only,M3+ i18n 评估
- **Android hardware back 在 settings stack**: 默认 Expo Router 接管 stack pop(US9 已覆盖)
- **横屏旋转**: M1 仅竖屏(沿用 spec A);本 spec 不处理
- **`Alert.alert` 在 RN Web 行为**: RN Web `Alert.alert` 自带 polyfill(基于 `window.confirm`),按钮 callback 行为相同,但 destructive style 视觉降级(see Open Question 3);Playwright 冒烟测验证 web bundle 行为符合预期
- **退出登录后返回历史**: `router.replace('/(auth)/login')` 已替换 history,用户按 back 键不应回到 settings(已被覆盖);沿用 RN 默认行为

---

## Functional Requirements _(mandatory)_

| ID     | 需求                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-001 | 新建 settings 路由组:8 个文件结构详见 Q1 决议代码块;路由位于 `(tabs)/` 之外,Expo Router 自动隐藏底 tab bar(per spec A CL-002 (b))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| FR-002 | settings/\_layout.tsx + account-security/\_layout.tsx + legal/\_layout.tsx:Stack;screenOptions `headerShown=true`;每 page 标题由各 screen 通过 `Stack.Screen options.title` 覆盖(设置 / 账号与安全 / 手机号 / 《个人信息收集与使用清单》/ 《第三方共享清单》);返回箭头 `<` 走 Expo Router Stack 默认                                                                                                                                                                                                                                                                                                                                                                     |
| FR-003 | settings/index.tsx:渲染 3 cards + footer 双链接;具体结构见 Q1(理由段)+ User Story 1 acceptance scenario 2;每行 `<Pressable>` 含 `accessibilityRole='button'` + `accessibilityLabel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| FR-004 | settings/index 导航 onPress: "账号与安全 >" → `router.push('/(app)/settings/account-security')`;"《个人信息收集与使用清单》" → `router.push('/(app)/settings/legal/personal-info')`;"《第三方共享清单》" → `router.push('/(app)/settings/legal/third-party')`                                                                                                                                                                                                                                                                                                                                                                                                            |
| FR-005 | settings/index "退出登录" 行 onPress: `Alert.alert('确定要退出登录?', undefined, [{text:'取消',style:'cancel'},{text:'确定',style:'destructive',onPress:handleLogout}])`;handleLogout 顺序: ① `try { await logoutAll(); } catch (e) { console.warn('[settings] logoutAll failed', e); }` → ② **由 logoutAll 内部 finally 块负责清 session**(等价 5 字段清单 `accessToken / refreshToken / displayName / accountId / phone`,per plan 决策 2 + 8;UI **不重复**调用 clearSession) → ③ `router.replace('/(auth)/login')`(逐步执行,catch 后 router.replace 仍跑,per US4-acceptance-3 + US5)                                                                                   |
| FR-006 | disabled 项 pattern(应用于 settings/index 5 项 + account-security/index 4 项):`<Pressable>` 不带 `onPress`(或 `onPress={undefined}`)+ `accessibilityState={{disabled:true}}` + **`opacity: 0.5`(占位常量,per CL-003 — ADR-0017 占位 UI 4 边界第 4 项允许的"状态机视觉指示";具体灰度 / 文字色由 PHASE 2 mockup 决,但需保持可视差异)**                                                                                                                                                                                                                                                                                                                                     |
| FR-007 | account-security/index.tsx:渲染 3 cards;具体结构见 User Story 2 acceptance scenario 2;手机号行渲染 mask `+86 138****5678`(per FR-012);"注销账号" 行 → `router.push('/(app)/settings/account-security/delete-account')`(目标 spec C);**无 ID 行 / 无右侧 🎧 客服 icon**(per notes.md § 04)                                                                                                                                                                                                                                                                                                                                                                                |
| FR-008 | account-security/phone.tsx:仅渲染 mask 文本(顶 nav stack header 提供"手机号"标题);无修改入口、无提示文案、无返回按钮(由 stack header 提供 per FR-002)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| FR-009 | legal/personal-info.tsx + legal/third-party.tsx:页 title 由 stack header 提供(per FR-002);正文单 `<Text>` 含占位文案"本清单内容由法务团队定稿后填入,预计 M3 内测前完成。"(per Q6);包裹在 `<ScrollView>` 内(future-proof,per Open Question 8 倾向)                                                                                                                                                                                                                                                                                                                                                                                                                        |
| FR-010 | 手机号 mask 函数 `maskPhone(phone: string \| null): string`(国码白名单实现,per CL-002 + plan 决策 6 + **T3 升级决策 A,2026-05-07**):国码 prefix 用 longest-first 白名单 lookup 识别(M1 cover `+86 / +44 / +1 / +852 / +886 / +81 / +82 / +7` 8 个),local 部分必须纯数字 + 长度 ≥ 7;保留国码 + 本地号首 3 + 末 4 + 中段 mask 为 `****`(至少 4 个 `*`);输入 null/empty/无国码/含空格/out-of-list → 输出 `'未绑定'`;典型: `+8613812345678` → `+86 138****5678`、`+15551234567` → `+1 555****4567`、`+447123456789` → `+44 712****6789`;实现:`apps/native/lib/format/phone.ts`(per plan 决策 6)。原 generic `\d{1,3}` regex 因贪心匹配国码不可行,详见 plan 决策 6 升级注释。 |
| FR-011 | auth store 字段:`useAuthStore` 加 `phone: string \| null` 字段(per plan 决策 1 — 既有 store 不含此字段,本 spec 落地需扩展);`setPhone` action 加;`loadProfile` 同时 `setPhone(response.phone ?? null)`;persist `partialize` 加 phone(防 cold-start flicker);`clearSession` 加清 phone(per plan 决策 8)                                                                                                                                                                                                                                                                                                                                                                    |
| FR-012 | 占位 UI 4 边界(per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 强制纪律):路由结构(FR-001) ✓ / 单层 form-equivalent 输入(本 spec 无 input — 替代为 list 行 tap)/ 提交事件(替代为 router.push / `Alert.alert` confirm)/ 状态机视觉指示(disabled opacity 0.5 / Alert 双按钮)/ 错误展示位(本 spec 无网络请求展示 — logoutAll 失败走 console.warn 不进 UI);**全裸 RN,禁引 packages/ui 新抽组件**;每 page 顶 `// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.` banner                                                                                                                                          |
| FR-013 | 不引入新 packages/ui 抽象组件(如 `<SettingsListCard>` / `<ListRow>` 等);新组件 PHASE 2 mockup 落地后再评估;现有 `<Spinner>` 等可复用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| FR-014 | i18n 不引入(per CLAUDE.md M1 现状);所有文案硬编中文,但**集中在 page top const**(如 `const COPY = { logout: '退出登录', logoutConfirm: '确定要退出登录?', logoutCancel: '取消', logoutOk: '确定', ... }`)以方便后续抽离                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| FR-015 | a11y:list 行 `accessibilityRole='button'`(因 tap 触发导航 / 操作)+ `accessibilityLabel`(读出文字 + 状态);disabled 项 `accessibilityState.disabled=true`;Stack 顶 nav 返回箭头 a11y 由 Expo Router 默认提供                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| FR-016 | SafeArea 适配:Stack 顶 nav 由 Expo Router 默认处理 SafeArea top inset;page 内容用 `<ScrollView>` 或 `<View>` + `useSafeAreaInsets()` 处理底部 inset(底 tab bar 隐藏后底部 padding 调整,plan.md 验)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| FR-017 | 未登录态由 AuthGate 第一层处理(per spec A FR-016 / spec onboarding FR-001):未登录用户 deep link 直接访问 `/(app)/settings/*` → AuthGate 拦截 → `router.replace('/(auth)/login')`;settings 各 screen 自身**不**做 auth 判断                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| FR-018 | 反枚举不变性:account-security/index + phone screen **不渲染** `account.id` 任何数字;phone screen mask 后**不含**明文 phone 任何 7+ 位连续子串;grep 静态分析(per SC-005)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| FR-019 | logout race guard:`handleLogout` 内用**组件** `useState<boolean>` isLoading flag(per plan 决策 9 — 单 page race 不污染 store),调用中重复 tap 忽略(防 race);Pressable `disabled={isLoading}` + `opacity 0.5`(占位常量,per CL-003)+ a11y `accessibilityState={{disabled, busy}}`                                                                                                                                                                                                                                                                                                                                                                                           |
| FR-020 | 文案集中常量:每 page 顶 `const COPY = { ... }` 集中所有用户可见文案;disabled 项不写"敬请期待"等暗示文案,仅显示功能名(如"通用" / "切换账号"),靠 a11y disabled 状态传达                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## Success Criteria _(mandatory)_

| ID     | 标准                                                                                                                                                                                                         | 测量方式                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| SC-001 | User Story 1-9 全部 happy path 单测通过                                                                                                                                                                      | `pnpm --filter native test` + `pnpm --filter @nvy/auth test` 全绿                         |
| SC-002 | 退出登录 best-effort 容错:msw mock POST /auth/logout-all 503 → store 仍清 + router.replace 仍调用 + console.warn 触发(per US5)                                                                               | vitest + msw                                                                              |
| SC-003 | 占位 UI 0 视觉决策:8 文件不含 hex / px / rgb 字面量 / 复杂样式属性(除 `flex` / `padding` 等基础布局)/ 新 packages/ui import                                                                                  | grep 静态分析(per `(tabs)/profile.tsx` SC-004 同款 pattern)                               |
| SC-004 | 嵌套路由树 8 文件齐全:文件清单(per Q1)git diff 验证;Expo Router 自动识别 nested stack;集成测覆盖路由可达性                                                                                                   | git diff + 集成测                                                                         |
| SC-005 | 反枚举不变性:account-security 不渲染 account.id 数字;phone screen 不含明文 phone 7+ 位连续子串                                                                                                               | grep 静态分析:`rg "accountId" apps/native/app/\(app\)/settings/` + `rg "\d{7,11}"` 0 命中 |
| SC-006 | 真后端冒烟:Playwright 跑(已 onboarded 用户)→ tap ⚙️ → settings/index → tap "账号与安全" → account-security/index → tap "手机号" → phone(mask)→ 返回 → 退出登录 → Alert 弹 → 确定 → 跳 /(auth)/login;截图归档 | 手动跑 + `runtime-debug/2026-05-XX-account-settings-shell-business-flow/`                 |
| SC-007 | 底 tab bar 在 settings stack push 后隐藏(per spec A CL-002 (b)):Playwright 冒烟测中底 tab bar 不可见;返回 (tabs)/profile 后重新可见                                                                          | manual review + Playwright assertion                                                      |
| SC-008 | Alert 退出登录 confirm:US4 acceptance scenario 1-3 全绿;`Alert.alert` 标题 / 按钮 label / cancel 行为 / destructive 行为单测断言                                                                             | vitest mock `Alert.alert`                                                                 |
| SC-009 | B → C 衔接占位:account-security/index "注销账号" tap → router.push '/(app)/settings/account-security/delete-account'(spec C 未实现期间容错不 crash)                                                          | vitest + Playwright 冒烟(catch dev warning)                                               |
| SC-010 | 法规页可达性 + 内容正确:settings/index 双链接 → 各 legal page 渲染含标题(《...清单》)+ 占位文案(per Q6);返回行为正常                                                                                         | vitest + 集成测                                                                           |
| SC-011 | disabled 占位项不导航:9 项 disabled 子项(5 + 4)tap 时无 router 调用 + `accessibilityState.disabled=true` 静态断言                                                                                            | vitest + grep                                                                             |
| SC-012 | logout race guard:logout 调用中 isLoading=true 时第二次 tap "退出登录" 忽略;单测断言 logoutAll 仅被调用 1 次                                                                                                 | vitest                                                                                    |

---

## Out of Scope(M1.X 显式不做)

- **mockup / 视觉完成**(per ADR-0017 类 1 流程,PHASE 2 后置)— 占位 UI 阶段不做精确间距 / 颜色 / 字号 / 阴影 / list card 视觉风格 / Alert 自定义 modal / 法规页排版 / 手机号 mask 图标装饰
- **设置页 disabled 子项实际功能**(通用 / 通知 / 隐私与权限 / 关于 / 切换账号)— 各起子 spec
- **账号与安全 disabled 子项实际功能**(实名认证 / 第三方账号绑定 / 登录设备与授权管理 / 安全小知识)— 各起子 spec(第三方账号绑定 server M1.3 已有 `BindGoogleUseCase` 等,前端 UI 后置)
- **修改手机号 UI**(server endpoint 实现状态未知;涉及双号验证流程,见 PRD § 4.x)— 单起 spec
- **法规文档实际内容**(法务团队 M3 内测前定稿)— 法务工作,非 spec 工作
- **注销账号 UI 实现**(SMS 触发 + 6 位码 + 双确认)— spec C
- **解封 UI**(FROZEN 用户登录拦截弹窗)— spec C 的另一半(in login flow)
- **packages/ui 新抽组件**(`<SettingsListCard>` / `<ListRow>` 等)— PHASE 2 mockup 后评估
- **顶 nav 自定义视觉**(色 / 字号 / 阴影)— PHASE 2 mockup
- **国际化 i18n** — M3+
- **iOS / Android 真机渲染验证** — M2.1
- **横屏 / 大屏适配** — M2+
- **埋点 / Telemetry 引入**(per CL-004)— 埋点 infra 由 M1.3 单独引入(per PRD account-center.v2 § 5.9);本 spec 不加 `logout_click` / `account_delete_init` 等事件;`console.warn` 仅作诊断日志非埋点

---

## Assumptions & Dependencies

- **AuthGate 既有**(per spec onboarding FR-001 + spec my-profile FR-002):未登录态拦截不变;本 spec 不改 auth 决策
- **`packages/auth` 既有 + 本 spec 扩展**:
  - `useAuthStore` 含 `displayName / accessToken / refreshToken / accountId` 已 persist(per onboarding)
  - **`phone` 字段由本 spec 新增**(per plan 决策 1):store 加 `phone: string \| null` + `setPhone` action;`loadProfile` 写入;persist `partialize` 加 phone;`clearSession` 加清 phone
  - `logoutAll()` 既有,**已 try/finally 内部 clearSession**(grep 确认,per plan 决策 2);**不**自动跳路由,UI 层负责 router.replace
  - `clearSession` action 既有,本 spec 扩展含 phone(per plan 决策 8);UI 层不直接调用 clearSession(由 logoutAll 内部 finally 触发)
- **`packages/api-client` 既有 `getAccountProfileApi().getMe()`**(per onboarding):本 spec 不直接调,phone 从 store 读
- **Expo Router Stack 能力**:Expo Router v6+ Stack 文档 — 既有依赖
- **`react-native` Alert API**:RN 内置,跨端兼容(iOS / Android / RN Web 自带 polyfill)
- **`react-native-safe-area-context`** 既有(per onboarding 用法)
- **mockup PHASE 2** 由 Claude Design 单独产出后回填 plan.md UI 段;本 PR **不**等 mockup
- **server 端 0 工作量**:`/auth/logout-all` + `/accounts/me` 全部已落地
- **spec A 已 ship**(my-profile,PR #68 / #70 / #71):本 spec 入口 `/(app)/settings` 已被 spec A FR-005 占位 push,本 spec 落地后 push 目标存在
- **spec C 后续 PR 落地**:本 spec 仅占位 `router.push('/(app)/settings/account-security/delete-account')`,目标缺失时 Expo Router 容错(navigate to undefined route 行为按 framework 默认 — 不 crash)

---

## Open Questions

| #   | 问                                                                                       | 决议                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `useAuthStore` 是否已含 `phone` 字段?                                                    | ✅ plan 决策 1:grep 确认 store **不含** phone;plan 决采用 (A) store 加 `phone: string \| null` + `setPhone` + persist partialize + clearSession 同步,`loadProfile` 写入(`setPhone(response.phone ?? null)`);onboarding 既有测试不破坏          |
| 2   | `logoutAll()` 调用契约(是否自带 router 跳转 / 清 store)                                  | ✅ plan 决策 2:grep `packages/auth/src/usecases.ts` 确认 logoutAll **已 try/finally 内部 clearSession**(server 失败仍清);**不**自动跳 router(UI 负责);UI handleLogout 简化:try logoutAll catch warn → router.replace,**不重复**调 clearSession |
| 3   | `Alert.alert` destructive style 在 RN Web 表现                                           | ✅ plan 决策 5:RN Web `window.confirm` polyfill **不区分** cancel / destructive style;**接受降级**(占位 UI 阶段),callback 业务行为跨端一致;PHASE 2 mockup 评估自定义 modal                                                                     |
| 4   | settings stack 顶 nav 标题用 expo-router `Stack.Screen` options 配 vs 自定义 header 组件 | ✅ plan 决策 3:**(a) Expo Router 默认 header**(占位 UI 阶段)+ 各 screen `Stack.Screen options.title` 设标题(`'设置'` / `'账号与安全'` / `'手机号'` / `'《...清单》'`);PHASE 2 mockup 落地若需统一视觉迁移自定义 header                         |
| 5   | 嵌套 stack 是否合并(legal/\_layout / account-security/\_layout 是否需要)                 | ✅ plan 决策 4:**保留 8 文件嵌套结构**(独立子 stack);理由:future 扩展(实名认证 / 第三方绑定 / 登录设备管理 等 disabled 子项进 `account-security/` 子目录、legal 多份清单进 `legal/` 子目录);alternative 扁平 6 文件方案拒绝                    |
| 6   | phone screen 顶 nav 标题是 "手机号" 还是 mask 本身?                                      | ✅ plan 决策 3 + 7 隐含:`Stack.Screen options.title='手机号'`(标题描述);content 区显 mask;PHASE 2 mockup 阶段重新评估                                                                                                                          |
| 7   | logoutAll 失败 console.warn 是否需告警上报                                               | 🟡 PHASE 1:仅 console.warn(本地日志);PHASE 2 / M2 引入 Sentry 等错误上报后再评估;不 block 当前实现                                                                                                                                             |
| 8   | 法规页是否要 `<ScrollView>`(单行文案似不需要)                                            | ✅ plan 决策 7 + T8 实现:用 `<ScrollView>` 包裹 future-proof(法务定稿可能很长);占位 UI 阶段成本忽略不计                                                                                                                                        |

---

## 变更记录

- **2026-05-07**:本 spec 首次创建。基于 spec A `(my-profile)` design/inspiration/notes.md § "B. account-settings-shell" 详细决策(IA / 保留删除清单 / disabled 子项语义)+ plan.md § 衔接边界 + PRD account-center.v2.md(M1.1 / M1.2 / M1.3 endpoint + 反枚举要求)+ 用户对话 6 项 Q&A 对齐(路由嵌套 / Alert confirm / best-effort 容错 / 仅 mask / disabled 一致 pattern / 法规极简一行)。spec 阶段产出业务流 / 占位 UI 边界 / 嵌套路由结构(8 文件)/ a11y / 反枚举不变性 / 退出登录 best-effort 容错 / B → C 衔接占位;PHASE 2 mockup 由 Claude Design 单独产出后回填 plan.md UI 段。本 spec 是 SDD 拆分链 A → B → C 的 B,衔接 spec A(已 ship,PR #68 / #70 / #71)+ spec C(`delete-account-cancel-deletion-ui`,后置 PR)。
- **2026-05-07 +1**:`/speckit.clarify` round 1 — 追加 4 项 Cross-cutting Clarifications(CL-001 ~ CL-004):退出登录 store 清 5 字段清单(CL-001)/ `maskPhone` generic 实现(CL-002)/ `opacity 0.5` 是占位常量明确归属 ADR-0017 4 边界第 4 项(CL-003)/ 埋点不在本 spec(CL-004)。同步修订: FR-005 加显式清字段清单 / FR-006 加 opacity 占位常量脚注 / FR-010 改 generic mask 实现 / Out of Scope 加埋点显式条目。
- **2026-05-07 +2**:plan.md 落地(10 关键决策)+ tasks.md 落地(11 impl tasks)+ `/speckit.analyze` round 1 完成 — spec / plan / tasks 跨文件一致性扫描通过。spec.md 同步修订 5 处:FR-005 ② 步改"由 logoutAll 内部 finally 块负责"(per plan 决策 2 + 8)/ FR-011 改"phone 字段本 spec 新增"(per plan 决策 1)/ FR-019 加 useState isLoading 实现细节(per plan 决策 9)/ Open Q1 ~ Q8 各项标 ✅(plan 决)/ 🟡(plan-impl 阶段决,Q7 是 PHASE 2 / M2)/ Assumptions & Dependencies `packages/auth` 段改"既有 + 本 spec 扩展"对齐 plan 决策。Phase 1 Doc session 收尾 — 4 文件 ready for impl。
- **2026-05-07 +3**:Phase 2 impl 完成(T1 ~ T9,T10 🟡 blocked on staging deploy 留后续小 PR)。spec.md 同步修订:FR-010 maskPhone 实现描述从 "generic regex" 改为 "国码白名单 8 prefix"(T3 RED 阶段发现原 `\d{1,3}` regex 贪心匹配国码,详见 plan 决策 6 升级注释);plan 决策 6 实现段升级国码白名单。tasks.md 各 task 状态全勾 ✅(T10 仍 🟡)。spec / impl drift 已 zero。Phase 2 impl session 收尾,等 PR push + CI + auto-merge。
