# Tasks: Login Page (unified phone-SMS auth)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Branch**: `docs/login-spec-rewrite-adr-0016`（本次 docs-only） / 后续 M1.3 impl PR 用独立分支
**Created**: 2026-05-04（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md)；2026-05-03 双 tab 版 tasks 整体重写）
**Status**: docs-only（spec / plan / tasks 三件套改写）；任何 impl 留下次 dedicated session

> **昨日 PR #48 已落地**（business 层）：T0/T0t/T1/T1t/T2 + design/source mockup v1 + design-tokens mirror + login.tsx 占位 + AuthGate（PR #42）。
>
> **本次 PR**（5-04）：spec / plan / tasks 三件套改写为 unified phone-SMS auth；旧 design/source 标 SUPERSEDED；**0 行 impl**。
>
> **下次 dedicated session 范围**：M1.3 impl PR — 按 T0-T6 顺序执行（依赖 server PR-B 已 merged + 新版 mockup 落地）。

## 任务清单

### 已完成（PR #48 / PR #42 落地）

| #        | 层级            | 任务                                                                                                   | 文件                                                         | 状态               |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------ |
| ✅T_old0 | [Schema]        | 旧 zod schema (loginPasswordSchema + loginSmsSchema) + mapApiError v1（昨日 PR #48 修复加 FetchError） | `apps/native/lib/validation/login.ts`                        | ✅                 |
| ✅T_old1 | [Hook]          | 旧 useLoginForm 双 tab 状态机 hook                                                                     | `apps/native/lib/hooks/use-login-form.ts`                    | ✅                 |
| ✅T_old2 | [App]           | login.tsx 双 tab UI + 12 个 packages/ui 组件                                                           | `apps/native/app/(auth)/login.tsx` + `packages/ui/src/*.tsx` | ✅                 |
| ✅T_old3 | [Mockup]        | v1 mockup bundle（双 tab 设计）                                                                        | `apps/native/spec/login/design/source/`                      | ✅ → 标 SUPERSEDED |
| ✅T_old4 | [AuthGate]      | 全局 auth guard + AuthGate state listener                                                              | `apps/native/app/_layout.tsx`                                | ✅                 |
| ✅T_old5 | [B2 真后端冒烟] | Playwright 4 状态截图（happy / 401 / 429 / network）                                                   | `apps/native/tools/runtime-debug.mjs`                        | ✅                 |

### 本次（5-04 docs-only）

| #        | 层级     | 任务                                                  | 文件                                          | 状态        |
| -------- | -------- | ----------------------------------------------------- | --------------------------------------------- | ----------- |
| ✅T_doc1 | [Spec]   | 改写 spec.md 为 unified phone-SMS auth                | `apps/native/spec/login/spec.md`              | ✅（本 PR） |
| ✅T_doc2 | [Plan]   | 改写 plan.md 数据流 / 状态机 / 错误映射 / UI 结构 TBD | `apps/native/spec/login/plan.md`              | ✅（本 PR） |
| ✅T_doc3 | [Tasks]  | 改写本文件 — 重排任务 + 引入 T0-T6 实施步骤           | `apps/native/spec/login/tasks.md`             | ✅（本 PR） |
| ✅T_doc4 | [Design] | 旧 v1 mockup 加 SUPERSEDED.md 指针指向 v2             | `apps/native/spec/login/design/SUPERSEDED.md` | ✅（本 PR） |

### 下次 — Mockup 阶段（user 单独跑）

