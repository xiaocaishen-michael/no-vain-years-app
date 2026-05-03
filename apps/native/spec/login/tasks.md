# Tasks: Login Page

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Branch**: `feat/account-login-page`
**Created**: 2026-05-03

> **当前 feat/account-login-page 分支已完成**：T0 + T1 + T2 + T3（业务逻辑 + 最小 UI 占位）+ T4 + T5（mockup 落地 + spec/plan drift 修订）
> **下次 PR 范围**：T6 + T7（packages/ui 组件 TDD-emerge + login.tsx className 1:1 paste mockup）；T8 E2E 在 dev server 实际运行后单测 + 手测合并入下次 PR 验收

## 任务清单

### 本次 — 业务逻辑层（不依赖 mockup）

| #   | 层级     | 任务                                               | 文件                                           | TDD 节奏                                                        |
| --- | -------- | -------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| T0  | [Schema] | zod schema + 错误映射工具函数                      | `apps/native/lib/validation/login.ts`          | 单测先红 → 实现 → 绿                                            |
| T0t | [Test]   | T0 单测                                            | `apps/native/lib/validation/login.test.ts`     | 同 T0                                                           |
| T1  | [Hook]   | useLoginForm 状态机 hook                           | `apps/native/lib/hooks/use-login-form.ts`      | 单测先红 → 实现 → 绿                                            |
| T1t | [Test]   | T1 单测                                            | `apps/native/lib/hooks/use-login-form.test.ts` | 同 T1                                                           |
| T2  | [App]    | login.tsx 接 useLoginForm，最小占位                | `apps/native/app/(auth)/login.tsx`             | 改后跑 typecheck + lint + expo dev server 浏览器肉眼验 tab 切换 |
| T3  | [Verify] | 跑 `pnpm --filter native test/typecheck/lint` 全绿 | —                                              | —                                                               |

### 下次 — UI 渲染层（等 mockup 落地）

| #   | 层级        | 任务                                                                                                                                                                                                                                            | 文件                                         | 状态                                    |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| T4  | [Mockup]    | Claude Design v2 bundle 落地（LoginScreen.tsx + 子组件全套 + handoff.md + token mirror 到 design-tokens）                                                                                                                                       | `apps/native/spec/login/design/`             | ✅ 完成（commit `3f2cddd`，2026-05-03） |
| T5  | [Plan 回填] | plan.md `## UI 结构` 段从 TBD 改为吸收 mockup 后的完整结构 + spec.md 4 处 drift 修订（D1-D4）+ 翻译期硬约束 5 条                                                                                                                                | `apps/native/spec/login/plan.md` + `spec.md` | ✅ 完成（本 PR 内）                     |
| T6  | [UI 组件]   | packages/ui TDD-emerge：TabSwitcher / PhoneInput / PasswordField / SmsInput / PrimaryButton / SuccessCheck / Spinner / ErrorRow / GoogleButton / LogoMark / SuccessOverlay + 单测（**注**：mockup 含 TopBar / AgreeRow per D2/D3 删除，不抽出） | `packages/ui/src/<Component>.tsx`            | TBD（下次 PR）                          |
| T7  | [App]       | login.tsx 替换占位为真实组件 + className 1:1 paste mockup（注意翻译期硬约束 5 条：w-18→w-16/w-[72px] / reanimated install / +86 静态 / SMS CTA "登录" / 默认 mode password）                                                                    | `apps/native/app/(auth)/login.tsx`           | TBD（下次 PR）                          |
| T8  | [E2E]       | expo dev server 浏览器手测完整 5 条 acceptance scenario；iOS / Android 真机 → M2.1                                                                                                                                                              | —                                            | TBD                                     |

---

## T0 — zod schema + 错误映射

**新建** `apps/native/lib/validation/login.ts`：

```ts
import { z } from 'zod';

export const PHONE_REGEX = /^\+861[3-9]\d{9}$/;

export const loginPasswordSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'INVALID_PHONE_FORMAT'),
  password: z.string().min(1, 'PASSWORD_REQUIRED'),
});

export const loginSmsSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'INVALID_PHONE_FORMAT'),
  smsCode: z.string().regex(/^\d{6}$/, 'INVALID_SMS_CODE_FORMAT'),
});

export type LoginPasswordValues = z.infer<typeof loginPasswordSchema>;
export type LoginSmsValues = z.infer<typeof loginSmsSchema>;

export type ApiErrorKind = 'invalid' | 'rate_limit' | 'network' | 'unknown';

export interface MappedApiError {
  kind: ApiErrorKind;
  toast: string;
}

export function mapApiError(error: unknown): MappedApiError {
  // 实现按 plan.md § 错误映射 表
}
```

**新建** 单测 `apps/native/lib/validation/login.test.ts`，覆盖：

- loginPasswordSchema：合法 / 短手机号 / 非大陆号 / 空密码
- loginSmsSchema：合法 / 短码 / 非数字码 / 空码
- mapApiError：401 / 429 / 500 / 400 / TypeError / unknown 各分支映射正确
- 关键不变性：所有 401 路径返回的 `{kind, toast}` 完全相等（防枚举）

### 验证

```bash
pnpm --filter native test -- --testPathPattern='lib/validation/login'
```

---

## T1 — useLoginForm 状态机 hook

**新建** `apps/native/lib/hooks/use-login-form.ts`：

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { getAccountRegisterApi } from '@nvy/api-client';
import { loginByPassword, loginByPhoneSms } from '@nvy/auth';
import { mapApiError, type MappedApiError } from '../validation/login';

export type LoginTab = 'password' | 'sms';
export type LoginState = 'idle' | 'submitting' | 'success' | 'error';

