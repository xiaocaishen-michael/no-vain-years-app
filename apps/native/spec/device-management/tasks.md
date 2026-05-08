# Implementation Tasks: Device Management UI

**Spec**: [`./spec.md`](./spec.md) · **Plan**: [`./plan.md`](./plan.md) · **Mockup**: [`./design/handoff.md`](./design/handoff.md)
**Phase**: M1.X（账号中心 - 登录管理 UI）
**Estimated total**: ~10-14h（OpenAPI 重生 + 6 file 翻译 + 2 file 既改 + 4 unit test 类 + visual smoke）

> **TDD 节奏**：业务 hook / utility / wrapper 必须 TDD（per app CLAUDE.md § 五）；UI 组件可不 TDD。任务标签：`[Pkg]` / `[Lib]` / `[Page]` / `[Component]` / `[Wiring]` / `[Smoke]` / `[Contract]`。
>
> **前置依赖**：
>
> 1. server PR `feat(account): impl device-management` 已 ship → schema + 3 endpoint + did claim + ip2region 落地
> 2. spec/plan/tasks docs PR 已 ship
> 3. 本 tasks 在新 impl PR 内执行（分支 `feature/device-management-impl-app`）
>
> **完成标记**：每 task 实施完成在标题紧跟 task 编号后加 `✅`（per meta CLAUDE.md sdd.md § /implement 闭环纪律）。

## Critical Path（按依赖顺序）

### T0 [Contract] OpenAPI 重生客户端

**Files**:

- `packages/api-client/src/generated/apis/DeviceManagementControllerApi.ts`（**新建**，generator 输出）
- `packages/api-client/src/generated/models/DeviceListResponse.ts` / `DeviceItemResponse.ts`（**新建**）

**Logic**:

```bash
pnpm api:gen     # 拉 prod / staging spec
# 或 pnpm api:gen:dev 拉 localhost:8080
```

**Test**: 既有 `pnpm typecheck` 自动校验生成结果可被 import；本 task 不写显式测试。

**Dependencies**: server impl PR 已 ship + production / dev 环境 OpenAPI 含 `GET /api/v1/auth/devices` + `DELETE /api/v1/auth/devices/{recordId}`。

---

### T1 ✅ [Pkg] `packages/auth/src/device-store.ts`

**Files**:

- `packages/auth/src/device-store.ts`（**新建**）
- `packages/auth/src/index.ts`（**改** — re-export `useDeviceStore` / `DeviceType`）
- `packages/auth/package.json`（**可能改** — 加 `expo-device` / `expo-secure-store` runtime dep；若已是 packages/auth 既有依赖则不改）

**Logic**: per `plan.md § device-store 实现要点`。zustand + persist + secure-store/localStorage 双适配。

**Tests**: `packages/auth/src/device-store.test.ts`（**新建**）：

- `should_generate_uuid_v4_on_first_initialize_when_not_persisted()` — UUID v4 pattern + 写 secure-store
- `should_reuse_persisted_uuid_on_second_initialize()` — 二次启动读出同一 UUID
- `should_resolve_deviceType_PHONE_on_native_phone()` / `should_resolve_DESKTOP_on_native_desktop()` / `should_resolve_WEB_on_web()`
- `should_set_deviceName_null_on_web()` — web 不上报 name
- `should_set_hasHydrated_true_after_persist_load()` — onRehydrateStorage callback
- `should_be_idempotent_when_initialize_called_twice()`

**Dependencies**: 无。可与 T0 / T2 并行（T0 独立 contract,不阻塞）。

---

### T2 ✅ [Pkg] `packages/api-client/src/client.ts` 加 `deviceMiddleware`

**Files**:

- `packages/api-client/src/client.ts`（**改** — 加 middleware + setDeviceGetter / setDeviceNameGetter / setDeviceTypeGetter）
- `packages/api-client/src/index.ts`（**改** — re-export 3 setter）

**Logic**: per `plan.md § api-client deviceMiddleware`。

