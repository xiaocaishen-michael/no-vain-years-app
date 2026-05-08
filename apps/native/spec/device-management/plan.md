# Implementation Plan: Device Management UI

**Spec**: [`./spec.md`](./spec.md) · **Tasks**: [`./tasks.md`](./tasks.md) · **Mockup**: [`./design/mockup-prompt.md`](./design/mockup-prompt.md) / [`./design/handoff.md`](./design/handoff.md) / [`./design/source/project/`](./design/source/project/)
**Phase**: M1.X（账号中心 - 登录管理 UI）
**Created**: 2026-05-08

> 本 plan 在 spec.md（FR-001..FR-018）+ handoff.md（7 段视觉决策）之上落具体实施。视觉段（§ UI 结构）已**完整版**（per ADR-0017 类 2 变体：mockup 已 ship → plan 含完整 UI 段而非占位）。
>
> server 配套 spec 见 [`my-beloved-server/spec/account/device-management/`](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/my-beloved-server/spec/account/device-management/) — 本 plan 假设 server 已 ship 同期或先期。

## 跨包改动总览

```text
no-vain-years-app/
├── apps/native/
│   ├── app/(app)/settings/account-security/
│   │   ├── index.tsx                                — 改（row label 改名 + 启用 + onPress）
│   │   └── login-management/                        — 新建 nested route folder
│   │       ├── _layout.tsx                          — 新建（Stack screen options）
│   │       ├── index.tsx                            — 新建（list page）
│   │       ├── [id].tsx                             — 新建（detail page）
│   │       ├── DeviceIcon.tsx                       — 新建（5 形态 SVG，from mockup）
│   │       └── RemoveDeviceSheet.tsx                — 新建（bottom sheet，from mockup）
│   ├── lib/
│   │   ├── format/datetime.ts                       — 改（加 formatLastActive(iso, granularity)）
│   │   └── hooks/useDevicesQuery.ts                 — 新建（TanStack Query wrapper）
│   └── app/_layout.tsx                              — 改（boot 阶段 hydrate device-store）
│
├── packages/api-client/src/
│   ├── client.ts                                    — 改（加 deviceMiddleware）
│   └── generated/apis/                              — 重生（pnpm api:gen 等 server PR ship 后）
│       └── DeviceManagementControllerApi.ts         — 自动生成
│
└── packages/auth/src/
    ├── device-store.ts                              — 新建（zustand + persist + UUID 生成）
    ├── usecases.ts                                  — 改（加 listDevices / revokeDevice wrapper）
    └── index.ts                                     — 改（re-export 新 API）
```

**不动**：

- `(tabs)/_layout.tsx` — 既有 IconHome / IconUser SVG 风格 baseline，本 spec 仅 mirror 其风格生成 DeviceIcon
- `(auth)/login.tsx` — 既有 phone-sms-auth login flow + freeze modal 不动
- `(app)/settings/account-security/` 其他 disabled rows — 各自独立 spec

## 核心 UI 流（per mockup + spec.md）

### 入口改名 + 启用（既有 page 改）

`apps/native/app/(app)/settings/account-security/index.tsx` 改 1 处 row：

```tsx
// 改前（PHASE 1 占位）
<Card>
  <Row label={COPY.loginDevices} disabled />
</Card>

// 改后（启用 + 改名 per FR-001）
<Card>
  <Row
    label={COPY.loginManagement}  // COPY 改为 '登录管理'
    onPress={() => router.push('/(app)/settings/account-security/login-management')}
  />
</Card>
```

### list page (`login-management/index.tsx`)

来源：`design/source/project/LoginManagementListScreen.tsx` + `DeviceIcon.tsx`（直接 copy + 适配 token import + 适配 expo-router）。

**结构**（自上而下）：

1. Subtitle `已登录的设备 {totalElements}`（pt-md pb-sm，ink-muted text-xs）
2. Card（surface 圆角 + line-soft border + shadow-card）含 N 行：
   - DeviceRow：DeviceIcon 28×28 + (设备名 + CurrentBadge + lastActiveAt · location) + ChevronRight
   - RowDivider（60px 左缩进 = icon 右缘对齐）
3. items.length < totalElements → 末尾 inline `更多设备 >` cta（py-md，ink-muted）

**状态**（per handoff § 3）：