export interface UseLoginFormResult {
  tab: LoginTab;
  setTab: (tab: LoginTab) => void;
  state: LoginState;
  errorToast: string | null;
  smsCountdown: number; // 0 = ready；> 0 = 倒计时秒
  submitPassword: (phone: string, password: string) => Promise<void>;
  submitSms: (phone: string, smsCode: string) => Promise<void>;
  requestSms: (phone: string) => Promise<void>;
  showPlaceholderToast: (feature: 'wechat' | 'weibo' | 'google' | 'forgot-password') => void;
  clearError: () => void;
}

export function useLoginForm(): UseLoginFormResult {
  const [tab, setTabRaw] = useState<LoginTab>('password');
  const [state, setState] = useState<LoginState>('idle');
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // ... clearError + setTab(切换时清错) + submit*（state machine + mapApiError）
  // ... requestSms（调 getAccountRegisterApi().requestSmsCode + 60s 倒计时 + cleanup）
  // ... showPlaceholderToast（FR-007）
  // ... useEffect cleanup（unmount 时 clear timer）
}
```

实施细节按 plan.md § 数据流 + § 状态机；TDD 红绿驱动；hook 内部不直接 import store（loginByPassword 等 use case 已 setSession，hook 只负责导航 + 错误处理 + 倒计时）。

### 验证

```bash
pnpm --filter native test -- --testPathPattern='lib/hooks/use-login-form'
```

---

## T2 — useLoginForm 单测

**新建** `apps/native/lib/hooks/use-login-form.test.ts`：

| 场景                                                                      | mock                                             | 期望                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `submitPassword` happy                                                    | `loginByPassword` resolve                        | state idle → submitting → success；`router.replace` called w/ `/(app)/`；errorToast null    |
| `submitPassword` 401                                                      | `loginByPassword` reject `ResponseError(401)`    | state error；errorToast = "手机号或验证码/密码错误"；router 未调                            |
| `submitPassword` 429                                                      | `loginByPassword` reject `ResponseError(429)`    | state error；errorToast = "请求过于频繁，请稍后再试"                                        |
| `submitPassword` 网络错                                                   | `loginByPassword` reject `TypeError`             | state error；errorToast = "网络异常，请检查网络后重试"                                      |
| `submitSms` happy                                                         | `loginByPhoneSms` resolve                        | 同 password happy                                                                           |
| `submitSms` 401（已注册号 + 错码）vs `submitSms` 401（未注册号 + 任意码） | 两次都 reject `ResponseError(401)`               | 两次结果 `{state, errorToast}` 完全相等（SC-002 防枚举字节级一致）                          |
| `setTab('sms')` after error                                               | —                                                | errorToast 清空；state 回 idle                                                              |
| `requestSms(phone)`                                                       | `getAccountRegisterApi().requestSmsCode` resolve | api 调用 1 次且 args 含 `purpose: 'LOGIN'`；smsCountdown 60 → 0 倒计时（用 vi fake timers） |
| `requestSms` 倒计时未到再次调用                                           | smsCountdown > 0                                 | api 不再调；不抛错（按钮层 disabled 阻止用户）                                              |
| `showPlaceholderToast('wechat')`                                          | —                                                | errorToast = "微信登录 - Coming in M1.3"；state idle 不变；api 全部未调                     |
| unmount 时倒计时未结束                                                    | jest cleanup                                     | timer 已 clear，无 leak warning                                                             |

mock 方式：

```ts
vi.mock('@nvy/auth');
vi.mock('@nvy/api-client', () => ({
  getAccountRegisterApi: vi.fn(() => ({ requestSmsCode: vi.fn() })),
  ResponseError: class ResponseError extends Error {
    constructor(
      public response: { status: number },
      message?: string,
    ) {
      super(message);
    }
  },
  ApiClientError: class ApiClientError extends Error {},
}));
vi.mock('expo-router', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
```

参考：`packages/auth/src/usecases.test.ts`（PR #42 已落地的 mock pattern）。

### 验证

```bash
pnpm --filter native test -- --testPathPattern='use-login-form'
```

---

## T3 — login.tsx 接 useLoginForm 最小占位

**改** `apps/native/app/(auth)/login.tsx`：

- 删原 placeholder 内容（13 行）
- import + 调用 `useLoginForm()`
- 渲染：双 tab 切换（Pressable）+ 占位文案 + 切换可见
- 不实现 form input / submit（等 mockup → packages/ui 组件）

最终形态约 30-40 行；className 仅用 design-tokens 已暴露的 class（`bg-surface` / `text-text` / `text-muted` / `flex-1` / `flex-row` 等），不引入新视觉 token。

### 验证

```bash
pnpm --filter native typecheck    # TS strict 通过
pnpm --filter native lint         # ESLint 通过
pnpm --filter native start        # expo dev server，浏览器开 /(auth)/login
                                   # 手测：默认 tab "密码登录" 高亮；click "短信登录" 切高亮
```

---

## 完成定义（本次 PR ready 前）

| #   | 验收                                                                       |
| --- | -------------------------------------------------------------------------- |
| ✅  | `apps/native/spec/login/{spec,plan,tasks}.md` 三件套到位                   |
| ✅  | T0 + T0t 完成；schema + mapApiError 单测全绿                               |
| ✅  | T1 + T1t 完成；useLoginForm 单测全绿，覆盖所有状态转移 + SC-002 防枚举一致 |
| ✅  | T2 完成；login.tsx 接 hook，浏览器肉眼验 tab 切换                          |
| ✅  | T3 完成；`pnpm --filter native test/typecheck/lint` 全绿                   |
| 🟡  | PR open as **draft**（等 mockup 落地后转 ready；T5-T8 进下一 PR）          |
