# Device Management UI Mockup Handoff

> Bundle 来源：Claude Design (claude.ai/design)，2026-05-08 PM 拿到
> Mockup prompt：[`mockup-prompt.md`](./mockup-prompt.md)（PR [#87](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/87) docs 段已 ship）
> 翻译期 PR：本 PR（`feature/device-management-mockup-bundle`）— 仅 docs（bundle 归档 + handoff），impl 翻译走后续 PHASE 3 PR 链
> SDD 链：A（my-profile #68/#70/#71）→ B（account-settings-shell #73/#75）→ C（delete-account-cancel-deletion-ui #76-#82）→ **device-management（本 spec，PHASE 2 mockup 翻译期）**
> server 配套：[my-beloved-server PR #150](https://github.com/xiaocaishen-michael/my-beloved-server/pull/150) spec 已 ship；schema migration + 3 endpoint 待后续 impl session

## 1. Bundle 内容速览

| 文件                                                                                                 | 体积       | 作用                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [`source/project/Login Management Preview.html`](./source/project/Login%20Management%20Preview.html) | ~30 KB     | **主预览** — 单 HTML 自带 React 18 + Babel standalone + nvyParseClasses className-to-style mapper；6 状态横排预览 + IOSFrame 容器 |
| [`source/project/LoginManagementListScreen.tsx`](./source/project/LoginManagementListScreen.tsx)     | 6.5 KB     | list page 主组件（含 12 条 fixture + 5 状态变体）                                                                                 |
| [`source/project/LoginManagementDetailScreen.tsx`](./source/project/LoginManagementDetailScreen.tsx) | 3.6 KB     | detail page 主组件（2 状态：current-no-remove / other-with-remove）                                                               |
| [`source/project/RemoveDeviceSheet.tsx`](./source/project/RemoveDeviceSheet.tsx)                     | 4.5 KB     | bottom sheet 组件（3 状态：default / submitting / error，RN Modal portal + inline preview 二选一）                                |
| [`source/project/DeviceIcon.tsx`](./source/project/DeviceIcon.tsx)                                   | 1.6 KB     | 5 形态 SVG icon set（PHONE / TABLET / DESKTOP / WEB / UNKNOWN）                                                                   |
| [`source/project/LoginManagementPreview.tsx`](./source/project/LoginManagementPreview.tsx)           | （主入口） | 6 状态横排预览容器                                                                                                                |
| [`source/project/tailwind.config.js`](./source/project/tailwind.config.js)                           | 2.6 KB     | Token 定义 — **零新基础 token** + 2 新 boxShadow（`cta-err` / `sheet`）                                                           |
| [`source/project/IOSFrame.tsx`](./source/project/IOSFrame.tsx)                                       | 2.0 KB     | iPhone 设备外框（design-time 专用，不进 implementation）                                                                          |
| [`source/project/preview/`](./source/project/preview/)                                               | shim       | Claude Design sandbox shim，不进 implementation                                                                                   |
| [`source/project/uploads/`](./source/project/uploads/)                                               | —          | prompt 输入参考截图（若有），不是产物                                                                                             |
| [`source/README.md`](./source/README.md)                                                             | 1.6 KB     | Claude Design 通用 boilerplate                                                                                                    |

**丢弃的 bundle 内容**（原 export 含但不入本 spec implementation）：

- `LoginScreen.tsx` / `LoginScreenPreview.tsx` / `Login Preview.html` — login v2 已 ship（PR #51）；本 spec 不动 login
- `OnboardingScreen.tsx` / `OnboardingScreenPreview.tsx` / `Onboarding Preview.html` — onboarding PHASE 2 已 ship（PR #66）
- `ProfileScreen.tsx` / `ProfileScreenPreview.tsx` / `Profile Preview.html` / `PhoneScreen.tsx` — my-profile PHASE 2 已 ship（PR #70）
- `SettingsScreen.tsx` / `SettingsShellPreview.tsx` / `Settings Preview.html` / `AccountSecurityScreen.tsx` / `LegalScreen.tsx` — account-settings-shell PHASE 2 已 ship（PR #75）
- `DeleteCancel Preview.html` — delete-cancel mockup 输出（PR #79 已翻译 ship）

> 同 conversation 多 spec 输出捆在一起属 Claude Design 已知行为（my-profile / account-settings-shell / delete-cancel handoff § 1 同款）。本 spec 落 source/ 时**保留全 bundle**作 design-time 视觉对照 + token consistency 检查参考；翻译期仅消费本 spec 4 个核心 .tsx + tailwind.config.js + Preview.tsx。

### Deliverable 命名一致性（prompt vs 实际）

mockup-prompt.md 列了 7 个 deliverable，Claude Design **完全按 prompt 产出**（vs delete-cancel 的单 HTML inline 全部 components 模式有差异 — 本 bundle 走拆分 .tsx 风格，translation 期工作量更小）：

| Prompt 列出                       | 实际产出                             | 状态                 |
| --------------------------------- | ------------------------------------ | -------------------- |
| `LoginManagementListScreen.tsx`   | ✅ `LoginManagementListScreen.tsx`   | 命中                 |
| `LoginManagementDetailScreen.tsx` | ✅ `LoginManagementDetailScreen.tsx` | 命中                 |
| `RemoveDeviceSheet.tsx`           | ✅ `RemoveDeviceSheet.tsx`           | 命中                 |
| `DeviceIcon.tsx`                  | ✅ `DeviceIcon.tsx`                  | 命中                 |
| `LoginManagementPreview.tsx`      | ✅ `LoginManagementPreview.tsx`      | 命中                 |
| `IOSFrame.tsx`                    | ✅ `IOSFrame.tsx`                    | 命中（沿用既有同款） |
| `tailwind.config.js`              | ✅ `tailwind.config.js`              | 命中                 |

## 2. 组件 breakdown（T13/T14/T15 决策）

mockup 产出 4 个核心 .tsx + 1 个 fixture/preview 容器，跨 list / detail / sheet 3 个视觉单元。

| Mockup 组件                                | 翻译处理                                                                                                               | 理由                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoginManagementListScreen` 主体           | **inline 在 `app/(app)/settings/account-security/login-management/index.tsx`**                                         | spec page 单 file 入口；mockup 内 `Subtitle` / `Card` / `RowDivider` 等小组件全 inline 在同 file（不抽 component file）                                                                                                                                                                                                               |
| `DeviceRow`（mockup inline）               | **inline 在 `index.tsx`**                                                                                              | 仅 list 单页消费；hairline divider + 60px 左缩进 ≠ 复用 packages/ui 既有 row primitives（spec B 的 `Row` 组件不带 device icon + 副标行 + 本机徽标语义）                                                                                                                                                                               |
| `CurrentBadge`                             | **inline 在 `index.tsx`**                                                                                              | 仅 list 单页消费；brand-soft + brand-600 token 直接用                                                                                                                                                                                                                                                                                 |
| `MoreCta`（更多设备 >）                    | **inline 在 `index.tsx`**                                                                                              | 仅 list 单页；inline Pressable + Text + ChevronRight 即可                                                                                                                                                                                                                                                                             |
| `ChevronRight` SVG                         | **inline svg in 同 file**                                                                                              | mirror 既有 `(tabs)/_layout.tsx` IconHome 风格，inline path                                                                                                                                                                                                                                                                           |
| `ErrorRow`（list / sheet 各自版本）        | **list inline / sheet inline**                                                                                         | 两版本 tone 一致（err-soft 底卡 + err 文字），但 sheet 版加 alert icon + 紧凑 padding；翻译期两页各 inline，**不抽 packages/ui**（与 delete-cancel handoff § 2 同款决议）                                                                                                                                                             |
| `LoginManagementDetailScreen` 主体         | **inline 在 `app/(app)/settings/account-security/login-management/[id].tsx`**                                          | spec page 单 file 入口；`Field` / `RowDivider` / `Card` 全 inline 同 file                                                                                                                                                                                                                                                             |
| `Field`（label-value 上下结构）            | **inline 在 `[id].tsx`**                                                                                               | 仅 detail 单页消费；不与 spec B `Row` 重叠（B 是 horizontal label + chevron 风格）                                                                                                                                                                                                                                                    |
| `RemoveButton`（destructive primary）      | **inline 在 `[id].tsx`**                                                                                               | 仅 detail 单页；err fill + shadow-cta-err token 直接用；sheet 版的「移除」button 视觉 ≈ 此 button 但放在 sheet flex-row 内，不抽通用                                                                                                                                                                                                  |
| `RemoveDeviceSheet` 主体                   | **新文件 `app/(app)/settings/account-security/login-management/_sheet/RemoveDeviceSheet.tsx`** 或 inline 在 `[id].tsx` | mockup 产出独立 .tsx；sheet 是 RN Modal portal 形态（per § 4 决议），可作为 detail page 的子组件 inline 或单 file 抽出 — **倾向新文件单 file**（sheet 含 `SheetBody` / `IconClose` / `ErrorRow` 内部 3 子组件，inline 会让 `[id].tsx` 体积膨胀；类比 spec B Card / Divider / Row primitives 拆 `components/settings/primitives.tsx`） |
| `IconClose` SVG                            | **inline svg in `RemoveDeviceSheet.tsx`**                                                                              | 仅 sheet 单处消费；标准 Feather x path                                                                                                                                                                                                                                                                                                |
| `SheetBody`                                | **inline 在 `RemoveDeviceSheet.tsx`**                                                                                  | 单 file 内拆 sheet portal vs body 两层（与 mockup 拆法一致）                                                                                                                                                                                                                                                                          |
| `DeviceIcon`（5 形态 SVG）                 | **新文件 `app/(app)/settings/account-security/login-management/DeviceIcon.tsx`**                                       | 仅 list page 消费（detail page 不显图标，per mockup detail 设计）；放在同 nested route folder 内本地化                                                                                                                                                                                                                                |
| `LoginManagementPreview.tsx`（6 状态横排） | **删除（不进 implementation）**                                                                                        | mockup design-time 专用；production runtime 走真后端数据                                                                                                                                                                                                                                                                              |
| `IOSFrame.tsx`                             | **删除（不进 implementation）**                                                                                        | design-time 专用                                                                                                                                                                                                                                                                                                                      |
| `Login Management Preview.html`            | **删除（不进 implementation）**                                                                                        | design-time 专用                                                                                                                                                                                                                                                                                                                      |

### packages/ui 抽取决策

**结论：0 抽 packages/ui，全部 inline 在对应 page / 同 nested route folder 内**（沿用 my-profile / account-settings-shell / delete-cancel 同款决议）。

| 评估维度         | 结论                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本 spec 内复用度 | DeviceIcon 1×（list 唯一）/ ChevronRight 2×（list row + more cta）/ ErrorRow 2×（list / sheet）/ Field 1×（detail 唯一）/ Card / Divider / RowDivider 各页内多次复用但 page-local |
| 跨 spec 复用度   | DeviceIcon 仅 device-management 消费（其他 spec 无设备图标语义）；CurrentBadge 仅 device-management 消费；其余 primitives 与 spec B/C 既有 inline 实现重叠                        |
| 已 ship 同款先例 | spec B / C / my-profile 均 0 抽 packages/ui，page-local inline 是项目惯例                                                                                                         |
| 抽包代价         | 包结构 / TypeScript types export / 测试结构成本 vs 1× 跨 spec 复用收益不成正比                                                                                                    |

**翻译期组件文件结构**（建议）：

```text
apps/native/app/(app)/settings/account-security/login-management/
├── _layout.tsx                  ← Stack screen options（标题 / Stack 配置）
├── index.tsx                    ← list page（单 file 含全部 inline primitives）
├── [id].tsx                     ← detail page（单 file 含全部 inline primitives）
├── DeviceIcon.tsx               ← 5 形态 SVG icon set（被 index.tsx import）
└── RemoveDeviceSheet.tsx        ← bottom sheet（被 [id].tsx import + 控制 visible）
```

> 与 spec B 路径 (account-settings-shell) `components/settings/primitives.tsx` 形成**对照**：B 是 settings 全局共享 primitives，本 spec 是单 nested route 局部 components → 不抽到 `components/`，落 nested route folder 内本地化。

## 3. 状态机覆盖（mockup 状态 ↔ spec FR/SC 对齐）

mockup 6 状态对应 spec FR / SC：

| Mockup 状态                        | spec FR / SC 对应                                                                        | 备注                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `list-loading`                     | spec.md FR-004（mount 时 useDevicesQuery loading 态）/ SC-001（首屏 P95 ≤ 800ms）        | Skeleton bar 占位副标题 + ActivityIndicator + "加载中…" 文案                 |
| `list-3-with-current`              | spec.md FR-005（list 渲染 + 本机徽标）/ SC-003（本机识别正确性）                         | 3 row + 第 1 row CurrentBadge；测 fixture data 含 `isCurrent: true` 仅 1 条  |
| `list-paginated-10-of-12-with-cta` | spec.md FR-006（分页 cta）/ SC-006（分页 manual smoke）                                  | 10 row + 末尾「更多设备 >」                                                  |
| `list-paginated-12-of-12`          | spec.md FR-006（cta hide 条件 = items.length >= totalElements）                          | 12 row + cta 隐藏                                                            |
| `list-error`                       | spec.md FR-007（错误态 + 重试）/ SC-007（错误态 manual smoke）                           | ErrorRow（err-soft 底 + err 文字）+ 重试 outline button                      |
| `detail-current-no-remove`         | spec.md FR-008（4 字段渲染）+ FR-009（本机隐藏移除按钮）/ SC-005（拒移除本机 client UI） | 4 field card + 无 RemoveButton                                               |
| `detail-other-with-remove`         | spec.md FR-008 + FR-009（非本机显示移除）/ SC-004（移除非本机 manual smoke）             | 4 field card + 底部 destructive RemoveButton                                 |
| `sheet-default`                    | spec.md FR-010 + FR-011（移除流程 + 确认 sheet）                                         | Sheet handle + 标题 + 描述 + 取消/移除                                       |
| `sheet-submitting`                 | spec.md FR-011（loading 期间 button busy + sheet 不可关闭）                              | 移除 button spinner + "移除中…"；取消 disabled opacity 0.5；scrim tap 不关闭 |
| `sheet-error`                      | spec.md FR-011 + FR-012（错误码映射）                                                    | 顶 ErrorRow + 按钮回归默认                                                   |

**mockup 未覆盖的 spec 状态**（翻译期 / 后续 visual smoke 补）：

| 状态                                                 | spec FR                           | 备注                                                                                                                              |
| ---------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `list-empty`（理论不可达，items=0）                  | spec.md Edge Cases                | mockup 未画；翻译期可加 fallback "已登录的设备 0" + 空 card；real 场景仅 access token 失效后才会走到（被 401 拦截先于此态出现）   |
| `list-1-self-only`（仅本机 1 条）                    | spec.md User Story 1 acceptance 3 | mockup 未画专属态；翻译期 1 row + CurrentBadge 即可，不需特殊处理                                                                 |
| `detail-revoked`（被其他端 revoke 后本端仍打开此页） | spec.md FR-007                    | mockup 未画；TanStack Query stale 后 refetch 自动消失，detail 页 fallback 错误 "该设备不存在或已被移除"（per FR-012 404 mapping） |

## 4. Token 决策记录

mockup `tailwind.config.js` 顶部注释总结：**device-management spec adds NOTHING** — 所有视觉决策**完全复用**既有 token 系统（login v2 base + my-profile 4 alpha + delete-cancel modal-overlay）。

### 复用 token 清单

| 视觉单元                    | Token                                                            | 出处                                                                                                |
| --------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 「本机」徽标 bg             | `bg-brand-soft` (#E8EEFD)                                        | login v2 base — semantic identity 蓝灰，**避免与 destructive err 红混淆**                           |
| 「本机」徽标 text           | `text-brand-600` (#1D47C2)                                       | login v2 base — 强对比深蓝                                                                          |
| destructive 移除按钮 fill   | `bg-err` (#EF4444)                                               | login v2 base — 与 delete-cancel "确认注销" 协调                                                    |
| destructive button text     | `text-surface` (#FFFFFF)                                         | login v2 base                                                                                       |
| sheet overlay scrim         | `bg-modal-overlay` (rgba(15,18,28,0.48))                         | **delete-cancel PHASE 2 引入** — 复用                                                               |
| sheet handle bar            | `bg-line-strong` (#D1D5DB)                                       | login v2 base — 4×40 pill 居中                                                                      |
| device icon stroke          | `#666666` (= ink-muted)                                          | inline color literal in DeviceIcon.tsx，未走 className（svg stroke prop 不接 NativeWind className） |
| list card                   | `bg-surface` + `border-line-soft` + `rounded-md` + `shadow-card` | account-settings-shell PHASE 2 baseline                                                             |
| ErrorRow（list / sheet）    | `bg-err-soft` + `text-err` + `rounded-md`                        | login v2 / delete-cancel baseline                                                                   |
| Sub-title「已登录的设备 N」 | `text-xs text-ink-muted`                                         | inline mute 文字                                                                                    |
| 「更多设备 >」cta           | `text-sm text-ink-muted` + ChevronRight #666666                  | inline 链接形态                                                                                     |

### 新增 token（仅 boxShadow，2 个）

| Token               | 值                                     | 用途                                                                                                    |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `boxShadow.cta-err` | `0 4px 12px -2px rgba(239,68,68,0.28)` | err-fill primary CTA halo（detail 页移除按钮 + sheet 内移除按钮）；mirror `boxShadow.cta` 但 err-tinted |
| `boxShadow.sheet`   | `0 -4px 24px -6px rgba(17,24,39,0.18)` | bottom-sheet card 抬升阴影（逆向投光，自下方）;**之前 spec 未定义,本 spec 引入**                        |

> **零新基础 token**（无新 color / spacing / radius / fontFamily / 等），仅 2 个 boxShadow extension。device-management 在视觉 token 维度是项目内**最克制**的 spec — 所有色彩 / 间距 / 字号决策都落在既有系统内。

### 不消费的 token

mockup-prompt.md 列出"预期可能新增"3 个 token（`current-badge-bg` / `sheet-handle` / `device-icon-stroke`），mockup 实际产出**不引入这 3 个独立 token** — Claude Design 直接复用既有 `brand-soft` / `line-strong` / `ink-muted` 命中 prompt 给的 fallback 路径。

| 可选 token           | mockup 决策                                             |
| -------------------- | ------------------------------------------------------- |
| `current-badge-bg`   | ❌ 不引；用 `brand-soft`                                |
| `current-badge-text` | ❌ 不引；用 `brand-600`                                 |
| `sheet-handle`       | ❌ 不引；用 `line-strong`                               |
| `device-icon-stroke` | ❌ 不引；用 `#666666` 字面量（svg prop 不接 className） |

## 5. 翻译期注意点（5 条 gotcha audit）

### Gotcha 1 — detail 页**不**调单独 GET endpoint，必须从 list TanStack Query cache 取

**spec FR-003** 明确 detail 页数据来源 = list TanStack Query cache（key=`['devices', page]`），server **没有** GET /devices/{id} endpoint。

翻译期 `[id].tsx` 实现：

```tsx
const { data: pageData } = useDevicesQuery({ page: 0, size: 10 }); // 信 cache
const detail = pageData?.items.find((it) => it.id === id);
if (!detail) return <NotFoundFallback />; // FR-012 404 文案
```

**反模式**：`useQuery(['device', id], () => getDevice(id))` — server 端无此 endpoint，会 404 + 浪费请求。

### Gotcha 2 — sheet 内移除调用必须 invalidate `['devices']` query 触发 list 自动 refetch

**spec FR-011** 描述 "成功 → 关 sheet + router.back + invalidate `['devices']` query"。

翻译期实现：

```tsx
const queryClient = useQueryClient();
const onConfirm = async () => {
  await revokeDevice(id);
  queryClient.invalidateQueries({ queryKey: ['devices'] });
  setSheetVisible(false);
  router.back();
};
```

**反模式**：`router.replace('/login-management')` — 强制重新 mount 整个 list，丢失分页位置 + 浪费 RN re-render。invalidate 让 TanStack Query 自动 refetch，list 滚动位置保留。

### Gotcha 3 — JWT did claim 升级 = 客户端老 access token 立即 401

**spec FR-006**：access token 缺 `did` claim → 任何 device-management endpoint 直接 401。

翻译期 / 上线期影响：

- **客户端升级到本版本前** 的 access token（无 did claim）→ 调 GET /devices 立即 401 → 既有 401-refresh 中间件触发 refresh-token → server 端 refresh-token 路径**也升级了** signAccess 入参带 deviceId → 新 access token 含 did claim → 重试成功
- 但这要求 client 持有的 refresh_token 也得是 V11 schema 之后写入的（含 device_id 列）— V11 之前的老 row device_id = NULL → server fallback gen UUID v4 落库 → 新 access token did = 此 UUID
- **过渡期 1 次重 login 不可避免**：若 client 本地仅持有 access token（refresh_token 已过期或丢）→ 401 + refresh 失败 → 强制 logout + 跳 /(auth)/login

**实施期**注意：先 ship server schema migration + JwtTokenIssuer signAccess 重构（`feature/device-management` server PR）→ 再 ship client（OpenAPI 重生 + device-management UI）→ 中间窗口 server 端**容许**老 client 调老 endpoint（FR-016 现有 endpoint schema 不变），仅 device-management endpoint 强制 did claim。

### Gotcha 4 — list `lastActiveAt` 显示分钟级 ≠ detail 页秒级

**mockup 设计**：list `'2026.05.07 17:23'`（分钟）/ detail `'2026.05.07 17:23:48'`（精确到秒）。spec 默许 server 用 `created_at` 作 last_used_at（精度 ≤ 15 min access token TTL）。

翻译期实现：

```tsx
// list row
const time = formatLastActive(item.lastActiveAt, 'minute'); // YYYY.MM.DD HH:mm
// detail
const time = formatLastActive(detail.lastActiveAt, 'second'); // YYYY.MM.DD HH:mm:ss
```

**反模式**：list 也精确到秒 → 信息密度过高 + UI 噪音；detail 用分钟 → 失去层级差异。

格式化工具：扩 `apps/native/lib/format/datetime.ts`（既有，per onboarding / settings）加 `formatLastActive(iso, granularity)`。

### Gotcha 5 — device header 上报中间件**写在 packages/api-client**，不在每个 wrapper 手填

**spec FR-013/14** 要求所有签 token 路径（phoneSmsAuth / refreshTokenFlow / cancelDeletion 等 5+ endpoint）注入 `X-Device-Id` / `X-Device-Name` / `X-Device-Type` header。

翻译期实现：

```ts
// packages/api-client/src/client.ts
const deviceMiddleware: Middleware = {
  async pre(context) {
    const headers = new Headers(context.init.headers);
    headers.set('X-Device-Id', deviceStore.getState().deviceId);
    if (Platform.OS !== 'web') {
      headers.set('X-Device-Name', Device.deviceName ?? '');
      headers.set('X-Device-Type', resolveDeviceType());
    }
    return { url: context.url, init: { ...context.init, headers } };
  },
};
// 加到 cachedConfig.middleware 中（紧跟 authMiddleware 之后）
```

**反模式**：在 phoneSmsAuth / refreshTokenFlow 等每个 wrapper 手填 header → 5+ 处重复 + 漏写风险高 + 代码丑。中间件统一注入 = single source of truth。

`expo-secure-store` 中 `nvy.device_id` 缺失时（首次启动）→ `deviceStore` 初始化逻辑（`packages/auth/src/device-store.ts` 或合并入 auth-store）调 `crypto.randomUUID()` 生成 + 写 secure-store + hydrate；boot 阶段在 root `_layout.tsx` 必须**等 hydrate 完成**才让 api-client 接收第一个请求（否则 header 是 undefined）。

## 6. Drift 政策（代码 > mockup）

mockup bundle 是**翻译期参考**，不是产品真相源。代码 ship 后任何 mockup ↔ code drift **以代码为准**：

- **代码改了 mockup 没改** → 不是 bug，是 mockup stale；不必回头改 bundle
- **mockup 多/少了状态** → spec.md 是 authoritative；mockup 状态变体只是 design-time 输出
- **token 名漂移** → 以 `apps/native/tailwind.config.ts`（implementation 落地） 为准；`design/source/project/tailwind.config.js` 是 mockup-time snapshot
- **fixture data drift** → 全部用 placeholder（per spec ❌ DO NOT INCLUDE 段「任何账号 / 个人 / 真实数据」），real data 从 server response 来

## 7. References

- [`../spec.md`](../spec.md) — FR-001..FR-018 + SC-001..SC-012 + 5 个 CL（业务规则 + UI 流 + 反枚举 / 本机识别 / 字段契约）
- [`./mockup-prompt.md`](./mockup-prompt.md) — Claude Design prompt（PR #87 ship）
- [`./inspiration/01-list.png`](./inspiration/01-list.png) / [`./inspiration/02-detail.png`](./inspiration/02-detail.png) / [`./inspiration/03-sheet.png`](./inspiration/03-sheet.png) — 用户提供的 IA 锚截图
- [`./source/project/`](./source/project/) — Claude Design bundle 原始产出（含 baseline + 本 spec 4 核心 .tsx）
- [`../../delete-account-cancel-deletion-ui/design/handoff.md`](../../delete-account-cancel-deletion-ui/design/handoff.md) — 模板基线（spec C 同 SDD 链）
- [`../../delete-account-cancel-deletion-ui/design/source/project/tailwind.config.js`](../../delete-account-cancel-deletion-ui/design/source/project/tailwind.config.js) — token 系统 baseline（modal-overlay 引入 spec C 已 ship）
- [`<meta>/docs/experience/claude-design-handoff.md`](../../../../docs/experience/claude-design-handoff.md) — Claude Design 通用 playbook
- [my-beloved-server PR #150](https://github.com/xiaocaishen-michael/my-beloved-server/pull/150) — server 配套 spec ship
- [no-vain-years-app PR #86](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/86) — app 配套 spec ship
- [no-vain-years-app PR #87](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/87) — mockup-prompt + inspiration ship
- [PRD § 5.4 强制退出其他设备](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/requirement/account-center.v2.md#54-强制退出其他设备)
- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置](../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)（本 spec 走类 2 变体）