- `loading` — Skeleton bar 占位副标题 + ActivityIndicator + "加载中…"
- `empty`（理论不可达，items=0）— "已登录的设备 0" + 空 card
- `with-current` — 多 row + 第 1 row 带 CurrentBadge
- `paginated-with-cta` — 满 size + 末尾 cta
- `error` — ErrorRow（err-soft 底 + err 文字 + 重试 outline button）

**数据请求**（per spec FR-004）：

```tsx
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['devices', page],
  queryFn: () => listDevices(page, 10),
});
```

`useDevicesQuery(page, size)` 封装在 `apps/native/lib/hooks/useDevicesQuery.ts`。

### detail page (`login-management/[id].tsx`)

来源：`design/source/project/LoginManagementDetailScreen.tsx`。

**数据来源**（per spec FR-003）：从 list TanStack Query cache 取（**不**调 GET /devices/{id}，server 无此 endpoint）：

```tsx
const queryClient = useQueryClient();
const cached = queryClient
  .getQueriesData({ queryKey: ['devices'] })
  .flatMap(([, page]) => (page as DeviceListResult)?.items ?? [])
  .find((it) => String(it.id) === id);

if (!cached) {
  // fallback: refetch page 0 + 重查
  const { data } = useQuery({ queryKey: ['devices', 0], queryFn: () => listDevices(0, 10) });
  // 若 page 0 仍找不到 → 跨 page 不可知 → 显示 NotFoundFallback
}
```

**结构**（per mockup 截图 2）：

1. Card（4 字段同 card 内）：
   - Field "设备名称" / value（ink semibold 大字）
   - RowDivider（16px 左缩进）
   - Field "登录地点" / value（null → "—"）
   - RowDivider
   - Field "登录方式" / value（per LOGIN_METHOD_LABEL 翻译表）
   - RowDivider
   - Field "最近活跃" / value（**精确到秒** YYYY.MM.DD HH:mm:ss，**font-mono**）
2. RemoveButton（bg-err + shadow-cta-err + 全宽 + 48px 高）— **仅 isCurrent === false 时渲染**

**LOGIN_METHOD_LABEL**：

```tsx
const LOGIN_METHOD_LABEL: Record<LoginMethod, string> = {
  PHONE_SMS: '快速登录',
  GOOGLE: 'Google 登录',
  APPLE: 'Apple 登录',
  WECHAT: '微信登录',
};
```

### bottom sheet (`RemoveDeviceSheet.tsx`)

来源：`design/source/project/RemoveDeviceSheet.tsx` 直接 copy（per CL-001 决议：RN 内置 Modal + 顶部 handle bar，零新依赖）。

**结构**（per mockup 截图 3）：

- overlay：`bg-modal-overlay`（既有 token，复用 delete-cancel）+ 底部对齐
- card：`bg-surface` + `rounded-t-lg`（仅顶部 16px 圆角）+ `shadow-sheet`
- handle bar：`bg-line-strong` 4×40 pill 居中 mt-sm
- header row：title 居中 + ✕ 关闭 inline 右上
- body：错误 ErrorRow（条件渲染）+ 描述 + 双 button row

**状态**：

- `default` — 标题 + 描述 + 取消 / 移除
- `submitting` — 移除 button busy（spinner + "移除中…"）+ 取消 disabled opacity 0.5；不可关闭（scrim tap 不触发 cancel）
- `error` — 顶部 ErrorRow（err-soft 底 + alert icon + err 文字）+ 按钮回归默认

**Modal portal**：

```tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
  <View className="flex-1 bg-modal-overlay justify-end">
    <Pressable
      onPress={state === 'submitting' ? undefined : onCancel}
      className="flex-1"
    />
    <SheetBody ... />
  </View>
</Modal>
```

**revoke flow**：

```tsx
const queryClient = useQueryClient();
const onConfirm = async () => {
  setState('submitting');
  try {
    await revokeDevice(record.id);
    queryClient.invalidateQueries({ queryKey: ['devices'] });
    setVisible(false);
    router.back();
  } catch (e) {
    setState('error');
    setErrorMessage(mapDeviceError(e));
  }
};
```

## 数据流