**Tests**: `packages/api-client/src/client.test.ts` 扩展（既有 authMiddleware 测试同 file）：

- `should_inject_X-Device-Id_when_getter_returns_value()`
- `should_omit_X-Device-Id_when_getter_returns_null()`
- `should_inject_X-Device-Name_and_Type_on_native()` — Platform.OS === 'ios' / 'android' branch
- `should_omit_X-Device-Name_on_web()` — Platform.OS === 'web' branch（mock Platform）
- `should_run_after_authMiddleware()` — 中间件顺序断言

**Dependencies**: 无。可与 T0 / T1 并行。

---

### T3 ✅ [Pkg] `packages/auth` wiring — `registerAuthInterceptor` 接入 device getters

**File**: `packages/auth/src/usecases.ts`（**改** — `registerAuthInterceptor()` 函数末尾加 setDeviceGetter 三调用）

**Logic**:

```ts
export function registerAuthInterceptor(): void {
  setTokenGetter(() => useAuthStore.getState().accessToken);
  setTokenRefresher(async () => {
    await refreshTokenFlow();
  });
  // 新增：device wiring
  setDeviceGetter(() => useDeviceStore.getState().deviceId);
  setDeviceNameGetter(() => useDeviceStore.getState().deviceName);
  setDeviceTypeGetter(() => useDeviceStore.getState().deviceType);
}
```

**Tests**: `packages/auth/src/usecases.test.ts` 扩展：

- `should_register_device_getters_alongside_token_getters()` — mock 3 setter，断言被 1 次调用
- `should_propagate_deviceStore_changes_through_getter()` — 改 deviceStore 后 getter 返新值

**Dependencies**: T1 + T2。

---

### T4 [Pkg] `listDevices` + `revokeDevice` wrapper in `packages/auth/src/usecases.ts`

**File**: `packages/auth/src/usecases.ts`（**改** — 加 2 wrapper + DeviceItem / DeviceListResult interface re-export）

**Logic**: per `plan.md § packages/auth wrapper`。

**Tests**: `packages/auth/src/usecases.device.test.ts`（**新建**，与 usecases.test.ts 同 dir）：

- `listDevices`:
  - `should_return_DeviceListResult_on_200()` — happy path mock generator
  - `should_throw_when_api_returns_401()` — 透传错误
  - `should_throw_when_api_returns_429()` — 透传 RATE_LIMITED
  - `should_handle_empty_items()` — totalElements=0
- `revokeDevice`:
  - `should_complete_silently_on_200()`
  - `should_throw_when_api_returns_404_DEVICE_NOT_FOUND()`
  - `should_throw_when_api_returns_409_CANNOT_REMOVE_CURRENT()`
  - `should_throw_when_api_returns_429_RATE_LIMITED()`

**Dependencies**: T0 + T1 + T2 + T3。

---

### T5 ✅ [Lib] `formatLastActive` helper

**File**: `apps/native/lib/format/datetime.ts`（**改**，加 formatLastActive）

**Logic**: per `plan.md § datetime helper`。

**Tests**: `apps/native/lib/format/datetime.test.ts`（**新建** 或既有扩展）：

- `should_format_minute_granularity_for_list()` — `'2026.05.07 17:23'`
- `should_format_second_granularity_for_detail()` — `'2026.05.07 17:23:48'`
- `should_pad_zero_for_single_digit_month_day_hour_minute_second()`
- `should_handle_iso_with_timezone_offset()` — `'2026-05-07T17:23:48+08:00'` 转本地时区

**Dependencies**: 无。可与 T0-T4 并行。

---

### T6 ✅ [Lib] `mapDeviceError` + `deviceErrorCopy`

**File**: `apps/native/lib/error/device-errors.ts`（**新建**）

**Logic**: per `plan.md § 错误码映射`。

**Tests**: `apps/native/lib/error/device-errors.test.ts`（**新建**）：

- 7 错误 kind × 各自 copy 字符串断言
- 12 错误码映射断言（401 / 403 / 404 / 409 / 429 / 5xx / 网络错 / 未知）
- ResponseError vs ApiClientError 双 wrapper 类型识别

