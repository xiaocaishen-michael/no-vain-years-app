# Tasks: Login Page (unified phone-SMS auth)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2026-05-04（per [ADR-0016](../../../../docs/adr/0016-unified-mobile-first-auth.md)；2026-05-03 双 tab 版 tasks 整体重写）
**Status**: ✅ **Shipped** — T_mock + T0-T7 落地于 5-04 下午 PR #50-54；OAuth 真接入（微信/Google/Apple）+ 帮助中心 + 游客模式真实施仍归 M1.3+

> **5-04 上午 PR #49**（docs-only）：spec / plan / tasks 三件套改写为 unified phone-SMS auth；旧 design/source 标 SUPERSEDED。
>
> **5-04 下午 PR #50-54**（impl 阶段，Phase 1→4）：
>
> - **PR #50**（Phase 1）：business flow + 占位 UI — T0 (api:gen 拉旧版本占位) / T1 (auth wrapper 过渡) / T2 (zod schema) / T3 (5 状态机 hook) / T6 (删 register.tsx)
> - **PR #51**（Phase 2）：mockup v2 落地 + UI 完成 — T_mock + T4 (新 packages/ui WechatButton + AppleButton + LogoMark + ErrorRow) + T5 (login.tsx 单 form + className 1:1 paste)
> - **PR #52**：T4 后续 — LogoMark + WechatButton 升级真 SVG（react-native-svg）
> - **PR #53**：runtime-debug 截图归档目录约定 + Phase 3 session
> - **PR #54**（Phase 4 + final）：T0 真版本（server #118 merged 后 `pnpm api:gen:dev` 拉新 spec）+ T1 真 wrapper 切换（`getAccountAuthApi().phoneSmsAuth()`）+ T7 真后端冒烟（已注册 + 未注册自动注册两路径）

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

### Mockup 阶段（PR #51）

| #         | 层级        | 任务                                                                                                                                                          | 文件                                                             | 状态         |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| ✅ T_mock | [Mockup v2] | Claude Design 出新版合一页 mockup（按 [`docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) § 2.1b prompt 模板） | `apps/native/spec/login/design/source-v2/` + `design/handoff.md` | ✅（PR #51） |

### Impl 阶段（PR #50-54）

| #     | 层级            | 任务                                                                                                                                                                                                                                 | 文件                                                                                              | 状态                                            |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| ✅ T0 | [API client]    | `pnpm api:gen:dev` 拉 server unified spec；删 `AccountRegisterControllerApi` 旧 `registerByPhone` + `AuthControllerApi` 旧 login methods；新增 `AccountAuthControllerApi.phoneSmsAuth`；简化 `RequestSmsCodeRequest` 删 purpose 字段 | `packages/api-client/src/generated/`                                                              | ✅（PR #50 占位 → #54 真版本）                  |
| ✅ T1 | [Auth pkg]      | 删 `loginByPassword` / `loginByPhoneSms` wrapper；新增 `phoneSmsAuth(phone, code)` wrapper                                                                                                                                           | `packages/auth/src/usecases.ts` + `__tests__/usecases.test.ts`                                    | ✅（PR #50 过渡 wrapper → #54 切到真 API）      |
| ✅ T2 | [Schema]        | 改写 `lib/validation/login.ts`：删 `loginPasswordSchema` + `loginSmsSchema`；新增 `phoneSmsAuthSchema`；`mapApiError` 文案"手机号或验证码错误"                                                                                       | `apps/native/lib/validation/login.ts` + `login.test.ts`                                           | ✅（PR #50）                                    |
| ✅ T3 | [Hook]          | 改写 `lib/hooks/use-login-form.ts` 为 5 状态机（idle / requesting_sms / sms_sent / submitting / success / error）；删 tab state；删 password submit；保留路径名                                                                      | `apps/native/lib/hooks/use-login-form.ts` + `use-login-form.test.ts`                              | ✅（PR #50；#54 删 requestSms 的 purpose 字段） |
| ✅ T4 | [packages/ui]   | 删 `PasswordField.tsx`；新增 `WechatButton.tsx` + `AppleButton.tsx` + `LogoMark.tsx` + `ErrorRow.tsx`；`LogoMark` + `WechatButton` 升级真 SVG（react-native-svg）                                                                    | `packages/ui/src/*.tsx`                                                                           | ✅（PR #51 + #52）                              |
| ✅ T5 | [App]           | 改写 `apps/native/app/(auth)/login.tsx`：单 form + 三方 OAuth row（Apple iOS-only conditional）+ 顶部 close `×` 按钮 + "登录遇到问题" placeholder；className 按 mockup v2 1:1 paste                                                  | `apps/native/app/(auth)/login.tsx`                                                                | ✅（PR #51）                                    |
| ✅ T6 | [App]           | 删 `apps/native/app/(auth)/register.tsx` placeholder                                                                                                                                                                                 | `apps/native/app/(auth)/register.tsx`                                                             | ✅（PR #50）                                    |
| ✅ T7 | [B2 真后端冒烟] | runtime-debug.mjs 跑 happy 已注册 / happy 未注册自动注册两路径；DB state 验证（last_login_at 更新 + 新 Account ACTIVE 创建）                                                                                                         | `apps/native/runtime-debug/2026-05-04-phase3-unified-auth/` + `2026-05-04-phase4-server-unified/` | ✅（PR #53 截图归档约定 + #54 phase 4 冒烟）    |

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

## 完成定义（M1.2 落地状态）

| #   | 验收                                                                                               |
| --- | -------------------------------------------------------------------------------------------------- |
| ✅  | spec.md / plan.md / tasks.md 三件套是 unified phone-SMS auth                                       |
| ✅  | design/SUPERSEDED.md 在；旧 source bundle 保留；source-v2 mockup + handoff.md 落地（PR #51）       |
| ✅  | T_mock + T0-T7 impl 完成；`pnpm -r test/typecheck/lint` 全绿                                       |
| ✅  | T7 B2 真后端冒烟 — 已注册 + 未注册自动注册两路径全过（runtime-debug 截图归档于 phase 3 + phase 4） |
| ✅  | PR #50-54 全 merged（CI 全绿 + auto-merge）                                                        |
| 🟡  | OAuth 真接入（微信 / Google / Apple）— M1.3 范围                                                   |
| 🟡  | "登录遇到问题" 帮助中心 + 游客模式真实施 — M1.3 / M2 评估                                          |