| #      | 层级        | 任务                                                                                                                                                          | 文件                                                       | 状态        |
| ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| T_mock | [Mockup v2] | Claude Design 出新版合一页 mockup（按 [`docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 2.1b prompt 模板） | `apps/native/spec/login/design/source-v2/` + handoff.md 改 | TBD（user） |

### 下次 — M1.3 impl PR（依赖 mockup v2 + server PR-B merged）

| #   | 层级            | 任务                                                                                                                                                                                                                              | 文件                                                                 | TDD 节奏                                           |
| --- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| T0  | [API client]    | `pnpm api:gen:dev` 拉 server unified spec；自动删 `AccountRegisterControllerApi` + `AuthControllerApi`；新增 `AccountAuthControllerApi.phoneSmsAuth` + 简化 `AccountSmsCodeApi.requestSmsCode({phone})`                           | `packages/api-client/src/generated/`                                 | 自动生成；commit 前跑 `pnpm -r typecheck` 全绿     |
| T1  | [Auth pkg]      | 删 `loginByPassword` / `loginByPhoneSms` wrapper；新增 `phoneSmsAuth(phone, code)` wrapper；TDD 单测                                                                                                                              | `packages/auth/src/usecases.ts` + `__tests__/usecases.test.ts`       | 红 → 绿                                            |
| T2  | [Schema]        | 改写 `lib/validation/login.ts`：删 `loginPasswordSchema` + `loginSmsSchema`，新增 `phoneSmsAuthSchema`；`mapApiError` 文案改"手机号或验证码错误"（删"密码"字样）                                                                  | `apps/native/lib/validation/login.ts` + `login.test.ts`              | 改 + 测                                            |
| T3  | [Hook]          | 改写 `lib/hooks/use-login-form.ts`：5 状态机；删 tab state；删 password submit；改名为 `use-phone-sms-auth-form.ts` 或保留路径名（TBD 实施时定）                                                                                  | `apps/native/lib/hooks/use-login-form.ts` + `use-login-form.test.ts` | 改 + 测                                            |
| T4  | [packages/ui]   | 删 `PasswordField.tsx`（per ADR-0016 决策 2）；新增 `WechatButton.tsx` + `AppleButton.tsx`（参考既有 `GoogleButton.tsx` 设计）；评估 `TabSwitcher.tsx` 改名为 `OAuthButtonRow.tsx` 或删                                           | `packages/ui/src/*.tsx`                                              | TDD-emerge per packages/ui 习惯                    |
| T5  | [App]           | 改写 `apps/native/app/(auth)/login.tsx`：删 TabSwitcher / PasswordField 渲染；改单 form；加三方 OAuth row（含 Apple `Platform.OS === 'ios'` conditional）+ "立即体验" + "登录遇到问题" placeholder；className 1:1 paste 新 mockup | `apps/native/app/(auth)/login.tsx`                                   | 改 + 测                                            |
| T6  | [App]           | 删 `apps/native/app/(auth)/register.tsx` placeholder（per ADR-0016 决策 1，无独立 register 页）                                                                                                                                   | `apps/native/app/(auth)/register.tsx`                                | 单文件删                                           |
| T7  | [B2 真后端冒烟] | Playwright runtime-debug.mjs 跑 4 状态（happy 已注册 / happy 未注册 / 401 / 429 / network）；验证 SC-002 反枚举一致响应 client 无感                                                                                               | `apps/native/tools/runtime-debug.mjs`                                | per `docs/experience/claude-design-handoff.md` § 6 |

---

## T0 — pnpm api:gen 拉 server unified spec

**前置**：server PR-B（`docs/phone-sms-auth-spec`）已 merged。

**操作**：

```bash
cd no-vain-years-app
pnpm api:gen:dev   # 后端 dev server 已起；通过 http://localhost:8080/v3/api-docs 拉 spec
```

**验证**：

```bash
git status -- packages/api-client/src/generated/
# 期望：
#   - 删除 AccountRegisterControllerApi.ts (含 RegisterByPhoneRequest / Response)
#   - 删除 AuthControllerApi.ts (含 LoginByPhoneSmsRequest / LoginByPasswordRequest)
#   - 新增 AccountAuthControllerApi.ts (含 PhoneSmsAuthRequest / Response)
#   - 简化 AccountSmsCodeApi.ts (RequestSmsCodeRequest 删 purpose 字段)

pnpm -r typecheck
# 此时**预期红**——packages/auth 旧 wrapper 引用已删的 API class
# 由 T1 修复
```

---

## T1 — packages/auth 加 phoneSmsAuth wrapper

**TDD**：先写 unit test，再实现。

### T1-test：删 loginByPassword / loginByPhoneSms 测试 + 加 phoneSmsAuth 测试

定位 `packages/auth/src/__tests__/usecases.test.ts`：

- 删 `loginByPassword` happy / 401 / 429 / network 4 case
- 删 `loginByPhoneSms` happy / 401 / 429 / network 4 case
- 新增 `phoneSmsAuth(phone, code)`：
  - happy → 返回 `{accountId, accessToken, refreshToken}` + store.setSession 调 1 次
  - 401 → throw ResponseError 401
  - 429 → throw ResponseError 429
  - network (FetchError) → throw FetchError
  - **反枚举一致响应**：mock `phoneSmsAuth` 4 种 server 响应（已注册 happy / 未注册 happy / FROZEN 401 / 码错 401），断言 client wrapper 行为不区分（happy 路径完全 equal；401 路径完全 equal）

**Verify**: `pnpm --filter @nvy/auth test` 全 RED

### T1-impl：phoneSmsAuth wrapper

新建 `packages/auth/src/usecases.ts` 中 `phoneSmsAuth(phone, code)`：

```ts
import { Configuration, AccountAuthControllerApi, ResponseError } from '@nvy/api-client/generated';
import { useAuthStore } from './store';

export async function phoneSmsAuth(
  phone: string,
  code: string,
): Promise<{
  accountId: string;
  accessToken: string;
  refreshToken: string;
}> {
  const api = new AccountAuthControllerApi(/* config from env */);
  const result = await api.phoneSmsAuth({ phoneSmsAuthRequest: { phone, code } });
  useAuthStore.getState().setSession({
    accountId: result.accountId,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
}
```

**删除既有**：`loginByPassword` / `loginByPhoneSms` 两 export + 实现整段。

**Verify**: T1-test 全 GREEN

---

## T2 — 改写 lib/validation/login.ts

**TDD**：先改 test，再改实现。

### T2-test：改 lib/validation/login.test.ts

定位现有 test：

- 删 `loginPasswordSchema` 全部 case
- 删 `loginSmsSchema` 全部 case
- 新增 `phoneSmsAuthSchema`：
  - phone 合法 / 短手机号 / 非大陆号 / 空 phone
  - smsCode 合法 / 短码 / 非数字码 / 空码
- 改 `mapApiError`：
  - 401 → `'手机号或验证码错误'`（删"密码"字样）
  - 其他错误码不变

**Verify**: 全 RED

### T2-impl：改 lib/validation/login.ts

```ts
export const phoneSmsAuthSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'INVALID_PHONE_FORMAT'),
  smsCode: z.string().regex(/^\d{6}$/, 'INVALID_SMS_CODE_FORMAT'),
});
export type PhoneSmsAuthValues = z.infer<typeof phoneSmsAuthSchema>;
```

删除：`loginPasswordSchema` / `loginSmsSchema` / `LoginPasswordValues` / `LoginSmsValues`。

`mapApiError` 401 case 文案改：

```ts
return { kind: 'invalid', toast: '手机号或验证码错误' };
```

**Verify**: T2-test 全 GREEN

---

## T3 — 改写 lib/hooks/use-login-form.ts

**TDD**：先改 test，再改实现。

### T3-test：改 use-login-form.test.ts

- 删 `submitPassword` 全部 case
- 删 `setTab` 全部 case + tab 切换错误清空
- 改 `submitSms` → `submit`（重命名）；测试场景：
  - happy（已注册 + 未注册两种 server 响应字节级一致 → client 无感）
  - 401（FROZEN / 码错 / 已注册号+错码 — server 字节级一致 → client errorToast 一致）
  - 429 + FetchError + 网络错
- `requestSms`：
  - happy → 调 `getAccountSmsCodeApi().requestSmsCode({phone})` 1 次（**无 purpose 参数**）；smsCountdown 60 → 0 倒计时
  - 倒计时未到再次调用 → api 不再调
- `showPlaceholderToast(feature)`：
  - 'wechat' → toast "微信登录 - Coming in M1.3"
  - 'google' → toast "Google 登录 - Coming in M1.3"
  - 'apple' → toast "Apple 登录 - Coming in M1.3"
  - 'guest' → toast "游客模式 - Coming in M2"
  - 'help' → toast "帮助中心 - Coming in M1.3"
- unmount 时 timer cleanup

**Verify**: 全 RED

### T3-impl：改 use-login-form.ts

```ts
type AuthState = 'idle' | 'requesting_sms' | 'sms_sent' | 'submitting' | 'success' | 'error';