**Dependencies**: T4（依赖错误类型 ResponseError / ApiClientError 既有 export）。

---

### T7 [Lib] `useDevicesQuery` hook

**File**: `apps/native/lib/hooks/useDevicesQuery.ts`（**新建**）

**Logic**:

```ts
import { useQuery } from '@tanstack/react-query';
import { listDevices, type DeviceListResult } from '@nvy/auth';

export function useDevicesQuery(page: number, size: number) {
  return useQuery<DeviceListResult>({
    queryKey: ['devices', page],
    queryFn: () => listDevices(page, size),
    staleTime: 30_000,
    retry: 1,
  });
}
```

**Tests**: `apps/native/lib/hooks/useDevicesQuery.test.ts`（**新建**）：

- `should_call_listDevices_with_correct_args()` — mock @nvy/auth listDevices
- `should_use_query_key_devices_page()`
- `should_have_staleTime_30s()`
- `should_retry_once_on_failure()`

**Dependencies**: T4。

---

### T8 [Wiring] root `_layout.tsx` boot device-store hydrate

**File**: `apps/native/app/_layout.tsx`（**改** — 加 useDeviceStore.initialize 调用 + 等 hasHydrated）

**Logic**:

```tsx
import { registerAuthInterceptor, useAuthStore, useDeviceStore } from '@nvy/auth';

registerAuthInterceptor(); // 既有 — 现在内部也含 device getters

function AuthGate({ children }: { children: React.ReactNode }) {
  // ... 既有 navReady / hasHydrated（auth）
  const deviceHydrated = useDeviceStore((s) => s.hasHydrated);
  const deviceId = useDeviceStore((s) => s.deviceId);

  useEffect(() => {
    void useDeviceStore.getState().initialize();
  }, []);

  // 等待 device-store hydrate 才让请求过 deviceMiddleware
  if (!hasHydrated || !deviceHydrated) return <SplashPlaceholder />;

  // ... 既有 navigation logic
}
```

**Tests**: `apps/native/app/__tests__/AuthGate.deviceHydrate.test.tsx`（**新建** 或既有 AuthGate test 扩展）：

- `should_show_splash_until_device_hydrated()`
- `should_call_initialize_once_on_mount()`
- `should_set_deviceId_on_first_boot()` — secureStore 空 + initialize → uuid 写入

**Dependencies**: T1 + T3。

---

### T9 ✅ [Component] `DeviceIcon.tsx` copy from mockup

**File**: `apps/native/app/(app)/settings/account-security/login-management/DeviceIcon.tsx`（**新建**）

**Logic**: 直接 copy `design/source/project/DeviceIcon.tsx`；无改动；token 复用 `ink-muted` 字面量 `#666666`（svg stroke prop 不接 className）。

**Tests**: 无（pure SVG icon set，per app CLAUDE.md § 五 UI 组件不强制 TDD）。

**Dependencies**: 无。可与 T0-T8 并行。

---

### T10 ✅ [Page] `login-management/_layout.tsx`

**File**: `apps/native/app/(app)/settings/account-security/login-management/_layout.tsx`（**新建**）

**Logic**:

```tsx
import { Stack } from 'expo-router';

export default function LoginManagementLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: '登录管理' }} />
      <Stack.Screen name="[id]" options={{ title: '登录设备详情' }} />
    </Stack>
  );
}
```

**Tests**: 无（layout 配置）。

**Dependencies**: 无。

---

### T11 [Page] `login-management/index.tsx` (list page)

**File**: `apps/native/app/(app)/settings/account-security/login-management/index.tsx`（**新建**）

**Logic**: 翻译自 `design/source/project/LoginManagementListScreen.tsx`：