```text
boot (root _layout.tsx)
  │  hydrate from expo-secure-store
  │  - nvy.device_id → deviceStore.deviceId（缺失 → crypto.randomUUID()）
  ▼
api-client deviceMiddleware (注入 X-Device-* headers)
  │  every fetch:
  │  - X-Device-Id: <uuid>
  │  - native: X-Device-Name + X-Device-Type
  │  - web: 仅 X-Device-Id
  ▼
[any token-issuing endpoint] (phoneSmsAuth / refresh-token / cancel-deletion)
  │  server 把 X-Device-* 写入 refresh_token row
  ▼
device-management UI flow:
  │
  GET /api/v1/auth/devices?page=0&size=10
  ▼
useDevicesQuery (TanStack Query key=['devices', page])
  ▼
list page renders → tap row → router.push '/login-management/[id]'
  ▼
detail page reads cache → render 4 fields + RemoveButton (if !isCurrent)
  ▼
tap remove → setSheetVisible(true) → RemoveDeviceSheet
  ▼
tap confirm → revokeDevice(id) → invalidateQueries(['devices']) → router.back
  ▼
list page auto-refetch → 移除的 device 不再显示
```

## device-store 实现要点

**File**: `packages/auth/src/device-store.ts`

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type DeviceType = 'PHONE' | 'TABLET' | 'DESKTOP' | 'WEB' | 'UNKNOWN';