export function useLoginForm() {
  const [state, setState] = useState<AuthState>('idle');
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestSms = async (phone: string) => {
    /* ... */
  };
  const submit = async (phone: string, code: string) => {
    /* phoneSmsAuth wrapper */
  };
  const showPlaceholderToast = (feature: 'wechat' | 'google' | 'apple' | 'guest' | 'help') => {
    /* ... */
  };
  const clearError = () => {
    setErrorToast(null);
    setState((s) => (s === 'error' ? (smsCountdown > 0 ? 'sms_sent' : 'idle') : s));
  };

  // 清 timer cleanup useEffect
  // ...

  return { state, errorToast, smsCountdown, requestSms, submit, showPlaceholderToast, clearError };
}
```

删除：`tab` state / `setTab` / `submitPassword`。

**Verify**: T3-test 全 GREEN

---

## T4 — packages/ui 改动

### T4.1 删 PasswordField.tsx

```bash
rm packages/ui/src/PasswordField.tsx
rm packages/ui/src/__tests__/PasswordField.test.tsx
# 删除 packages/ui/src/index.ts 的 PasswordField export
```

**Verify**: `pnpm --filter @nvy/ui typecheck` 期望 TypeScript 报错 `PasswordField is not exported`（在 login.tsx 仍引用）→ 由 T5 修复

### T4.2 新增 WechatButton.tsx

参考 `GoogleButton.tsx` 设计；微信品牌绿色（design-tokens 加 brand 系列扩展？或临时用 `bg-[#1AAD19]` ad-hoc — 等 M1.3 实施时定）；圆形 icon-only。

TDD 节奏：先写 test（render + accessibilityLabel + onPress mock）→ 实现。

### T4.3 新增 AppleButton.tsx

参考 `GoogleButton.tsx` 设计；黑色背景 + 白色苹果 icon；圆形 icon-only。

**注意**：组件本身跨端可渲染，**不**在组件内部做 `Platform.OS === 'ios'` 判（per FR-007 + plan.md 反模式）；conditional 在 caller 端。

TDD 节奏：同 WechatButton。

### T4.4 评估 TabSwitcher.tsx 改名或删

login 页不再需要 TabSwitcher（per spec FR-001 单 form）；其他页面（home / profile）当前 M1.2 也未用此组件。M1.3 impl PR 评估：

- 选项 A：改名为 `OAuthButtonRow.tsx`（用于三方 OAuth 横排容器）— 但该容器布局简单（`flex-row gap-6 justify-center`），不抽组件可能更合适
- 选项 B：直接删除（组件在 mvp 后无人用，未来需要再写）

倾向 B，M1.3 实施时定。

**Verify**: 全 packages/ui 测 + ts 全绿后 commit

---

## T5 — 改写 login.tsx

**改** `apps/native/app/(auth)/login.tsx`：

- 删 import：`TabSwitcher` / `PasswordField` / `loginPasswordSchema` / `loginSmsSchema` / `loginByPassword` / `loginByPhoneSms`
- 加 import：`WechatButton` / `AppleButton`（M1.3 PR 加） / `Platform from 'react-native'` / `phoneSmsAuthSchema` / `phoneSmsAuth` / `useLoginForm` （改）
- 渲染（依赖新 mockup 落地后才能 1:1 paste）：

```tsx
import { Platform } from 'react-native';
// ...

export default function LoginScreen() {
  const { state, errorToast, smsCountdown, requestSms, submit, showPlaceholderToast, clearError } = useLoginForm();
  // RHF + zod
  return (
    <KeyboardAvoidingView ...>
      <View>
        {/* 顶部 "立即体验" */}
        <Pressable accessibilityLabel="立即体验" onPress={() => showPlaceholderToast('guest')}>
          <Text>立即体验</Text>
        </Pressable>

        {/* Logo + 副标题 */}
        <LogoMark />
        <Text>...</Text>

        {/* 单 form */}
        <PhoneInput ... />
        <SmsInput ... onSendCode={() => requestSms(phone)} countdown={smsCountdown} />
        <PrimaryButton onPress={() => submit(phone, smsCode)} disabled={!isValid || state === 'submitting'} />

        {/* errorToast */}
        {errorToast && <ErrorRow message={errorToast} />}

        {/* 三方 OAuth 横排 */}
        <View style={{ flexDirection: 'row', gap: 24, justifyContent: 'center' }}>
          <WechatButton onPress={() => showPlaceholderToast('wechat')} />
          <GoogleButton onPress={() => showPlaceholderToast('google')} />
          {Platform.OS === 'ios' && <AppleButton onPress={() => showPlaceholderToast('apple')} />}
        </View>

        {/* 底部 link */}
        <Pressable onPress={() => showPlaceholderToast('help')}>
          <Text>登录遇到问题</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
```

className 由 mockup v2 落地后 1:1 paste（per `claude-design-handoff.md` § 5）。

**Verify**: `pnpm --filter native typecheck && pnpm --filter native test && pnpm --filter native lint && pnpm --filter native start`（浏览器肉眼验单 form 渲染）

---

## T6 — 删 register.tsx placeholder

```bash
rm apps/native/app/(auth)/register.tsx
# 检查 expo-router 是否有跳 register 的代码：
grep -r "register" apps/native/app/ apps/native/lib/
# 期望仅 hint：footer 早已删除 "创建一个" link（T5 改 login.tsx 时一并删）
```

**Verify**: `pnpm --filter native typecheck` 全绿

---

## T7 — B2 真后端冒烟

按 `docs/experience/claude-design-handoff.md` § 6 SOP：

```bash
# 后端起 (server 仓)
cd my-beloved-server
docker compose -f docker-compose.dev.yml up -d  # PG + Redis
./mvnw -pl mbw-app -f mbw-app/pom.xml spring-boot:run  # 等到 8080 listening

# 前端 (app 仓)
cd no-vain-years-app
echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:8080" > apps/native/.env
pnpm web

# Playwright 4 状态 + 反枚举验证
node apps/native/tools/runtime-debug.mjs <action-list-spec>
```

4 状态截图：

- happy 已注册号 → success → router.replace `/(app)/`
- happy 未注册号 → success（client 视角与已注册一致；DB 验证新增 Account 记录 — 在 server 仓查）
- 401（错码 / FROZEN）→ errorToast "手机号或验证码错误"
- 429 + 网络错 → errorToast 对应

**Verify**: 4 截图齐 + DB 状态验证（已注册 lastLoginAt 更新；未注册新建 Account ACTIVE）

---

## 完成定义（M1.3 impl PR ready 前）

| #   | 验收                                                         |
| --- | ------------------------------------------------------------ |
| ✅  | spec.md / plan.md / tasks.md 三件套是 unified phone-SMS auth |
| ✅  | design/SUPERSEDED.md 在；旧 source bundle 保留               |
| 🟡  | 新版 mockup 落地（user 单独跑 Claude Design）                |
| 🟡  | T0-T6 impl 完成；`pnpm -r test/typecheck/lint` 全绿          |
| 🟡  | T7 B2 真后端冒烟 4 状态全过                                  |
| 🟡  | M1.3 PR open as ready；CI 全绿 + auto-merge                  |
