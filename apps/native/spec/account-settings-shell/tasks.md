# Tasks: Account Settings Shell (设置入口 + 账号与安全 + 法规占位)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2026-05-07(per [ADR-0017](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md) 类 1 标准 UI 流程)
**Status**: Draft(本 PR docs-only;Impl 阶段下 session;PHASE 2 mockup 后续 PR)
**Phase**: SDD 拆分链 A/B/C 的 **B**(account-settings-shell);上承 spec A(my-profile,已 ship PR #68 / #70 / #71)

> **TDD enforcement**(per [no-vain-years-app CLAUDE.md § 五](https://github.com/xiaocaishen-michael/no-vain-years-app/blob/main/CLAUDE.md)):业务 hook / store / 工具函数 / 路由决策**必须**测;纯展示 UI 不强制 TDD。每条 task 内**测试任务绑定到实现 task**。
>
> **顺序**:T_doc(本 PR docs)→ T1(packages/auth phone 字段)→ T2(loadProfile 写 phone)→ T3(maskPhone lib)→ T4(settings/\_layout + index)→ T5(handleLogout 流程)→ T6(account-security/\_layout + index)→ T7(account-security/phone)→ T8(legal/\_layout + 2 pages)→ T9(集成测)→ T10(Playwright 冒烟)→ T11(spec.md 同步 + tasks.md ✅)→ T_mock+(mockup PHASE 2 占位空表)。
>
> **状态语义**:无标记 = pending;`✅` = done(自动同步纪律,per meta sdd.md § 状态层与跨 session 接续协议)。

---

## 任务清单

### Pre-impl(已完成 / 本 PR docs-only)

| #        | 层级              | 任务                                                                     | 文件                                               | 状态                  |
| -------- | ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------- | --------------------- |
| ✅T_dep1 | [Existing spec A] | spec A `(my-profile)` 已 ship,`(tabs)/profile.tsx` FR-005 ⚙️ push 已占位 | `apps/native/app/(app)/(tabs)/profile.tsx`         | ✅ PR #68 / #70 / #71 |
| ✅T_dep2 | [Existing server] | server `/auth/logout-all` + `/accounts/me` 已落地                        | server M1.1 / M1.2 PRs                             | ✅                    |
| ✅T_dep3 | [Existing auth]   | `packages/auth#logoutAll()` + `logoutLocal()` + `useAuthStore` 既有      | `packages/auth/src/`                               | ✅                    |
| T_doc1   | [Spec]            | 写 spec.md(IA + User Flow + 6 Q + 4 CL + 9 US + 20 FR + 12 SC)           | `apps/native/spec/account-settings-shell/spec.md`  | ✅ 本 PR              |
| T_doc2   | [Plan]            | 写 plan.md(10 关键决策 + 文件清单 + 测试策略 + 衔接边界)                 | `apps/native/spec/account-settings-shell/plan.md`  | ✅ 本 PR              |
| T_doc3   | [Tasks]           | 写本文件 — T1 ~ T11 实施步骤 + T_mock+ PHASE 2 占位空表                  | `apps/native/spec/account-settings-shell/tasks.md` | ✅ 本 PR              |

### Impl 阶段(下个 PR — 业务流 + 占位 UI + 真后端冒烟)

| #   | 层级                            | 任务                                                                                                                                                                  | 文件                                                                                       | 状态 |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| T1  | [Auth-Store]                    | `useAuthStore` 加 `phone` 字段 + `setPhone` action + `clearSession` 同步加 phone + persist `partialize` 加 phone(per plan 决策 1 + 8)                                 | `packages/auth/src/store.ts` + `apps/native/lib/auth/store.test.ts`                        | ✅   |
| T2  | [Auth-UseCase]                  | `loadProfile` 改:同时 `setPhone(response.phone ?? null)`(per plan 决策 1);plan-impl 阶段先验 generated `getMe()` type 含 phone                                        | `packages/auth/src/usecases.ts` + `apps/native/lib/auth/usecases.test.ts`                  | ✅   |
| T3  | [Format-Lib]                    | `maskPhone` 函数 + 表驱动测试 7 case(per plan 决策 6 + spec FR-010 + CL-002;实现采用国码白名单 per T3 决策 A)                                                         | `apps/native/lib/format/phone.ts` + `phone.test.ts`                                        | ✅   |
| T4  | [Settings/Layout + Page]        | `settings/_layout.tsx`(Stack) + `settings/index.tsx`(主页 3 cards + footer 双链接,per spec FR-001 ~ FR-004 + FR-006)                                                  | `apps/native/app/(app)/settings/_layout.tsx` + `settings/index.tsx` + tests                | ✅   |
| T5  | [Settings/Logout]               | `handleLogout` 流程(Alert 二次确认 + best-effort + race guard,per spec FR-005 + FR-019 + plan 决策 2 + 9)                                                             | `settings/index.tsx`(扩展)+ `__tests__/handleLogout.test.tsx`                              | ✅   |
| T6  | [AccountSecurity/Layout + Page] | `account-security/_layout.tsx` + `account-security/index.tsx`(3 cards + 反枚举,per spec FR-007 + FR-018 + Q4)                                                         | `settings/account-security/_layout.tsx` + `account-security/index.tsx` + tests             |      |
| T7  | [AccountSecurity/Phone]         | `account-security/phone.tsx`(mask 渲染 + null fallback,per spec FR-008 + FR-018)                                                                                      | `settings/account-security/phone.tsx` + `phone.test.tsx`                                   |      |
| T8  | [Legal/Layout + Pages]          | `legal/_layout.tsx` + `legal/personal-info.tsx` + `legal/third-party.tsx`(标题 + 占位文案,per spec FR-009 + FR-011 + Q6)                                              | `settings/legal/_layout.tsx` + `legal/personal-info.tsx` + `legal/third-party.tsx` + tests |      |
| T9  | [Integration]                   | 集成测 — settings 全流(settings → account-security → phone → 返回 → 退出登录)+ stack 返回行为 + 底 tab 隐藏 + 反枚举静态分析(per spec SC-007 / SC-010 / US9 / SC-005) | `__tests__/integration/account-settings-shell-flow.test.tsx`                               |      |
| T10 | [Smoke]                         | Playwright 真后端冒烟 — 已 onboarded → ⚙️ → settings → account-security → phone → 返回 → 退出登录 → Alert → 确定 → 跳 login(per spec SC-006)                          | `apps/native/runtime-debug/2026-05-XX-account-settings-shell-business-flow/` + 截图        |      |
| T11 | [Doc]                           | spec.md 同步修订(FR-005 / FR-011 / FR-019 / Assumption / Open Q,per plan § spec.md 同步修订段)+ tasks.md 全勾 ✅                                                      | `spec.md` + `tasks.md`                                                                     |      |

### Mockup PHASE 2 阶段(再下 session PR — UI 完成)

> 占位空表;由 mockup-prompt 阶段填充。参考 my-profile tasks.md `T_mock` / `T10` ~ `T13` 5 任务模式(mockup-prompt → bundle / handoff → packages/ui 评估 → 改写 page → plan.md 回填 → 视觉冒烟)。

| #      | 层级           | 任务                                                                                                      | 文件                                                                        | 状态    |
| ------ | -------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| T_mock | [Mockup]       | Claude Design 出 settings + account-security + phone + legal 共 5 page mockup + bundle + handoff.md       | `design/source/` + `design/mockup-prompt.md` + `design/handoff.md`          | 🟡 占位 |
| T12    | [packages/ui]  | 评估新组件归属(`<SettingsListCard>` / `<ListRow>` / 等;per spec FR-013 PHASE 1 不抽 — PHASE 2 评估)       | `design/handoff.md` § 复用清单                                              | 🟡 占位 |
| T13    | [App]          | 改写 5 page — 删 PHASE 1 PLACEHOLDER banner + 接入新组件 + token-based className(per ADR-0014 NativeWind) | `settings/index.tsx` + `account-security/index.tsx` + `phone.tsx` + 法规 ×2 | 🟡 占位 |
| T14    | [Plan]         | plan.md UI 段从 4 边界占位回填为完整 UI 结构                                                              | `apps/native/spec/account-settings-shell/plan.md` § UI 结构                 | 🟡 占位 |
| T15    | [Visual smoke] | 5+ 状态截图(各 page 默认状态 / Alert 弹窗 / disabled 项视觉 / phone mask 状态)                            | `runtime-debug/2026-05-XX-account-settings-shell-mockup-translation/`       | 🟡 占位 |
| T16    | [视觉回归]     | 视情况引入 visual regression(M2 后)                                                                       | TBD                                                                         | 🟡 评估 |

---

## T1 ✅ — `useAuthStore` 加 `phone` 字段(per plan 决策 1 + 8)

**TDD**:先扩测试 case,再改实现。

### T1-test:扩展 `packages/auth/src/store.test.ts`

| 测试 case                     | 输入                                 | Expect                                                                 |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `phone` 初始值                | 新建 store                           | `useAuthStore.getState().phone === null`                               |
| `setPhone('+8613812345678')`  | 调用 setPhone                        | `useAuthStore.getState().phone === '+8613812345678'`                   |
| `setPhone(null)`              | 调用 setPhone                        | `useAuthStore.getState().phone === null`                               |
| `clearSession` 清 phone       | 先 setPhone('+86...') → clearSession | `phone === null`                                                       |
| persist `partialize` 含 phone | 写入 phone → 触发 persist 序列化     | 序列化 JSON 含 `phone` 字段(spy createJSONStorage 或读 sessionStorage) |

**Verify**:`pnpm --filter @nvy/auth test` — 应 RED(phone 字段不存在)。

### T1-impl:`packages/auth/src/store.ts`

```ts
export interface AuthState {
  accountId: number | null;
  accessToken: string | null;
  refreshToken: string | null;
  displayName: string | null;
  phone: string | null;                              // ← 新加
  isAuthenticated: boolean;
  setSession: (session: Session) => void;
  setAccessToken: (token: string) => void;
  setDisplayName: (name: string | null) => void;
  setPhone: (phone: string | null) => void;          // ← 新加
  clearSession: () => void;
}

// initial state
phone: null,                                          // ← 新加

// setters
setPhone: (phone) => set({ phone }),                  // ← 新加

// clearSession
clearSession: () =>
  set({
    accountId: null,
    accessToken: null,
    refreshToken: null,
    displayName: null,
    phone: null,                                      // ← 新加
    isAuthenticated: false,
  }),

// persist partialize
partialize: (state) => ({
  accountId: state.accountId,
  refreshToken: state.refreshToken,
  displayName: state.displayName,
  phone: state.phone,                                 // ← 新加
}),
```

**Verify**:`pnpm --filter @nvy/auth test` 全 GREEN;`pnpm typecheck` 全 GREEN(`AuthState` 接口扩展不破坏既有消费方,可选 `?` 不需 — 直接加非可选字段因为是接口定义)。

**Commit message**:`feat(account): add phone field to useAuthStore (M1.X / spec account-settings-shell T1)`

---

## T2 ✅ — `loadProfile` 写入 phone(per plan 决策 1)

**TDD**:先扩测试,再改实现。**前置**:plan-impl 阶段先 grep 验证 `getMe()` generated type 含 phone:

```bash
rg "phone" packages/api-client/src/generated/models/ | grep -i "MeResponse\|UpdateProfile"
# 期望命中: phone?: string;
```

若 generated type **不含 phone**:开 server 子 PR 扩 `/me` schema(per plan 风险段),本 task block。

### T2-test:扩展 `packages/auth/src/usecases.test.ts`(若已有)或新建

| 测试 case                            | 输入(mock /me response)                            | Expect                                                                  |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `loadProfile` 写 phone               | `{ displayName: '小明', phone: '+8613812345678' }` | `useAuthStore.getState().phone === '+8613812345678'`                    |
| `loadProfile` phone=null fallback    | `{ displayName: '小明' }`(无 phone 字段)           | `useAuthStore.getState().phone === null`                                |
| `loadProfile` displayName 仍正确写入 | `{ displayName: '小明', phone: '+86...' }`         | `useAuthStore.getState().displayName === '小明'`(onboarding 主路径不破) |
| `phoneSmsAuth` 后续 loadProfile      | mock auth + getMe → 验证 phone 也被写入            | 同上                                                                    |

**Verify**:`pnpm --filter @nvy/auth test` — 应 RED(loadProfile 不写 phone)。

### T2-impl:`packages/auth/src/usecases.ts#loadProfile`

```ts
export async function loadProfile(): Promise<void> {
  const response = await getAccountProfileApi().getMe();
  useAuthStore.getState().setDisplayName(response.displayName ?? null);
  useAuthStore.getState().setPhone(response.phone ?? null); // ← 新加
}
```

**Verify**:`pnpm --filter @nvy/auth test` 全 GREEN(含 onboarding 既有 case);`pnpm --filter native test` 不破坏(若 native 有 mock /me 的 setup,验证不破)。

**Commit message**:`feat(account): write phone in loadProfile (M1.X / spec account-settings-shell T2)`

---

## T3 ✅ — `maskPhone` 函数(per plan 决策 6 + spec FR-010 + CL-002)

**TDD**:测试先红。

### T3-test:`apps/native/lib/format/phone.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { maskPhone } from './phone';

describe('maskPhone', () => {
  it.each([
    ['+8613812345678', '+86 138****5678'], // 中国号
    ['+15551234567', '+1 555****4567'], // 美国号(middle 补到 4)
    ['+447123456789', '+44 712****6789'], // 英国号(middle 补到 4)
    [null, '未绑定'],
    ['', '未绑定'],
    ['13812345678', '未绑定'], // 无 + 国码
    ['+86 138 1234 5678', '未绑定'], // 含空格(本 plan 严要求,可在 T3-impl 阶段宽松化为 trim 后 retry)
  ])('maskPhone(%j) returns %s', (input, expected) => {
    expect(maskPhone(input)).toBe(expected);
  });
});
```

**Verify**:`pnpm --filter native test apps/native/lib/format/phone.test.ts` — 应 RED(文件不存在)。

### T3-impl:`apps/native/lib/format/phone.ts`

```ts
// Phone number masking for display (e.g., 账号与安全 / phone detail).
// Generic E.164-style: keep + country code + first 3 + ***** + last 4.
export function maskPhone(phone: string | null): string {
  if (phone === null || phone === '') return '未绑定';

  const match = phone.match(/^(\+\d{1,3})\s*(\d+)$/);
  if (!match) return '未绑定';
  const [, countryCode, localNumber] = match;

  if (localNumber.length < 7) return '未绑定';

  const head = localNumber.slice(0, 3);
  const tail = localNumber.slice(-4);
  const middleLen = localNumber.length - 7;
  const middle = '*'.repeat(Math.max(middleLen, 4));

  return `${countryCode} ${head}${middle}${tail}`;
}
```

**Verify**:`pnpm --filter native test apps/native/lib/format/phone.test.ts` — 全 GREEN。

**Commit message**:`feat(account): add maskPhone format util (M1.X / spec account-settings-shell T3)`

---

## T4 ✅ — `settings/_layout.tsx` + `settings/index.tsx` 主页(per spec FR-001 ~ FR-004 + FR-006)

**TDD**:layout test + index test 先红,再实现。

### T4-test:`apps/native/app/(app)/settings/__tests__/_layout.test.tsx`

| 测试 case             | Expect                                                             |
| --------------------- | ------------------------------------------------------------------ |
| Stack screen 注册     | render layout → 找到 Stack 容器 + screenOptions `headerShown=true` |
| Index screen title    | `Stack.Screen name="index"` options.title = `'设置'`               |
| account-security stub | `Stack.Screen name="account-security"`(指向子 stack)               |
| legal stub            | `Stack.Screen name="legal"`(指向子 stack)                          |

### T4-test:`apps/native/app/(app)/settings/__tests__/index.test.tsx`

| 测试 case                               | Expect                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 3 cards 渲染                            | render → 找到 3 cards;Card 1 含 "账号与安全";Card 2 含 "通用 / 通知 / 隐私与权限 / 关于";Card 3 含 "切换账号 / 退出登录" |
| Footer 双链接                           | 渲染 "《个人信息收集与使用清单》" + "《第三方共享清单》"                                                                 |
| tap "账号与安全" → push                 | mock router → fireEvent press "账号与安全" → `router.push('/(app)/settings/account-security')`                           |
| tap "《个人信息收集与使用清单》" → push | fireEvent press → `router.push('/(app)/settings/legal/personal-info')`                                                   |
| tap "《第三方共享清单》" → push         | fireEvent press → `router.push('/(app)/settings/legal/third-party')`                                                     |
| tap "退出登录" → Alert.alert 调用       | spy `Alert.alert` → fireEvent press "退出登录" → spy 调用参数 = (`'确定要退出登录?'`, undefined, [取消, 确定])           |
| tap disabled (5 项)                     | fireEvent press → 无 router 调用 + a11y `disabled=true` + opacity 0.5                                                    |

**Verify**:`pnpm --filter native test` — 应 RED(文件不存在)。

### T4-impl

`apps/native/app/(app)/settings/_layout.tsx`:

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: '设置' }} />
      <Stack.Screen name="account-security" options={{ headerShown: false }} />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
    </Stack>
  );
}
```

`apps/native/app/(app)/settings/index.tsx`:

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { logoutAll } from '@nvy/auth';

const COPY = {
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

const DISABLED_OPACITY = 0.5; // 占位常量,per CL-003

export default function SettingsIndex() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // handleLogout 详见 T5
  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await logoutAll();
    } catch (e) {
      console.warn('[settings] logoutAll failed', e);
    }
    router.replace('/(auth)/login');
  }

  function confirmLogout() {
    Alert.alert(COPY.logoutConfirm, undefined, [
      { text: COPY.logoutCancel, style: 'cancel' },
      { text: COPY.logoutOk, style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <ScrollView>
      {/* Card 1 */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/account-security')}
          accessibilityRole="button"
          accessibilityLabel={COPY.cards.accountSecurity}
        >
          <Text>{COPY.cards.accountSecurity}</Text>
          <Text>›</Text>
        </Pressable>
      </View>

      {/* Card 2 — 4 disabled */}
      <View>
        {(['general', 'notifications', 'privacy', 'about'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={undefined}
            accessibilityRole="button"
            accessibilityLabel={COPY.cards[key]}
            accessibilityState={{ disabled: true }}
            style={{ opacity: DISABLED_OPACITY }}
          >
            <Text>{COPY.cards[key]}</Text>
            <Text>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Card 3 — switchAccount disabled / logout */}
      <View>
        <Pressable
          onPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={COPY.cards.switchAccount}
          accessibilityState={{ disabled: true }}
          style={{ opacity: DISABLED_OPACITY }}
        >
          <Text>{COPY.cards.switchAccount}</Text>
        </Pressable>
        <Pressable
          onPress={confirmLogout}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={COPY.cards.logout}
          accessibilityHint="点击后将弹出确认对话框"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
          style={{ opacity: isLoading ? DISABLED_OPACITY : 1 }}
        >
          <Text>{COPY.cards.logout}</Text>
        </Pressable>
      </View>

      {/* Footer 双链接 */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/legal/personal-info')}
          accessibilityRole="link"
          accessibilityLabel={COPY.legal.personalInfo}
        >
          <Text style={{ color: 'blue' }}>{COPY.legal.personalInfo}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/settings/legal/third-party')}
          accessibilityRole="link"
          accessibilityLabel={COPY.legal.thirdParty}
        >
          <Text style={{ color: 'blue' }}>{COPY.legal.thirdParty}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

**Verify**:`pnpm --filter native test` 全 GREEN;dev server 跑 → settings/index 渲染。

**Commit message**:`feat(account): settings/_layout + settings/index list (M1.X / spec account-settings-shell T4)`

---

## T5 ✅ — `handleLogout` 流程(per spec FR-005 + FR-019 + plan 决策 2 + 9)

**TDD**:扩展 T4 的 settings/index test,并新建 handleLogout 专门测试文件。

### T5-test:`apps/native/app/(app)/settings/__tests__/handleLogout.test.tsx`

| 测试 case                                           | Mock                                                    | Expect                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Happy path:Alert "确定" → logoutAll → replace login | `logoutAll` resolve,`Alert.alert` 模拟点确定            | logoutAll 调用 1 次;`router.replace('/(auth)/login')` 调用 1 次;`useAuthStore.getState().phone === null`(by logoutAll finally)          |
| 用户点取消                                          | `Alert.alert` 模拟点取消                                | logoutAll 不调用;router 无调用;store 不变                                                                                               |
| Server fail (msw 503):best-effort 容错              | msw mock POST /auth/logout-all 返 503 → logoutAll throw | logoutAll 调用 1 次(throw);`console.warn` spy 调用含 `'[settings] logoutAll failed'`;router.replace 仍调用;store phone 仍 null(finally) |
| Race guard:logout 调用中重复 tap                    | logoutAll 用 promise pending(setTimeout 模拟慢)         | 第 2 次 tap "退出登录" 不触发新 logoutAll;`isLoading=true` 期间 Pressable a11y `disabled=true`                                          |
| Pressable disabled 视觉                             | render with `isLoading=true`                            | "退出登录" Pressable opacity=0.5 + accessibilityState.disabled=true + busy=true                                                         |

**Verify**:`pnpm --filter native test` — 应 RED。

### T5-impl

handleLogout 已在 T4 settings/index.tsx 内实现(per T4-impl 代码块 `handleLogout` + `confirmLogout` 函数)。本 task 主要是测试覆盖 + 验证 race guard 行为正确 + 验证 logoutAll 内部 finally 已清 phone(由 T1 加 phone 字段)。

**Verify**:`pnpm --filter native test` 全 GREEN(含 SC-002 / SC-008 / SC-012 覆盖)。

**Commit message**:`test(account): handleLogout flow + race guard (M1.X / spec account-settings-shell T5)`

---

## T6 — `account-security/_layout` + `account-security/index`(per spec FR-007 + FR-018 + Q4)

**TDD**:layout + index test 先红。

### T6-test:`apps/native/app/(app)/settings/account-security/__tests__/_layout.test.tsx`

| 测试 case           | Expect                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| Stack 配置          | render layout → Stack 容器 + screenOptions `headerShown=true`                   |
| Index screen title  | `Stack.Screen name="index"` options.title = `'账号与安全'`                      |
| Phone screen title  | `Stack.Screen name="phone"` options.title = `'手机号'`                          |
| delete-account stub | `Stack.Screen name="delete-account"` options 不影响(spec C 占位,本 spec 不实现) |

### T6-test:`apps/native/app/(app)/settings/account-security/__tests__/index.test.tsx`

| 测试 case                    | Expect                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3 cards 渲染                 | Card 1: 手机号 + 实名认证 disabled + 第三方账号绑定 disabled (3 项);Card 2: 登录设备与授权管理 disabled (1 项);Card 3: 注销账号 + 安全小知识 disabled (2 项) |
| 手机号行渲染 mask            | mock store phone="+8613812345678" → "手机号" 行右侧渲染 `'+86 138****5678'`                                                                                  |
| 手机号行 phone=null fallback | mock store phone=null → "手机号" 行右侧渲染 `'未绑定'`                                                                                                       |
| tap "手机号" → push          | `router.push('/(app)/settings/account-security/phone')`                                                                                                      |
| tap "注销账号" → push        | `router.push('/(app)/settings/account-security/delete-account')`(spec C 占位)                                                                                |
| tap disabled (4 项)          | fireEvent press → 无 router 调用 + a11y disabled                                                                                                             |
| 反枚举 grep                  | `<Text>{accountId}>` / `<Text>ID:` 0 命中(grep 静态分析)                                                                                                     |
| 无右侧 🎧 客服 icon          | render → 无 🎧 字符 / 无 customer-service icon import                                                                                                        |

**Verify**:`pnpm --filter native test` — 应 RED。

### T6-impl

`apps/native/app/(app)/settings/account-security/_layout.tsx`:

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Stack } from 'expo-router';

export default function AccountSecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: '账号与安全' }} />
      <Stack.Screen name="phone" options={{ title: '手机号' }} />
      {/* delete-account 由 spec C 落地 — 本 spec 不预占位 */}
    </Stack>
  );
}
```

`apps/native/app/(app)/settings/account-security/index.tsx`:

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@nvy/auth';
import { maskPhone } from '../../../../lib/format/phone';

const COPY = {
  phone: '手机号',
  realname: '实名认证',
  thirdPartyBinding: '第三方账号绑定',
  loginDevices: '登录设备与授权管理',
  deleteAccount: '注销账号',
  securityTips: '安全小知识',
};

const DISABLED_OPACITY = 0.5;

export default function AccountSecurityIndex() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phone);

  return (
    <ScrollView>
      {/* Card 1: 手机号 / 实名认证 / 第三方账号绑定 */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/account-security/phone')}
          accessibilityRole="button"
          accessibilityLabel={COPY.phone}
        >
          <Text>{COPY.phone}</Text>
          <Text>{maskPhone(phone)}</Text>
          <Text>›</Text>
        </Pressable>
        {(['realname', 'thirdPartyBinding'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={undefined}
            accessibilityRole="button"
            accessibilityLabel={COPY[key]}
            accessibilityState={{ disabled: true }}
            style={{ opacity: DISABLED_OPACITY }}
          >
            <Text>{COPY[key]}</Text>
            <Text>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Card 2: 登录设备与授权管理 disabled */}
      <View>
        <Pressable
          onPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={COPY.loginDevices}
          accessibilityState={{ disabled: true }}
          style={{ opacity: DISABLED_OPACITY }}
        >
          <Text>{COPY.loginDevices}</Text>
          <Text>›</Text>
        </Pressable>
      </View>

      {/* Card 3: 注销账号 / 安全小知识 disabled */}
      <View>
        <Pressable
          onPress={() => router.push('/(app)/settings/account-security/delete-account')}
          accessibilityRole="button"
          accessibilityLabel={COPY.deleteAccount}
        >
          <Text>{COPY.deleteAccount}</Text>
          <Text>›</Text>
        </Pressable>
        <Pressable
          onPress={undefined}
          accessibilityRole="button"
          accessibilityLabel={COPY.securityTips}
          accessibilityState={{ disabled: true }}
          style={{ opacity: DISABLED_OPACITY }}
        >
          <Text>{COPY.securityTips}</Text>
          <Text>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

**Verify**:`pnpm --filter native test` 全 GREEN;dev server 跑 → settings → 账号与安全 渲染。

**Commit message**:`feat(account): account-security/_layout + index list (M1.X / spec account-settings-shell T6)`

---

## T7 — `account-security/phone.tsx` mask 详情(per spec FR-008 + FR-018)

**TDD**:phone screen test 先红。

### T7-test:`apps/native/app/(app)/settings/account-security/__tests__/phone.test.tsx`

| 测试 case           | Mock                         | Expect                                                             |
| ------------------- | ---------------------------- | ------------------------------------------------------------------ |
| 渲染 mask           | store phone="+8613812345678" | render → `getByText('+86 138****5678')`                            |
| phone=null fallback | store phone=null             | render → `getByText('未绑定')`                                     |
| 反枚举 grep         | (any phone)                  | render container.textContent 不含 `'13812345678'` 等 7+ 位连续明文 |

**Verify**:`pnpm --filter native test` — 应 RED。

### T7-impl:`apps/native/app/(app)/settings/account-security/phone.tsx`

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { ScrollView, Text } from 'react-native';
import { useAuthStore } from '@nvy/auth';
import { maskPhone } from '../../../../lib/format/phone';

const COPY = { empty: '未绑定' };

export default function PhoneScreen() {
  const phone = useAuthStore((s) => s.phone);
  const masked = maskPhone(phone);

  return (
    <ScrollView>
      <Text>{masked}</Text>
    </ScrollView>
  );
}
```

**Verify**:`pnpm --filter native test` 全 GREEN;dev server 跑 → 账号与安全 → 手机号 mask 渲染。

**Commit message**:`feat(account): account-security/phone mask detail (M1.X / spec account-settings-shell T7)`

---

## T8 — `legal/_layout` + 2 法规占位页(per spec FR-009 + FR-011 + Q6)

**TDD**:法规 page test 先红。

### T8-test:`apps/native/app/(app)/settings/legal/__tests__/personal-info.test.tsx` + `third-party.test.tsx`

| 测试 case                    | Expect                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| personal-info 渲染占位文案   | render → `getByText('本清单内容由法务团队定稿后填入,预计 M3 内测前完成。')`        |
| third-party 渲染占位文案     | 同上                                                                               |
| layout title (personal-info) | `Stack.Screen name="personal-info"` options.title = `'《个人信息收集与使用清单》'` |
| layout title (third-party)   | `Stack.Screen name="third-party"` options.title = `'《第三方共享清单》'`           |

**Verify**:`pnpm --filter native test` — 应 RED。

### T8-impl

`apps/native/app/(app)/settings/legal/_layout.tsx`:

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { Stack } from 'expo-router';

export default function LegalLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="personal-info" options={{ title: '《个人信息收集与使用清单》' }} />
      <Stack.Screen name="third-party" options={{ title: '《第三方共享清单》' }} />
    </Stack>
  );
}
```

`apps/native/app/(app)/settings/legal/personal-info.tsx`:

```tsx
// PHASE 1 PLACEHOLDER — business flow validated; visuals pending mockup.
import { ScrollView, Text } from 'react-native';

const COPY = {
  body: '本清单内容由法务团队定稿后填入,预计 M3 内测前完成。',
};

export default function PersonalInfoListScreen() {
  return (
    <ScrollView>
      <Text>{COPY.body}</Text>
    </ScrollView>
  );
}
```

`apps/native/app/(app)/settings/legal/third-party.tsx`:同上模板,内容相同。

**Verify**:`pnpm --filter native test` 全 GREEN;dev server 跑 → settings → footer 双链接各跳页面渲染。

**Commit message**:`feat(account): legal/_layout + 2 placeholder pages (M1.X / spec account-settings-shell T8)`

---

## T9 — 集成测 + 反枚举静态分析(per spec SC-007 / SC-010 / US9 / SC-005)

### T9-test:`apps/native/app/__tests__/integration/account-settings-shell-flow.test.tsx`

| 测试 case                                                           | Expect                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| settings/index → push account-security                              | render integration → tap "账号与安全" → URL 在 account-security/index                                                                                  |
| account-security/index → push phone → 返回                          | tap "手机号" → URL 在 phone → tap < 返回 → URL 回 account-security/index                                                                               |
| settings → footer "《个人信息...》" → push                          | tap → URL 在 legal/personal-info → 返回 → settings/index                                                                                               |
| settings → footer "《第三方...》" → push                            | tap → URL 在 legal/third-party                                                                                                                         |
| 退出登录全流(msw 200)                                               | tap "退出登录" → Alert "确定" → logoutAll(204)→ store phone=null + accessToken=null → router.replace login → store empty                               |
| 退出登录全流(msw 503)best-effort                                    | 同上但 logoutAll 503 → console.warn + 仍 router.replace + store phone=null(by finally)                                                                 |
| Stack pop 全链:phone → account-security → settings → (tabs)/profile | 模拟 tap < 返回各层 → URL 链正确 + 底 tab bar 重新可见(per CL-002 (b))                                                                                 |
| 反枚举 grep 静态分析                                                | `rg "accountId" apps/native/app/\(app\)/settings/` 命中点都是 store key 访问(`useAuthStore(s => s.accountId)`),不在 `<Text>` 内;`rg "\d{7,11}"` 0 命中 |

### T9-grep:静态分析(同 task 内执行,覆盖 SC-003 / SC-005 / SC-011)

```bash
# SC-003: 占位 UI 无视觉决策(允许 opacity 0.5 占位常量 + color: 'blue' footer 占位)
rg -n "#[0-9a-fA-F]{3,8}\\b|rgb\\s*\\(|[0-9]+px\\b" apps/native/app/\(app\)/settings/
# 期望:0 命中(占位常量 0.5 是数字字面量不算 px / hex)

# SC-005: 反枚举不变性
rg -n "accountId" apps/native/app/\(app\)/settings/
# 期望:仅作 store key 访问(`useAuthStore(s => s.accountId)`)— 但本 spec 不读 accountId,理想 0 命中
rg -n "\d{7,11}" apps/native/app/\(app\)/settings/
# 期望:0 命中(无明文 phone)

# SC-003 + FR-013: 不引 packages/ui
rg -n "from '@nvy/ui'" apps/native/app/\(app\)/settings/
# 期望:0 命中
```

如有命中,task RED → 移除 hex / px(SC-003)/ 移除 accountId 渲染(SC-005)/ 移除 packages/ui import(FR-013)。

**Verify**:`pnpm --filter native test` 全 GREEN(含集成测覆盖 SC-007 / SC-010 关键不变性);grep 0 命中。

**Commit message**:`test(account): account-settings-shell integration + grep (M1.X / spec account-settings-shell T9)`

---

## T10 — Playwright 真后端冒烟(per spec SC-006)

### T10-impl:`apps/native/runtime-debug/2026-05-XX-account-settings-shell-business-flow/`

**双 bundle 验证**(per plan 风险段 — Stack 嵌套 header / Alert RN Web 行为):

- **Web bundle**(Playwright + chromium):覆盖 全流路径 + Alert 弹窗 + 退出登录回 login
- **Native bundle**(iOS / Android 模拟器,manual 跑):仅 Alert destructive 视觉差异手动检查;native runtime smoke 不强制每个 PR 跑(per CLAUDE.md 测试范围)

```text
runtime-debug/2026-05-XX-account-settings-shell-business-flow/
├── README.md           # 跑法 + 双 bundle 验证清单 + Web Alert 视觉降级说明 + 截图描述
├── run.mjs              # Playwright 脚本(Web bundle)
├── 01-login-arrived.png
├── 02-cold-start-tabs-profile.png       # 已 onboarded 默认 landing
├── 03-tap-settings-icon.png             # ⚙️ 点击后
├── 04-settings-index.png                # 设置主页 list
├── 05-tap-account-security.png          # 推入账号与安全
├── 06-account-security-list.png         # 账号与安全主页(含 phone mask)
├── 07-tap-phone-row.png                 # 推入手机号 detail
├── 08-phone-detail.png                  # 手机号 mask 渲染
├── 09-back-to-account-security.png      # 返回行为
├── 10-back-to-settings.png              # 返回 settings
├── 11-tap-legal-link.png                # tap 法规链接
├── 12-legal-personal-info.png           # 法规页占位
├── 13-back-to-settings.png
├── 14-tap-logout.png                    # tap 退出登录
├── 15-alert-confirm.png                 # Alert 弹窗(Web window.confirm 形式)
├── 16-after-confirm.png                 # 跳回 login
└── 17-bottom-tab-hidden-during-stack.txt # native 模拟器:settings stack 期间底 tab 真隐藏验证 notes
```

### T10-script(`run.mjs`)逻辑

1. boot dev server(假定外部已启动)
2. boot Playwright + chromium
3. Login(phone-sms-auth happy path,沿用 onboarding 既有 mock)→ AuthGate 跳 (tabs)/profile
4. screenshot 02:cold-start landing
5. tap ⚙️ → screenshot 03
6. screenshot 04:settings/index
7. tap 账号与安全 → screenshot 05 + 06
8. tap 手机号 → screenshot 07 + 08(验证 mask 显示)
9. tap < 返回 → screenshot 09 → screenshot 10
10. tap 法规链接 → screenshot 11 + 12
11. screenshot 13:返回 settings/index
12. tap "退出登录" → screenshot 14 + 15(Web `window.confirm` 弹出)
13. dialog.accept() → screenshot 16(跳回 login)

### T10-verify

manual 检查 17 张截图 + console 无 critical error;Web `window.confirm` 视觉降级记录在 README.md 中(per 决策 5)。

**Commit message**:`test(account): account-settings-shell real backend smoke (M1.X / spec account-settings-shell T10)`

---

## T11 — spec.md 同步修订 + tasks.md ✅(per plan § spec.md 同步修订段)

**目的**:plan 决策对 spec 影响的 5 处修订(per plan § spec.md 同步修订段);+ tasks.md 全勾。

### T11-impl

**修订 spec.md**(/speckit.analyze round 1 阶段执行):

| spec.md 段                 | 修订                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| FR-005                     | ② 步改"由 logoutAll 内部 finally 块负责清 session(含 phone,per plan 决策 1+8)— UI 不重复调用 clearSession" |
| FR-019                     | 加"具体实现:组件 useState isLoading + Pressable disabled + opacity 0.5(per plan 决策 9)"                   |
| FR-011                     | 改"phone 字段 plan 已决策(决策 1)采用 (A) store 加字段方案"                                                |
| Open Questions Q1-Q8       | Q1/Q2/Q3/Q4/Q5/Q6/Q7/Q8 各项标 ✅(plan 决)/ 🟡(plan-impl 阶段决)                                           |
| Assumptions & Dependencies | `useAuthStore` 描述加 phone 字段(per plan 决策 1)                                                          |

**修订 tasks.md**(本 PR):本文件 T1 ~ T11 全勾 ✅(impl 阶段每 task 完成同 commit 加,per meta sdd.md § /implement 闭环 6 步)。

**Verify**:`/speckit.analyze` round 1 跑 → spec / plan / tasks 一致性扫描通过。

**Commit message**:`docs(account): sync spec.md per plan decisions + tasks.md ✅ (M1.X / spec account-settings-shell T11)`

---

## 总览

| Phase             | task 数 | 估时   | 输出                                                                                         |
| ----------------- | ------- | ------ | -------------------------------------------------------------------------------------------- |
| 本 PR(docs-only)  | 3       | 已完成 | spec.md / plan.md / tasks.md                                                                 |
| Impl PR           | 11      | 8-12h  | packages/auth phone 扩展 + maskPhone + 8 路由文件 + 集成测 + Playwright 冒烟 + spec 同步修订 |
| Mockup PHASE 2 PR | 5       | TBD    | mockup-prompt + bundle + handoff + 改写 5 page + plan.md UI 段回填 + 视觉冒烟                |

---

## 变更记录

- **2026-05-07**:本 tasks 首次创建。基于 spec.md(round 1 clarify CL-001 ~ CL-004 已完成)+ plan.md(10 关键决策)拆 11 个 impl tasks(T1 ~ T11)+ 3 个 docs tasks(T_doc1-3)+ 5 个 mockup tasks(T_mock / T12-T16)占位空表。每 task 30min-2h,TDD 节奏(测试绑定到实现);每 task 完成同 commit 加 ✅(per meta sdd.md § /implement 闭环 6 步)。