- token 解 className 直接走 `tailwind.config.ts`（既有项目 config 已含 brand-soft / line-soft / shadow-card 等）
- 加新 `boxShadow.cta-err` + `boxShadow.sheet` 到 `apps/native/tailwind.config.ts`（per handoff § 4 token 决策）
- 数据走 `useDevicesQuery(page, 10)` hook + 分页 state
- tap row → `router.push(\`/(app)/settings/account-security/login-management/\${item.id}\`)`
- tap 「更多设备 >」→ setPage(p+1) + 合并 items（自维护 accumulator state）
- 错误态 ErrorRow + `refetch()` cta

**Tests**: 无（per app CLAUDE.md § 五 page 不强制 TDD；T15 visual smoke 兜底）。

**Dependencies**: T7 + T9。

---

### T12 [Page] `login-management/[id].tsx` (detail page)

**File**: `apps/native/app/(app)/settings/account-security/login-management/[id].tsx`（**新建**）

**Logic**: 翻译自 `design/source/project/LoginManagementDetailScreen.tsx`：

- 数据从 `queryClient.getQueriesData({ queryKey: ['devices'] })` 取所有 page 合并 + 按 id 找
- cache miss → `useQuery({ queryKey: ['devices', 0], ... })` fallback + 重试找
- 仍 miss → 显示 NotFoundFallback（"该设备不存在或已被移除" + 返回 cta）
- `formatLastActive(item.lastActiveAt, 'second')` 用于「最近活跃」字段（精确到秒，font-mono）
- isCurrent === true → 不渲染 RemoveButton；isCurrent === false → RemoveButton（tap 后 setSheetVisible(true)）
- `LOGIN_METHOD_LABEL` 翻译表（per CL-003）

**Tests**: 无（同 T11 理由）。

**Dependencies**: T5 + T7 + T11（需先有 list cache 才能 detail 读）。

---

### T13 [Component] `RemoveDeviceSheet.tsx`

**File**: `apps/native/app/(app)/settings/account-security/login-management/RemoveDeviceSheet.tsx`（**新建**）

**Logic**: 翻译自 `design/source/project/RemoveDeviceSheet.tsx`：

- RN 内置 Modal（per CL-001 决议）+ overlay scrim（modal-overlay token）+ handle bar
- 3 状态：default / submitting / error
- onConfirm = revokeDevice(id) + invalidateQueries(['devices']) + onCancel + router.back
- 错误 → setState('error') + setErrorMessage(deviceErrorCopy(mapDeviceError(e)))

**Tests**: `RemoveDeviceSheet.test.tsx`（可选，UI 测试不强制；若做则）：

- `should_render_default_state()`
- `should_render_submitting_state_when_state_prop_set()`
- `should_render_error_state_with_error_message()`
- `should_call_onConfirm_when_remove_button_pressed()`
- `should_disable_cancel_when_submitting()`

**Dependencies**: T4 + T6。

---

### T14 [Wiring] `account-security/index.tsx` row 改名 + 启用

**File**: `apps/native/app/(app)/settings/account-security/index.tsx`（**改**）

**Logic**: per `plan.md § 入口改名 + 启用`。

```tsx
// COPY 改 1 字段
const COPY = {
  // ...
  loginManagement: '登录管理', // 改自 loginDevices: '登录设备与授权管理'
  // ...
};

// row 改 1 处
<Card>
  <Row
    label={COPY.loginManagement}
    onPress={() => router.push('/(app)/settings/account-security/login-management')}
  />
</Card>;
```

**Tests**: 既有 `account-security/__tests__/` 若有 row label 断言 → 同步改测试期望（grep `登录设备与授权管理` 全仓改）。

**Dependencies**: T11（route 必须先建好才不会跳 404）。

---

### T15 [Smoke] visual smoke 6 状态截图

**Files**:

- `apps/native/runtime-debug/2026-MM-DD-device-management-mockup-translation/`（**新建** 目录，per spec C T16-smoke 同款）
  - `01-list-loading.png`
  - `02-list-3-with-current.png`
  - `03-list-paginated-10-of-12-with-cta.png`
  - `04-detail-current-no-remove.png`
  - `05-detail-other-with-remove.png`
  - `06-sheet-active-default.png`

**Logic**: 真后端 prod 环境冒烟（per app CLAUDE.md § 五 + spec C T11 prod release-verify pattern）：