interface DeviceStoreState {
  deviceId: string | null;
  deviceName: string | null;
  deviceType: DeviceType | null;
  hasHydrated: boolean;
  initialize: () => Promise<void>;
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

function resolveDeviceType(): DeviceType {
  if (Platform.OS === 'web') return 'WEB';
  if (Device.deviceType === Device.DeviceType.TABLET) return 'TABLET';
  if (Device.deviceType === Device.DeviceType.PHONE) return 'PHONE';
  if (Device.deviceType === Device.DeviceType.DESKTOP) return 'DESKTOP';
  return 'UNKNOWN';
}

export const useDeviceStore = create<DeviceStoreState>()(
  persist(
    (set, get) => ({
      deviceId: null,
      deviceName: null,
      deviceType: null,
      hasHydrated: false,
      initialize: async () => {
        const current = get();
        if (current.deviceId !== null) return;
        const id = globalThis.crypto?.randomUUID?.() ?? generateUuidV4Fallback();
        set({
          deviceId: id,
          deviceName: Platform.OS === 'web' ? null : (Device.deviceName ?? null),
          deviceType: resolveDeviceType(),
        });
      },
    }),
    {
      name: 'nvy.device_id',
      storage: createJSONStorage(() =>
        Platform.OS === 'web'
          ? {
              getItem: (k) => Promise.resolve(localStorage.getItem(k)),
              setItem: (k, v) => {
                localStorage.setItem(k, v);
                return Promise.resolve();
              },
              removeItem: (k) => {
                localStorage.removeItem(k);
                return Promise.resolve();
              },
            }
          : secureStoreAdapter,
      ),
      onRehydrateStorage: () => (state) =>
        state?.hasHydrated && state ? null : state?.set({ hasHydrated: true }),
    },
  ),
);
```

> **per app CLAUDE.md § token 安全纪律**：device_id 走 secure-store（native）+ localStorage（web，与 access/refresh token 同等保护级别）。

**boot wiring**：root `_layout.tsx` mount 后调 `useDeviceStore.getState().initialize()`，等 hasHydrated === true 才让 api-client 接收第一个请求（避免 X-Device-Id undefined）。

## api-client deviceMiddleware

**File**: `packages/api-client/src/client.ts`（**改**，加 middleware）

```ts
import { Platform } from 'react-native';

const deviceMiddleware: Middleware = {
  async pre(context) {
    const headers = new Headers(context.init.headers);
    const deviceId = deviceGetter();
    if (deviceId !== null) headers.set('X-Device-Id', deviceId);
    if (Platform.OS !== 'web') {
      const deviceName = deviceNameGetter();
      const deviceType = deviceTypeGetter();
      if (deviceName !== null) headers.set('X-Device-Name', deviceName);
      if (deviceType !== null) headers.set('X-Device-Type', deviceType);
    }
    return { url: context.url, init: { ...context.init, headers } };
  },
};

// 加到 cachedConfig.middleware（authMiddleware 之后）
function getConfig(): Configuration {
  if (cachedConfig === null) {
    cachedConfig = new Configuration({
      basePath: getBaseUrl(),
      middleware: [authMiddleware, deviceMiddleware],
    });
  }
  return cachedConfig;
}

// device wiring（registerAuthInterceptor 同样 pattern）
type StringGetter = () => string | null;
let deviceGetter: StringGetter = () => null;
let deviceNameGetter: StringGetter = () => null;
let deviceTypeGetter: StringGetter = () => null;

export function setDeviceGetter(fn: StringGetter): void {
  deviceGetter = fn;
}
export function setDeviceNameGetter(fn: StringGetter): void {
  deviceNameGetter = fn;
}
export function setDeviceTypeGetter(fn: StringGetter): void {
  deviceTypeGetter = fn;
}
```

**packages/auth wiring**：`registerAuthInterceptor()` 中加：

```ts
setDeviceGetter(() => useDeviceStore.getState().deviceId);
setDeviceNameGetter(() => useDeviceStore.getState().deviceName);
setDeviceTypeGetter(() => useDeviceStore.getState().deviceType);
```

## packages/auth wrapper

**File**: `packages/auth/src/usecases.ts`（**改**，加 2 wrapper）

```ts
export interface DeviceItem {
  id: number;
  deviceId: string | null;
  deviceName: string | null;
  deviceType: 'PHONE' | 'TABLET' | 'DESKTOP' | 'WEB' | 'UNKNOWN';
  location: string | null;
  loginMethod: 'PHONE_SMS' | 'GOOGLE' | 'APPLE' | 'WECHAT';
  lastActiveAt: string; // ISO-8601
  isCurrent: boolean;
}

export interface DeviceListResult {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  items: DeviceItem[];
}

export async function listDevices(page: number, size: number): Promise<DeviceListResult> {
  const response = await getDeviceManagementApi().listDevices({ page, size });
  return mapDeviceListResponse(response);
}

export async function revokeDevice(recordId: number): Promise<void> {
  await getDeviceManagementApi().revokeDevice({ recordId });
}
```

**reexport** 在 `packages/auth/src/index.ts`：`listDevices` / `revokeDevice` / `useDeviceStore`。

## 错误码映射（per spec FR-012）

`apps/native/lib/error/device-errors.ts`（**新建**）：

```ts
type DeviceErrorKind =
  | 'session_expired'
  | 'frozen'
  | 'not_found'
  | 'cannot_remove_current'
  | 'rate_limit'
  | 'network'
  | 'unknown';

export function mapDeviceError(e: unknown): DeviceErrorKind {
  // per spec FR-012 mapping table:
  // 401 → session_expired (走 401-refresh 兜底,极少透出 UI)
  // 403 ACCOUNT_IN_FREEZE_PERIOD → frozen
  // 404 DEVICE_NOT_FOUND → not_found
  // 409 CANNOT_REMOVE_CURRENT_DEVICE → cannot_remove_current
  // 429 RATE_LIMITED → rate_limit
  // 5xx / 网络错 → network
  // 其他 → unknown
}

export function deviceErrorCopy(kind: DeviceErrorKind): string {
  switch (kind) {
    case 'session_expired':
      return '会话已失效，请重新登录';
    case 'frozen':
      return '账号已冻结，请联系客服';
    case 'not_found':
      return '该设备不存在或已被移除';
    case 'cannot_remove_current':
      return '当前设备请通过『退出登录』移除';
    case 'rate_limit':
      return '操作太频繁，请稍后再试';
    case 'network':
      return '网络错误，请重试';
    case 'unknown':
      return '发生未知错误';
  }
}
```

## datetime helper

`apps/native/lib/format/datetime.ts`（**改**，加 `formatLastActive`）：

```ts
export type LastActiveGranularity = 'minute' | 'second';

export function formatLastActive(iso: string, granularity: LastActiveGranularity): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  if (granularity === 'minute') return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}:${sec}`;
}
```

## 测试策略

