# Implementation Plan: Account Settings Shell (M1.X — 设置入口 + 账号与安全 + 法规占位)

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-07(per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程)
**Status**: Draft(pending impl;PHASE 2 mockup 后回填 UI 段)
**Phase**: SDD 拆分链 A/B/C 的 **B**(account-settings-shell);上承 spec A(my-profile,已 ship PR #68 / #70 / #71),下接 spec C(`delete-account-cancel-deletion-ui`,后置 PR)

> per ADR-0017 类 1 流程分阶段:本 PR docs / 下 session impl 业务流 + 占位 UI / 再下 session mockup PHASE 2 → UI 完成。本 plan UI 段为占位版(4 边界条目);mockup 落地后回填完整 UI 段。

---

## 数据流

### 入口 + 路由树

```text
(tabs)/profile (spec A,已 ship)
   │ tap ⚙️
   ▼
router.push('/(app)/settings')
   │
   ▼
settings/_layout.tsx (新建,Stack 顶层)
   │   <Stack screenOptions={{ headerShown: true }}>
   │     ├─ Screen "index"            → 设置主页(标题"设置")
   │     ├─ Screen "account-security" → 子 Stack(account-security/_layout.tsx)
   │     │     ├─ Screen "index"       → 账号与安全(标题"账号与安全")
   │     │     └─ Screen "phone"       → 手机号 mask(标题"手机号")
   │     └─ Screen "legal"            → 子 Stack(legal/_layout.tsx)
   │           ├─ Screen "personal-info" → 标题"《个人信息收集与使用清单》"
   │           └─ Screen "third-party"   → 标题"《第三方共享清单》"
   │
   ▼
settings/index.tsx 设置主页
   │   3 cards + footer:
   │     Card 1: 账号与安全 >
   │     Card 2: 通用 / 通知 / 隐私与权限 / 关于(4 项 disabled)
   │     Card 3: 切换账号(disabled)/ 退出登录
   │     Footer: 《个人信息收集与使用清单》《第三方共享清单》
```

### 退出登录数据流

```text
User taps "退出登录" 行
   │
   ▼
Alert.alert("确定要退出登录?", undefined, [
  { text: '取消', style: 'cancel' },
  { text: '确定', style: 'destructive', onPress: handleLogout }
])
   │ user 点取消 → 关闭 Alert,流终止(无副作用)
   │ user 点确定 → handleLogout()
   ▼
isLoading=true (race guard,per 决策 9)
   │
   ▼
try { await logoutAll() }                   // packages/auth 既有
   │   ┌─ POST /auth/logout-all (server)
   │   ├─ try block 失败 → catch → console.warn (best-effort)
   │   └─ finally 跑: useAuthStore.getState().clearSession()
   │      ★ 关键:即使 server 失败,clearSession 由 logoutAll 内部 finally 保证 ★
   ▼
router.replace('/(auth)/login')             (顺序保证 catch 后步骤仍跑)
   │
   ▼
组件 unmount(由 router.replace 触发);isLoading 状态随 unmount 失效
```

### 手机号 mask 数据流

```text
User taps "手机号" 行 (account-security/index)
   │
   ▼
router.push('/(app)/settings/account-security/phone')
   │
   ▼
phone screen mount → useAuthStore(s => s.phone) 读取
   │
   ▼
maskPhone(phone) → "+86 138****5678" 或 "未绑定"
   │
   ▼
渲染 <Text>{masked}</Text>
```

---

## 状态机

### settings stack 导航状态机

```text
(tabs)/profile [起点]
  │ tap ⚙️
  ▼
settings/index 主页
  │
  ├─ tap "账号与安全 >" → push → account-security/index
  │     │
  │     ├─ tap "手机号 >" → push → phone (mask)
  │     │     │ tap < 返回 → pop → account-security/index
  │     │
  │     ├─ tap "注销账号" → push → delete-account (spec C surface,占位)
  │     ├─ tap disabled (×4) → noop
  │     │ tap < 返回 → pop → settings/index
  │
  ├─ tap "《个人信息收集与使用清单》" → push → legal/personal-info
  │     │ tap < 返回 → pop → settings/index
  ├─ tap "《第三方共享清单》" → push → legal/third-party
  ├─ tap "退出登录" → Alert → confirm → logout flow → router.replace → /(auth)/login
  ├─ tap disabled (×5) → noop
  │ tap < 返回 → pop → (tabs)/profile (底 tab bar 重新可见)
```

### handleLogout 状态机

```text
idle (isLoading=false)
  │ user 在 Alert 上点 "确定"
  ▼
loading (isLoading=true)
  │ logoutAll() resolved (server 200/204)
  ├──────────────────► success → router.replace('/(auth)/login')
  │
  │ logoutAll() rejected (server 5xx / 网络断)
  └──────────────────► error caught → console.warn → router.replace('/(auth)/login')
                       ★ 注意:logoutAll 内 finally 已 clearSession,即使 reject
  │
  ▼
unmount(组件销毁,isLoading 状态消失)
```

---

## 关键技术决策(plan.md 收口)

### 决策 1 — `phone` 字段 store 扩展(per spec.md Open Q1 + CL-001)

**问题**:`useAuthStore` 当前 4 字段(`accountId / accessToken / refreshToken / displayName`)**不含 `phone`**。但 spec FR-009 + FR-011 要求 phone screen 从 store 读 phone。

**grep 结果**:

- `packages/auth/src/store.ts` AuthState 接口确认无 phone 字段
- `packages/auth/src/usecases.ts#loadProfile` 仅 `setDisplayName(response.displayName ?? null)`,不写 phone
- `getAccountProfileApi().getMe()` 生成 client 返回 displayName;phone 字段需 plan-impl 阶段查 OpenAPI generated type 验证(PRD § 2.1 + § 3.7 表明 /me 返完整 profile,大概率含 phone)

**候选方案**:

| 选项         | 实现                                                                                                                                     | 评估                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **(A) 推荐** | store 加 `phone: string \| null` + `setPhone` action;`loadProfile` 同时 `setPhone(response.phone ?? null)`;persist `partialize` 含 phone | 与 displayName 同款模式;改动小;persist 防 cold-start flicker |
| (B)          | 不动 store;phone screen mount 时调 `getMe()` 直接拉 phone 渲染                                                                           | 每次 mount 1 个网络请求;cold-start 后无持久化;不一致         |
| (C)          | 新增 `loadAccountProfile` wrapper 拉完整 profile;loadProfile 不改                                                                        | 新增 API surface 复杂                                        |

**决策**:**采用 (A)**。

**实现细节**:

- `packages/auth/src/store.ts` AuthState 加 `phone: string | null` + `setPhone(phone: string | null): void` action
- `clearSession()` 同步加 `phone: null`(per CL-001 显式 5 字段清单 + 决策 8)
- `packages/auth/src/usecases.ts#loadProfile` 改:`setDisplayName(...)` → 同时 `setPhone(response.phone ?? null)`
- persist `partialize` 加 `phone`(per displayName 同款理由,防 cold-start flicker)
- `index.ts` 不变(`useAuthStore` 通过 hook subscribe phone;`AuthState` 类型 export 自动含 phone)

**onboarding 测试影响评估**:

- onboarding spec 既有测试 mock `getMe()` response — plan-impl 阶段确认 mock 是否含 phone;若不含 → `setPhone(undefined ?? null) === setPhone(null)`,不破坏 displayName 主路径
- 测试加 `expect(useAuthStore.getState().phone).toBe('+86...')` 类断言

**OpenAPI generated type 验证步骤**(plan-impl 阶段执行):

```bash
rg "phone" no-vain-years-app/packages/api-client/src/generated/models/MeResponse.ts
# 期望命中: phone?: string;
```

若 schema 未含 phone → server 端补 `/me` response 加 phone(实际 server PRD § 3.7 已表明 /me 返完整 profile,极大概率已含)。本 plan 假设 schema 已含 phone(per PRD)。

---

### 决策 2 — `logoutAll()` 契约消费 + UI 调用顺序(per spec.md Open Q2)

**grep 结果**(`packages/auth/src/usecases.ts#logoutAll`):

```ts
export async function logoutAll(): Promise<void> {
  try {
    await getAuthApi().logoutAll();
  } finally {
    useAuthStore.getState().clearSession();
  }
}
```

**关键发现**:

1. logoutAll **不自动跳 router**(UI 层负责)
2. logoutAll **finally 块保证** clearSession 调用(无论 server 成功 / 失败 / 异常)
3. server 失败 → finally 跑 clearSession → 然后 error 抛出给调用方

**决策**:**UI 层 handleLogout 不重复调用 clearSession**(已被 logoutAll 内部 finally 替代):

```ts
async function handleLogout() {
  if (isLoading) return;
  setIsLoading(true);
  try {
    await logoutAll(); // server call + finally clearSession (含 phone,per 决策 1+8)
  } catch (e) {
    console.warn('[settings] logoutAll failed', e);
  }
  // 注意: 此处不再调用 clearSession() — logoutAll 内部已处理
  router.replace('/(auth)/login');
  // setIsLoading(false) 不需 — 组件 unmount 后 state 失效
}
```

**spec.md 同步修订**(本 plan 落地后,/speckit.analyze round 1 阶段统一回写 spec):

- FR-005 第 ② 步"显式清 5 个 auth 字段" → 修订为"由 logoutAll 内部 finally 块负责清 session(含 phone,per 决策 1)— UI 不重复调用 clearSession"
- 决策 8(本 plan)中 `clearSession` 扩展加 phone 后,spec FR-005 ② 步天然等价 spec CL-001 显式 5 字段清单

---

### 决策 3 — Stack header 实现(per spec.md Open Q4)

**问题**:settings stack 顶 nav 标题用 Expo Router 默认 header vs 自定义 header 组件。

**决策**:**(a) Expo Router 默认 header**(占位 UI 阶段):

- `Stack.Screen options.title` 各 screen 设置:"设置" / "账号与安全" / "手机号" / "《个人信息收集与使用清单》" / "《第三方共享清单》"
- 返回箭头 `<` 由 Expo Router Stack 默认提供
- PHASE 2 mockup 落地若需统一视觉(参考 spec A profile 顶 nav 自定义模式),迁移到自定义 header 组件

**理由**:

- 占位 UI 阶段 0 视觉决策(per ADR-0017)
- Expo Router 默认 header 已含 a11y / SafeArea / 返回手势
- PHASE 2 决迁移成本低(各 screen `Stack.Screen options.headerShown=false` 改为自定义 component)

---

### 决策 4 — 嵌套 stack 文件结构(per spec.md Open Q5)

**问题**:`legal/_layout.tsx` / `account-security/_layout.tsx` 是否独立 stack vs 与 settings 共享单 stack(扁平 6 文件方案)。

**决策**:**保留 8 文件结构(嵌套独立 stack)**:

```text
apps/native/app/(app)/settings/
├── _layout.tsx                                       # 顶层 Stack
├── index.tsx
├── account-security/
│   ├── _layout.tsx                                   # 子 Stack
│   ├── index.tsx
│   └── phone.tsx
└── legal/
    ├── _layout.tsx                                   # 子 Stack
    ├── personal-info.tsx
    └── third-party.tsx
```

**理由**:

- Expo Router file-based 嵌套 stack 是 idiomatic(per Expo Router v6 文档)
- 每子段独立 stack 给将来加更多 disabled 子项实现(实名认证 / 第三方绑定 / 登录设备管理)留扩展空间
- spec C 已锚定 `account-security/delete-account` 路径,未来加 SMS 输入子页(类似 phone)需子 stack 才能独立 header
- legal 子 stack 给将来加更多法规文档(M3 法务定稿可能拆多份清单)留位
- 单 \_layout(扁平 6 文件方案)虽简但失去 IA 表达性

**alternative considered**:扁平 6 文件方案(account-security/\_layout + legal/\_layout 不存在,所有 screen 直接挂 settings stack)— 拒绝,理由:未来扩展性 > 当前简洁性。

---

### 决策 5 — `Alert.alert` RN Web 兼容(per spec.md Open Q3)

**RN Web `Alert.alert` polyfill**:基于 `window.confirm`(单字符串提示 + OK / Cancel 按钮),**不区分** cancel / destructive style。

**决策**:**接受降级**(占位 UI 阶段);PHASE 2 mockup 阶段考虑自定义 modal:

| 平台    | 行为                                              |
| ------- | ------------------------------------------------- |
| iOS     | native Alert(含 destructive 红色按钮)             |
| Android | native Dialog(含 destructive 强调)                |
| Web     | `window.confirm`(无样式区分,但 callback 行为相同) |

**理由**:

- 占位 UI 阶段视觉降级在 ADR-0017 4 边界允许范围内
- callback 业务行为跨端一致(取消 / 确定都正确触发)
- PHASE 2 mockup 评估自定义 modal 成本(候选 `expo-modal` 或自实现)

**spec.md Edge Cases 已记录此行为**。

---

### 决策 6 — `maskPhone` 实现位置(per spec.md FR-010 + CL-002)

**候选位置**:

| 位置         | 优劣                                       |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| **(a) 推荐** | `apps/native/lib/format/phone.ts`          | 纯前端格式化函数;不属业务 store;与未来其他 mask 函数(如 email mask)归一 |
| (b)          | `packages/auth/src/format.ts`              | 与 store 同位;但 mask 是展示层逻辑,非 auth 业务                         |
| (c)          | `(tabs)/account-security/phone.tsx` 内私有 | 不可复用(未来 onboarding / settings 主页 / spec C 等都可能要 mask)      |

**决策**:**(a) `apps/native/lib/format/phone.ts`**(纯函数 + `phone.test.ts` 同位)。

**实现**(generic per CL-002):

```ts
// apps/native/lib/format/phone.ts
export function maskPhone(phone: string | null): string {
  if (phone === null || phone === '') return '未绑定';

  // 提取 + 前缀的国码 + 本地号(允许中间空格)
  const match = phone.match(/^(\+\d{1,3})\s*(\d+)$/);
  if (!match) return '未绑定'; // 非法格式(无 + 国码或非全数字本地号)
  const [, countryCode, localNumber] = match;

  if (localNumber.length < 7) return '未绑定'; // 本地号过短不足以 mask

  const head = localNumber.slice(0, 3);
  const tail = localNumber.slice(-4);
  const middleLen = localNumber.length - 7;
  const middle = '*'.repeat(Math.max(middleLen, 4)); // 至少 4 个 *

  return `${countryCode} ${head}${middle}${tail}`;
}
```

**测试 case**(表驱动):

| input                 | expected            | 备注                                                 |
| --------------------- | ------------------- | ---------------------------------------------------- |
| `'+8613812345678'`    | `'+86 138****5678'` | 中国号(国码 86 + 本地 11 位,middle = 11-7 = 4)       |
| `'+15551234567'`      | `'+1 555****4567'`  | 美国号(国码 1 + 本地 10,middle = 10-7 = 3,补到 4)    |
| `'+447123456789'`     | `'+44 712****6789'` | 英国号(国码 44 + 本地 10,middle = 10-7 = 3,补到 4)   |
| `null`                | `'未绑定'`          | null 输入                                            |
| `''`                  | `'未绑定'`          | 空字符串                                             |
| `'13812345678'`       | `'未绑定'`          | 无 + 国码                                            |
| `'+86 138 1234 5678'` | `'未绑定'`          | 含空格分隔(本 plan 严要求,可在 plan-impl 阶段宽松化) |

**实现细节**(具体 regex / edge case 兼容)在 plan-impl 阶段细化,本 plan 锁:**generic 实现 + lib 位置 + 至少 4 个 `*`**。

---

### 决策 7 — 路由文件清单 + 支持文件

**新建**(8 路由文件 + 2 支持文件):

| 文件                                                          | 内容                                            |
| ------------------------------------------------------------- | ----------------------------------------------- |
| `apps/native/app/(app)/settings/_layout.tsx`                  | Stack `screenOptions={{ headerShown: true }}`   |
| `apps/native/app/(app)/settings/index.tsx`                    | 设置主页 list(per spec FR-003)                  |
| `apps/native/app/(app)/settings/account-security/_layout.tsx` | 子 Stack `screenOptions`                        |
| `apps/native/app/(app)/settings/account-security/index.tsx`   | 账号与安全 list(per spec FR-007)                |
| `apps/native/app/(app)/settings/account-security/phone.tsx`   | 手机号 mask 详情(per spec FR-008)               |
| `apps/native/app/(app)/settings/legal/_layout.tsx`            | 子 Stack `screenOptions`                        |
| `apps/native/app/(app)/settings/legal/personal-info.tsx`      | 《个人信息收集与使用清单》占位(per spec FR-009) |
| `apps/native/app/(app)/settings/legal/third-party.tsx`        | 《第三方共享清单》占位                          |
| `apps/native/lib/format/phone.ts`                             | `maskPhone` 函数(per 决策 6)                    |
| `apps/native/lib/format/phone.test.ts`                        | `maskPhone` 单测                                |

**改**(packages/auth):

| 文件                                       | 改动                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `packages/auth/src/store.ts`               | AuthState 加 `phone: string \| null` + `setPhone` action;`clearSession` 加清 phone;persist `partialize` 加 phone(per 决策 1 + 8) |
| `packages/auth/src/usecases.ts`            | `loadProfile` 改:同时 `setPhone(response.phone ?? null)`                                                                         |
| `packages/auth/src/store.test.ts`          | 既有测试加 phone 断言;clearSession 测含 phone;persist partialize 测含 phone                                                      |
| `packages/auth/src/usecases.test.ts`(若有) | loadProfile 测 mock /me 加 phone → 断言 store.phone 同步                                                                         |

**spec A 影响评估**:

- spec A `(tabs)/profile.tsx` 既有 `router.push('/(app)/settings')` 调用 — 本 spec 落地后 push 目标存在,A spec 既有 router.push 断言不变
- spec A 不改任何文件

**删**:无。

---

### 决策 8 — `clearSession()` 扩展(per CL-001 + 决策 1)

`packages/auth/src/store.ts#clearSession` 当前清 4 字段(`accountId / accessToken / refreshToken / displayName` + `isAuthenticated: false`);决策 1 加 phone 字段后 clearSession 同步加。

**修订**:

```ts
clearSession: () =>
  set({
    accountId: null,
    accessToken: null,
    refreshToken: null,
    displayName: null,
    phone: null,                   // ← 新加(per 决策 1)
    isAuthenticated: false,
  }),
```

**CL-001 ↔ clearSession 等价性**:

- spec CL-001 显式 5 字段:`accessToken / refreshToken / displayName / accountId / phone`
- clearSession 修订后清 6 字段:同上 + `isAuthenticated`(衍生标志,不算业务字段)
- 完全等价 ✓

**handleLogout 调用关系**:UI 不直接调 clearSession;通过 `logoutAll()` 内部 finally 间接调用(per 决策 2)。

---

### 决策 9 — logout race guard 实现(per spec.md FR-019)

**目标**:防 logout 调用中用户重复 tap "退出登录" 触发多次 logoutAll。

**实现方式选择**:

| 方式         | 优劣                                        |
| ------------ | ------------------------------------------- | ----------------------------------------------------- |
| **(a) 推荐** | 组件内 `useState<boolean>` `isLoading` flag | 单 page 内 race(不跨页);不污染 store;占位 UI 阶段最简 |
| (b)          | `useAuthStore` 加 `isLoggingOut` flag       | 跨页可见但本场景不需要;污染 store                     |
| (c)          | 节流 / debounce                             | 复杂度 > 收益;不防长 timeout                          |

**决策**:**(a) 组件 useState**:

```tsx
function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await logoutAll();
    } catch (e) {
      console.warn('[settings] logoutAll failed', e);
    }
    router.replace('/(auth)/login');
    // setIsLoading(false) 不需 — 组件 unmount 后 state 失效
  }

  // ...
  // 在 "退出登录" Pressable 上视情况降级(disabled / 灰)
  <Pressable
    onPress={handleLogout}
    disabled={isLoading}
    accessibilityState={{ disabled: isLoading, busy: isLoading }}
    style={{ opacity: isLoading ? 0.5 : 1 }}
  >
    {/* 占位 UI 阶段不加 spinner — 文字 + 灰即可 */}
  </Pressable>;
}
```

**理由**:

- isLoading=true 期间 Pressable disabled + 占位常量 opacity 0.5(与其他 disabled 项一致,per CL-003)
- PHASE 2 mockup 决定是否加 spinner / 文字"正在退出..."等 micro-feedback

---

### 决策 10 — 文案集中常量(per spec.md FR-014 + FR-020)

**每 page 顶 const COPY 集中**(便于未来 i18n 抽离):

```ts
// settings/index.tsx
const COPY = {
  title: '设置',
  cards: {
    accountSecurity: '账号与安全',
    general: '通用',
    notifications: '通知',
    privacy: '隐私与权限',
    about: '关于',
    switchAccount: '切换账号',
    logout: '退出登录',
  },
  legal: {
    personalInfo: '《个人信息收集与使用清单》',
    thirdParty: '《第三方共享清单》',
  },
  logoutConfirm: '确定要退出登录?',
  logoutCancel: '取消',
  logoutOk: '确定',
};
```

```ts
// account-security/index.tsx
const COPY = {
  title: '账号与安全',
  phone: '手机号',
  realname: '实名认证',
  thirdPartyBinding: '第三方账号绑定',
  loginDevices: '登录设备与授权管理',
  deleteAccount: '注销账号',
  securityTips: '安全小知识',
};
```

```ts
// account-security/phone.tsx
const COPY = { title: '手机号', empty: '未绑定' };
```

```ts
// legal/personal-info.tsx + legal/third-party.tsx
const COPY = {
  body: '本清单内容由法务团队定稿后填入,预计 M3 内测前完成。',
};
```

**理由**:

- per spec FR-014 集中 → 未来 i18n 抽离方便
- 不写 disabled 项的"敬请期待"等暗示文案(per spec FR-020),靠 a11y `disabled` 状态传达

---

## 复用既有代码

| 来源                                             | 用法                                                                  | 状态                                    |
| ------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------- |
| `@nvy/auth.useAuthStore`                         | settings 各 page 读 displayName / phone(per FR-006 + FR-009 + FR-011) | 🟡 加 phone 字段(per 决策 1)            |
| `@nvy/auth.logoutAll`                            | settings/index 退出登录调用(per FR-005)                               | 🟢 不变(契约同 现有)                    |
| `@nvy/auth.loadProfile`                          | onboarding 既有 / 本 spec 间接消费(setPhone 同时写入)                 | 🟡 改 1 行(加 setPhone)                 |
| AuthGate(`apps/native/app/_layout.tsx`,既有)     | 未登录态拦截(per FR-017)                                              | 🟢 不变                                 |
| `expo-router.useRouter()` + `<Stack>`            | settings stack 导航                                                   | 🟢 不变                                 |
| `react-native.Alert`                             | 退出登录确认对话框(per FR-005)                                        | 🟢 不变(RN 内置)                        |
| `react-native-safe-area-context`                 | SafeAreaView / useSafeAreaInsets                                      | 🟢 不变                                 |
| `@nvy/api-client.getAccountProfileApi().getMe()` | 既有,response 含 phone 待 plan-impl 阶段验                            | 🟡 plan-impl 验 generated type 含 phone |

**新增依赖**:**无**(全裸 RN + 既有 packages,per ADR-0017 占位 UI 阶段)。

---

## RN Web 兼容点

| 维度                           | 约束                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `Alert.alert`                  | RN Web 用 `window.confirm` polyfill;destructive style 视觉降级(per 决策 5);callback 行为跨端一致 |
| `<Stack>` 默认 header          | RN Web Expo Router v6+ 支持;返回箭头 a11y / 视觉跨端一致                                         |
| Pressable 触摸反馈             | RN Web 上 `cursor:pointer` 自动加;native 端 `pressed` state 改 opacity                           |
| router.replace 在 hydration 前 | AuthGate 已守 `navigationRef.isReady()` 既有                                                     |
| `<ScrollView>` 在 legal page   | Web bundle / native 行为一致                                                                     |
| persist phone 字段             | Web localStorage / native Keychain 跨端一致(per 既有 sessionStorage)                             |

mockup PHASE 2 落地后 NativeWind 兼容点回填。

---

## UI 结构(占位版,pending mockup)

per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 流程,本段是 PHASE 1 占位 UI 边界声明;mockup PHASE 2 落地后回填完整版。

### 4 边界条目(占位 UI 严格遵守)

| 边界                      | 本 spec 落点                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 路由结构                  | 8 文件 settings stack(per 决策 7) ✓                                                                                                        |
| 单层 form-equivalent 输入 | 本 spec 无 form input — 替代为 list 行 tap + Alert 确认                                                                                    |
| 提交事件                  | 替代为 router.push(导航)/ `Alert.alert` confirm(退出登录)                                                                                  |
| 状态机视觉指示            | disabled 项 `opacity 0.5`(占位常量,per CL-003) / Alert 双按钮(取消 / 确定 destructive) / `isLoading` 期间退出登录行 disabled + opacity 0.5 |
| 错误展示位                | 本 spec 无网络请求 UI 展示 — logoutAll 失败走 console.warn 不进 UI(per US5 + CL-004 不引埋点)                                              |

### 视觉细节(全裸 RN,占位)

- 列表卡片(card)分组用裸 `<View>` + 基础 padding;**不写**精确 px / hex / 阴影
- 行 `<Pressable>` 含 `flexDirection: 'row'` + `justifyContent: 'space-between'` + 基础 padding(基础布局允许)
- 右侧 `>` chevron 用 emoji `›` 或裸 `<Text>`(无图标资源,per 与 spec A `(tabs)/profile.tsx` 同款不引图)
- footer 法规链接用 `color: 'blue'`(占位常量,PHASE 2 mockup 决具体 token)
- disabled 项 `opacity: 0.5`(占位常量,per CL-003)
- Alert.alert 由 RN 系统默认样式

### 每 page 顶 banner

```ts
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
```

---

## a11y 落点(per spec FR-015)

| 元素                                                                        | a11y props                                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 设置主页各 list 行(account-security / 4 disabled / switch account / logout) | `accessibilityRole='button'` + `accessibilityLabel={COPY.cards.<key>}`                                                                                                               |
| disabled 项(共 9:5 + 4)                                                     | + `accessibilityState={{disabled: true}}`                                                                                                                                            |
| 法规 footer 链接                                                            | `accessibilityRole='link'` + `accessibilityLabel={COPY.legal.<key>}`                                                                                                                 |
| 退出登录行                                                                  | `accessibilityRole='button'` + `accessibilityLabel='退出登录'` + `accessibilityHint='点击后将弹出确认对话框'` + `isLoading` 时加 `accessibilityState={{disabled: true, busy: true}}` |
| Alert.alert 按钮                                                            | RN 系统默认提供 a11y                                                                                                                                                                 |
| Stack header 返回箭头                                                       | Expo Router Stack 默认 a11y(`accessibilityLabel='返回'`)                                                                                                                             |
| 手机号 mask `<Text>`                                                        | `accessibilityLabel={maskedText}` 由 RN Text 自带                                                                                                                                    |
| 注销账号行                                                                  | `accessibilityRole='button'` + `accessibilityLabel='注销账号'` + `accessibilityHint='点击后跳转注销流程'`                                                                            |

---

## 测试策略

| 层                              | 工具                           | 覆盖                                                                                                  | 阶段           |
| ------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------- |
| 单测(maskPhone)                 | vitest                         | 表驱动 7 case(中国号 / 美国号 / 英国号 / null / '' / 无国码 / 含空格)                                 | PR-impl        |
| 单测(useAuthStore phone 字段)   | vitest                         | `setPhone` / `clearSession` 含 phone / persist `partialize` 含 phone                                  | PR-impl        |
| 单测(loadProfile 改造)          | vitest                         | mock `getMe` 返 phone → store.phone 同步 + onboarding flow 不破坏(displayName 写入仍正确)             | PR-impl        |
| 单测(settings/\_layout)         | vitest                         | Stack 配置;`screenOptions`;标题                                                                       | PR-impl        |
| 单测(settings/index)            | vitest + rtl-rn                | render → 3 cards 渲染 + footer 双链接;tap 各项 → 正确 router.push;tap "退出登录" → `Alert.alert` 调用 | PR-impl        |
| 单测(handleLogout)              | vitest                         | happy path(mock logoutAll resolve);server fail(mock reject);race guard(双 tap 仅触发 1 次)            | PR-impl        |
| 单测(account-security/\_layout) | vitest                         | 子 Stack 配置                                                                                         | PR-impl        |
| 单测(account-security/index)    | vitest + rtl-rn                | render → 3 cards;tap "手机号" → push;tap "注销账号" → push spec C 路径;反枚举 grep                    | PR-impl        |
| 单测(account-security/phone)    | vitest + rtl-rn                | render mask;phone=null → "未绑定";反枚举 grep                                                         | PR-impl        |
| 单测(legal/\_layout)            | vitest                         | 子 Stack 配置                                                                                         | PR-impl        |
| 单测(legal pages)               | vitest + rtl-rn                | render 标题 + 占位文案                                                                                | PR-impl        |
| 集成测(settings 流)             | vitest + rtl-rn                | settings/index → push account-security → push phone → 返回 → ... → 退出登录 → replace login           | PR-impl        |
| E2E(真后端冒烟)                 | Playwright `runtime-debug.mjs` | (per SC-006)已 onboarded → ⚙️ → 全流程截图                                                            | PR-impl 末尾   |
| 视觉回归(PHASE 2)               | TBD                            | mockup vs 实际渲染像素对比                                                                            | PR-impl-mockup |

### SC ↔ 测试 case 映射

| SC     | 覆盖测试                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-001 | 全 9 User Story happy path 单测                                                                                                                      |
| SC-002 | handleLogout test:msw mock 503 → store 仍清(由 logoutAll finally 保证)+ router.replace 仍调 + console.warn 触发                                      |
| SC-003 | grep 8 settings 文件 + maskPhone 测:无 hex / px / rgb 字面量(允许 `opacity: 0.5` + `color: 'blue'` 占位常量,per CL-003);无新 packages/ui import      |
| SC-004 | git diff 验证 8 文件齐全 + 集成测路由可达                                                                                                            |
| SC-005 | grep `account-security/*` + `phone.tsx`:无 `accountId` 渲染;无 7+ 位连续数字明文                                                                     |
| SC-006 | Playwright 冒烟脚本 runtime-debug                                                                                                                    |
| SC-007 | 集成测 / Playwright assertion:settings stack 内底 tab 不可见;返回 (tabs)/profile 后可见                                                              |
| SC-008 | settings/index test:tap "退出登录" → spy `Alert.alert` 调用参数 = (`确定要退出登录?`, undefined, [取消, 确定]);spy 第二按钮 `onPress` = handleLogout |
| SC-009 | account-security/index test:tap "注销账号" → router.push 调用断言 = `'/(app)/settings/account-security/delete-account'`                              |
| SC-010 | legal pages test:渲染含标题 + 占位文案;返回行为                                                                                                      |
| SC-011 | 9 项 disabled 子项 test:tap 无 router 调用 + a11y disabled 静态断言                                                                                  |
| SC-012 | handleLogout race guard test:isLoading=true 期间二次 tap → logoutAll 仅被 spy 调用 1 次                                                              |

---

## Constitution / 边界 Check

- ✅ AuthGate 三态决策不破(本 spec 不改 `auth-gate-decision.ts`)
- ✅ 占位 UI 0 视觉决策(per ADR-0017 类 1 + spec FR-012 + SC-003)
- ✅ 不引 packages/ui 新抽组件(per spec FR-013)
- ✅ 不引第三方 lib(全裸 RN + 既有 packages)
- ✅ 反枚举不变性:account-security 不渲染 account.id;phone screen 不含明文 phone 7+ 位连续(per spec FR-018 + SC-005)
- ✅ 跨模块边界:本 spec 仅依赖 `@nvy/auth`(read + 加 phone 字段)+ `expo-router` + `react-native`,**不**直接 import `@nvy/api-client`(loadProfile 由 wrapper 完成)
- ✅ 退出登录契约:logoutAll 既有 try/finally clearSession 保证(per 决策 2);UI 不重复
- ✅ B → C 衔接占位:account-security/index router.push spec C 路径,目标缺失期容错(per US8)
- ✅ 反枚举:`/me` response 不暴露 isNewAccount / 等区分信号(沿用 onboarding spec SC-003 既有保证)

---

## 反模式(明确避免)

- ❌ 在 `settings/*` 内 import `@nvy/ui` 抽组件(破坏 ADR-0017 占位 UI 4 边界)
- ❌ 占位 UI 阶段写视觉细节(精确间距 / 颜色 / 字号 / 阴影 / 卡片样式 / Alert 自定义 modal)— 留 mockup PHASE 2
- ❌ disabled 项加 toast / 跳"敬请期待"页(per spec FR-006 + Q5)
- ❌ 退出登录 UI 重复调用 clearSession(logoutAll 内部已 finally 处理,per 决策 2)
- ❌ 退出登录跳路由前不 catch logoutAll 错误(必 try/catch 保证 best-effort,per FR-005 + US5)
- ❌ phone screen 渲染明文 phone(必 mask,per FR-018 + SC-005)
- ❌ 法规页写实际法务内容(法务定稿前严禁,per spec Q6)
- ❌ 引入埋点(per CL-004)
- ❌ Alert.alert 标题写"您即将退出登录是否继续?"等冗长文案(per Q2 简洁原则)
- ❌ 在 `(app)/(tabs)/settings/*` 路径建 settings(必在 `(app)/settings/*`,per spec A CL-002 / 决策 7)
- ❌ store phone 字段 lift 到 auth store 但 logoutAll 不清(必同步 clearSession 加 phone,per 决策 8)

---

## 风险 + 缓解

| 风险                                                                                      | 缓解                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `phone` 字段写入 store 破坏 onboarding 既有测试                                           | plan-impl 阶段先跑 `pnpm --filter @nvy/auth test` 看 baseline;若 mock /me response 不含 phone → `setPhone(undefined ?? null)` 不破坏 displayName 主路径;若有 break 修复 mock 加 phone                                                             |
| `getMe()` response 实际不含 phone 字段                                                    | plan-impl 阶段查 `packages/api-client/src/generated/models/MeResponse.ts`(或同名 type)既有 type;若不含 phone 升级 server `/me` schema(server 端 0 工作量假设破裂,需开 server 子 PR — 但 PRD § 2.1 + § 3.7 表明 /me 返完整 profile,大概率含 phone) |
| `logoutAll` 既有 try/finally 在 server 失败时 throw,UI 没 catch 会冒泡破坏 router.replace | spec FR-005 已声明 try/catch swallow + 顺序保证;对应 SC-002 / US5 严格断言(msw mock 503 case)                                                                                                                                                     |
| `Alert.alert` RN Web polyfill 视觉降级用户认知不一致                                      | spec Edge Cases + 决策 5 已声明接受;PHASE 2 mockup 评估自定义 modal                                                                                                                                                                               |
| Stack 嵌套 header 在 RN Web 上多层 header 视觉冲突                                        | plan-impl 阶段 Playwright 冒烟测多 stack 层级 header 行为;若有冲突 fallback 单 \_layout(扁平 6 文件方案,per 决策 4 alternative considered)                                                                                                        |
| `(tabs)` 之外 stack push 后底 tab 真隐藏(per spec A CL-002 (b))                           | spec A CL-002 已假设;Playwright 冒烟测验证(SC-007);若 Expo Router 行为变化需补 `tabBarStyle` 自定义                                                                                                                                               |
| spec C 注销账号目标 route 缺失期间用户 tap 体验差                                         | dev mode warning 接受;真后端冒烟期记录 README 中说明"spec C 落地后此 warning 消失"(per spec A 同款说法)                                                                                                                                           |
| logoutAll 调用中用户重复 tap 退出登录                                                     | FR-019 + 决策 9 isLoading guard;SC-012 严格断言                                                                                                                                                                                                   |
| persist phone 字段在 cold-start 后 stale(用户在另一设备改了 phone 我们不感知)             | M1 单设备 + phone 不可改(per ADR-0016 phone 是 identity 主键)— 实际不会 stale;M2+ 多设备 / phone 可改时再加 cold-start re-fetch /me 同步(类似 displayName)                                                                                        |
| account-security/index card 数排版多 vs 占位 UI 简洁                                      | 3 cards 是合理结构(spec FR-007 已声明),不算视觉决策;具体卡间距由 PHASE 2 mockup 决                                                                                                                                                                |

---

## 与 spec A / spec C 的衔接边界

| 边界                  | spec A(my-profile)                                                   | 本 spec(B / account-settings-shell)                                                | spec C(delete-account-cancel-deletion-ui) |
| --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| ⚙️ 入口               | ✅ 已 ship `(tabs)/profile.tsx` FR-005 router.push '/(app)/settings' | ✅ 实现 `(app)/settings/_layout.tsx` + `(app)/settings/index.tsx`(设置 list)       | —                                         |
| 设置 → 账号与安全     | —                                                                    | ✅ 实现 `account-security/index.tsx` + push `'/(app)/settings/account-security'`   | —                                         |
| 账号与安全 → 注销账号 | —                                                                    | ✅ 注销入口 `<Pressable>` push `'/(app)/settings/account-security/delete-account'` | ✅ 实现注销 UI(SMS + 6 位码 + 双确认)     |
| 解封 UI               | —                                                                    | —                                                                                  | ✅ phone-sms-auth login flow 拦截弹窗     |
| 退出登录              | —                                                                    | ✅ 设置页第三卡 → Alert + logoutAll(既有)+ router.replace login                    | —                                         |
| 法规链接              | —                                                                    | ✅ footer 双链接 → legal/\* 占位                                                   | (M3 法务定稿后法务团队回填)               |
| 手机号 mask           | —                                                                    | ✅ phone screen + maskPhone 函数 + store phone 字段(per 决策 1)                    | —                                         |
| store phone 字段消费  | (不消费)                                                             | ✅ 引入(决策 1)+ 决策 8 clearSession 同步                                          | (后续 spec C 注销流程也可消费)            |

**spec A → B → C 是线性依赖**:本 spec 落地后 spec A push 目标存在;spec C 后续 PR 落地后 spec B push 目标存在;依赖图清晰。

---

## spec.md 同步修订(本 plan 落地后,/speckit.analyze round 1 阶段执行)

本 plan 决策对 spec.md 影响清单(/analyze 阶段统一回写 spec):

| spec.md 段                 | 修订内容                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| FR-005                     | ② 步"显式清 5 个 auth 字段" → 改为"由 logoutAll 内部 finally 块负责清 session(含 phone,per plan 决策 1+8)— UI 不重复调用 clearSession" |
| FR-019                     | 加"具体实现:组件 useState isLoading + Pressable disabled + opacity 0.5(per plan 决策 9)"                                               |
| FR-011                     | 改"phone 字段:plan 已决策(决策 1)采用 (A) store 加字段方案,本 spec 假设落地"                                                           |
| Open Questions Q1-Q8       | 各项 plan 已决标 ✅(plan 落地)/ 仍 plan-impl 阶段决标 🟡                                                                               |
| Assumptions & Dependencies | `useAuthStore` 描述加 phone 字段(per plan 决策 1)                                                                                      |

---

## 变更记录

- **2026-05-07**:本 plan 首次创建。基于 spec.md(round 1 clarify 已完成,含 CL-001 ~ CL-004)+ packages/auth 既有源码 grep(`useAuthStore` 字段 / `logoutAll` 契约 / `loadProfile` 实现)落 10 项关键技术决策(phone 字段 store 扩展 / logoutAll 契约 / Stack header / 嵌套 stack / Alert.alert RN Web / maskPhone 位置 / 路由文件清单 / clearSession 扩展 / race guard / 文案集中)。UI 段标占位(per ADR-0017 类 1 流程),mockup PHASE 2 落地后回填。spec.md 同步修订清单留 /analyze round 1 执行。