- prod DB 预设账号 `+8613100000007 测试用户`（既有，per memory `last-session-notes` 5-7 上传）+ 至少 3 个 device session（手动登录 web / iOS simulator / Android）
- 登录后 → 设置 → 账号与安全 → 登录管理 → 截图 list
- tap 单条 → 截图 detail（含本机 + 非本机 各一张）
- 非本机 detail tap 移除 → 截图 sheet
- 移除 → 验 list refetch 不显示该 device

**Tests**: `apps/native/spec/device-management/runtime-debug-screenshots.md`（**新建**），含截图链接 + 验证 checklist。

**Dependencies**: T11 + T12 + T13 + T14 + server impl 已 prod ship。

---

### T16 ✅ [Wiring] tailwind.config.ts 加 2 新 boxShadow

**File**: `apps/native/tailwind.config.ts`（**改**，加 `boxShadow.cta-err` + `boxShadow.sheet`）

**Logic**: per handoff § 4 token 决策 + design/source/project/tailwind.config.js 同款：

```ts
boxShadow: {
  // 既有...
  card: '0 1px 2px 0 rgba(17,24,39,.05), 0 1px 3px 0 rgba(17,24,39,.04)',
  cta: '0 4px 12px -2px rgba(36,86,229,0.25)',
  // 新增（per device-management spec）
  'cta-err': '0 4px 12px -2px rgba(239,68,68,0.28)',
  sheet: '0 -4px 24px -6px rgba(17,24,39,0.18)',
}
```

**Tests**: 无（config）。T11 / T12 / T13 类名引用即间接验证。

**Dependencies**: 无。可与 T0-T15 并行；建议 T11 / T12 / T13 翻译前先做以避免类名缺失警告。

---

## Parallel Opportunities

- **T0 / T1 / T2 / T5 / T6 / T9 / T10 / T16 同起**（无相互依赖）
- **T3 在 T1 + T2 完成后**
- **T4 在 T0 + T1 + T2 + T3 完成后**
- **T7 在 T4 完成后**
- **T8 在 T1 + T3 完成后**
- **T11 在 T7 + T9 + T16 完成后**
- **T12 在 T5 + T7 + T11 完成后**
- **T13 在 T4 + T6 完成后**
- **T14 在 T11 完成后**
- **T15 在 T11-T14 + server prod ship 完成后**（最后做）

## Definition of Done

- ✅ 16 任务的代码 + 测试 GREEN（T9 / T10 / T11 / T12 / T15 / T16 无显式测试，依靠 typecheck + visual smoke）
- ✅ `pnpm typecheck` + `pnpm lint` + `pnpm test` 全绿（regression 0）
- ✅ `pnpm api:gen` 后 `DeviceManagementControllerApi` 新方法可调
- ✅ device_id 跨重启稳定（T1 测试 GREEN）
- ✅ X-Device-Id header 在 5 既有 token-issuing 路径都注入（既有 fetch IT 不退化 + T2 测试）
- ✅ list page 6 状态视觉冒烟（T15）
- ✅ revoke 非本机后 list 自动 refetch（T13 + T15）
- ✅ 本机 detail 隐藏移除按钮（T12 + T15）
- ✅ tasks.md 全部加 ✅ 标（per /implement 闭环）

## Phasing PR 拆分

按 SDD § 双阶段切分：

- **PR 前序（已 ship）**: spec / mockup-prompt / mockup bundle + handoff
- **PR 1（本 plan/tasks docs PR）**: `docs(account): device-management UI plan + tasks`
- **PR 2（impl，本 spec 范围外）**: `feat(account): impl device-management UI (M1.X / T0-T16)`
  - 前置：plan/tasks docs PR 已 merge + server impl PR 已 ship + prod 已部署 + OpenAPI 重生客户端
- **PR 3（visual smoke 真后端冒烟）**: `test(account): device-management UI prod release-verify smoke`
  - 同 spec C T11 pattern；可合并到 PR 2 或单独