| 层           | 测试类                         | 覆盖                                                                                                                                     |
| ------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Pure unit    | `device-store.test.ts`         | UUID 持久化 / hydrate 重启 / web vs native                                                                                               |
| Pure unit    | `deviceMiddleware.test.ts`     | header 注入 / web 不发 X-Device-Name/Type                                                                                                |
| Pure unit    | `usecases.device.test.ts`      | listDevices / revokeDevice wrapper happy + error                                                                                         |
| Pure unit    | `format/datetime.test.ts` 扩展 | formatLastActive minute / second                                                                                                         |
| Pure unit    | `error/device-errors.test.ts`  | 12 错误映射断言                                                                                                                          |
| Hook unit    | `useDevicesQuery.test.ts`      | TanStack Query mock + invalidate 触发 refetch                                                                                            |
| Component    | —                              | 不强制（per app CLAUDE.md § 五，rich UI 不强制 TDD）                                                                                     |
| Visual smoke | manual screenshots             | 6 状态（list-loading / list-3-with-current / list-paginated / detail-current / detail-other / sheet-active）— PHASE 3 真后端冒烟阶段产出 |

**关键不变量测试**：

- device_id 跨重启稳定（`should_persist_device_id_across_restart`）
- header 在所有 5 token-issuing endpoint 都注入（`should_inject_X-Device-Id_in_phoneSmsAuth`）
- 401 中间件触发 refresh-token 后能重试（既有，本 spec 不动）
- detail page 缓存 miss → fallback page 0 → 仍 miss → NotFoundFallback（FR-003 状态）

## Constitution Check（app 端）

- ✅ **Monorepo pnpm workspace** — 仅改 `apps/native` + `packages/{api-client,auth}`
- ✅ **TypeScript strict + noUncheckedIndexedAccess** — 全部新代码符合
- ✅ **NativeWind className 优先** — 全部走 className，无 inline hex / px
- ✅ **packages/api-client deep-import 禁止** — consumer 走 entry import
- ✅ **packages/_ 不依赖 apps/_** — 单向依赖图保持
- ✅ **token 安全纪律** — device_id 走 secure-store / localStorage（与 refresh-token 同等级）
- ✅ **跨包依赖纪律** — `packages/auth` 依赖 `packages/api-client`（既有）+ 新增 `expo-secure-store` / `expo-device` 仅在 `packages/auth/src/device-store.ts` 引入
- ✅ **OpenAPI 单一真相源** — `pnpm api:gen` 重生客户端，禁止手写

## 反模式（明确避免）

- ❌ detail 页调单独 GET /devices/{id}（server 无此 endpoint，404 浪费请求）— FR-003 强制走 list cache
- ❌ revoke 后 `router.replace('/login-management')` 强制重 mount（破坏滚动位置 + 浪费 RN re-render）— FR-011 用 invalidateQueries 触发 refetch
- ❌ device_id 写 MMKV / AsyncStorage（不安全）— 必须 secure-store / localStorage
- ❌ 每个 wrapper 手填 X-Device-\* header（5+ 处重复 + 漏写风险）— 必须中间件统一注入
- ❌ list / detail 显示 raw IP 地址（隐私 + 攻击面）— per server CL-002 仅显 location
- ❌ 本机条目 detail 显示 disabled 移除按钮（UX 不清晰）— per FR-009 完全隐藏
- ❌ list 显示精确秒级时间（信息密度过高 + UI 噪音）— per FR-005 list 用分钟，detail 用秒
- ❌ sheet 用 @gorhom/bottom-sheet（per CL-001 决议 RN Modal 已够用）

## References

- [`./spec.md`](./spec.md)
- [`./design/handoff.md`](./design/handoff.md) — 7 段视觉决策（含 5 条翻译期 gotcha）
- [`./design/mockup-prompt.md`](./design/mockup-prompt.md) — Claude Design prompt
- [`./design/source/project/`](./design/source/project/) — bundle 原始产出
- [`my-beloved-server/spec/account/device-management/plan.md`](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/my-beloved-server/spec/account/device-management/plan.md) — server 配套 plan
- [`../delete-account-cancel-deletion-ui/plan.md`](../delete-account-cancel-deletion-ui/plan.md) — spec C plan 模板
- [`../account-settings-shell/plan.md`](../account-settings-shell/plan.md) — spec B plan 模板
- [meta CLAUDE.md § API 契约](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/CLAUDE.md#api-契约) — OpenAPI 单一真相源
- [no-vain-years-app CLAUDE.md § 二、目录约定](https://github.com/xiaocaishen-michael/no-vain-years-app/blob/main/CLAUDE.md#二目录约定monorepo-结构)
- [ADR-0017 — 类 2 变体流程](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
