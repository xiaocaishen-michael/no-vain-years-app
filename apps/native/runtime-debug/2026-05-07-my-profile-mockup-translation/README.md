# Runtime debug session: my-profile 4-state visual smoke (M1.X PHASE 2 / SDD T13)

- **Date**: 2026-05-07 14:54 CST
- **Branch / SHA**: app `feature/my-profile-visual-smoke` (post mockup translation [PR #70](https://github.com/xiaocaishen-michael/no-vain-years-app/pull/70) `26beca7`); server `main`
- **Phase**: ADR-0017 类 1 PHASE 2 落地后 visual smoke — 4 个 mockup state（default-notes / sticky-scrolled / graph-tab / kb-tab）视觉稳定性回归
- **Tool**: `apps/native/runtime-debug/2026-05-07-my-profile-mockup-translation/run.mjs`（Playwright headless Chromium，viewport 390×844）
- **Server profile**: dev（`SPRING_PROFILES_ACTIVE=dev` + `.env.local` source）
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm --filter native web`（Metro :8081）

## 与 PHASE 1 冒烟（[`2026-05-07-my-profile-business-flow/`](../2026-05-07-my-profile-business-flow/README.md)）的区分

| 维度       | PHASE 1（business flow）                                                                        | PHASE 2（visual smoke）                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 目的       | 验证 AuthGate 第三态 + slide tab 切换 + sticky 滚动 + cross-tab activeTab 保持 + ⚙️ router.push | 验证 mockup translation 后 4 个 mockup state 的视觉态稳定可读（per handoff.md § 3）                  |
| 真后端调用 | ✅ phoneSmsAuth + GET /me；PATCH /me；全真实                                                    | ✅ phoneSmsAuth + GET /me + PATCH /me（onboard setup）；profile 页本身只读 GET，无后续 mutation      |
| DB 副作用  | displayName 持久化（预设已 onboarded 用户）                                                     | onboard 写入 displayName='小明'；测试完毕后立即 cleanup（account + refresh_token + credential 删净） |
| 截图数     | 7 张（business flow 7 节点）                                                                    | 4 张（同一页 4 mockup state）                                                                        |
| Mock 策略  | 无 mock（全真实）                                                                               | 无 mock（profile 纯 GET，状态由 scrollY + useState 驱动，不需 page.route 拦截）                      |

## Scenarios

| #   | Scenario        | Result | Screenshot                                     | 视觉验收点                                                                                                                                               | 构造方式                                                                                                      |
| --- | --------------- | ------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 01  | default-notes   | ✅     | [01-default-notes](./01-default-notes.png)     | Hero 全显（280px 渐变背景 + Avatar 首字 + '小明' + '5 关注 / 12 粉丝'）+ TopNav 透明白图标（onBlur=true）+ SlideTabs underline 在首位（笔记）+ 未 sticky | onboarding 完成 → AuthGate 跳 /(app)/(tabs)/profile，截图 landing 状态（scrollY=0）                           |
| 02  | sticky-scrolled | ✅     | [02-sticky-scrolled](./02-sticky-scrolled.png) | Hero 已滚出视口 + SlideTabs 钉在 TopNav 下方 + TopNav 切白底深图标（onBlur=false，`bg-surface border-b border-line-soft`）                               | `page.mouse.wheel(0, 350)` 超过 STICKY_THRESHOLD(224) → onScroll 回调切 isSticky=true → TopNav className 切换 |
| 03  | graph-tab       | ✅     | [03-graph-tab](./03-graph-tab.png)             | scroll 回顶（wheel -500）→ activeTab=graph，SlideTabs underline 滑到中位（240ms easeOutCubic 动画）+ TabPlaceholder 切 "图谱内容即将推出"                | `page.mouse.wheel(0, -500)` 回顶 + tap `getByRole('tab', { name: '图谱' })`                                   |
| 04  | kb-tab          | ✅     | [04-kb-tab](./04-kb-tab.png)                   | activeTab=kb，underline 滑到末位 + TabPlaceholder 切 "知识库内容即将推出"                                                                                | tap `getByRole('tab', { name: '知识库' })`                                                                    |

## 视觉一致性（vs mockup handoff.md § 3）

PR #70 落地 4 个 mockup state 完全匹配 handoff.md § 3 声明：

- **品牌色**：SlideTabs underline `bg-brand-500` + AvatarPlaceholder 内圈 `bg-brand-500`
- **Hero 沉浸式**：`HeroBlurBackdrop`（SVG gradient stand-in，M2+ 换 ImageBackground）+ `bg-hero-overlay`（alpha 0.36 深色层）
- **TopNav 双态**：onBlur=true → 透明 + SVG 白色图标（`tokens.colors.surface.DEFAULT`）；onBlur=false → `bg-surface border-b` + 深色图标（`tokens.colors.ink.DEFAULT`）
- **新增 token**（T11 落地）：`hero-overlay` / `white-soft` / `white-strong` / `boxShadow.hero-ring` — 全套 4 token 在 screenshots 视觉有效

## 已知非问题

- RN 内部弃用 warning `props.pointerEvents is deprecated. Use style.pointerEvents` — 来自 RN 框架内部，与本页实现无关，已在脚本 console filter 中显式豁免（和 onboarding T_smoke 过滤 `Failed to load resource: 400` 同策略）
- 02-sticky-scrolled：SlideTabs sticky 行为在 RN Web bundle 中通过 CSS `position: sticky` 实现（Expo Router web bundle 把 `stickyHeaderIndices` 转成 sticky）；native bundle 需 manual 验证（per T9 双 bundle 验证说明）

## Network log（page.on('request')）

```text
[REQ]  POST /api/v1/accounts/phone-sms-auth    ← 登录预热
[REQ]  GET  /api/v1/accounts/me                 ← loadProfile（displayName=null）
[RESP] 200  /api/v1/accounts/me
[REQ]  PATCH /api/v1/accounts/me               ← onboard 设 displayName='小明'
[RESP] 200  /api/v1/accounts/me
```

## DB state

```sql
-- before cleanup (post-onboard):
SELECT id, phone, status, display_name FROM account.account WHERE phone = '+8613922226666';
-- 14 | +8613922226666 | ACTIVE | 小明   ✅ PATCH /me 写入成功

-- after cleanup:
SELECT COUNT(*) FROM account.account WHERE phone = '+8613922226666';
-- 0  ✅ 清理完毕（refresh_token + credential + account 三表）
```

## Verifications

| 维度            | 计数 | 说明                                                                             |
| --------------- | ---- | -------------------------------------------------------------------------------- |
| `pageErrors`    | 0    | ✅                                                                               |
| `networkFails`  | 0    | ✅                                                                               |
| `consoleErrors` | 0    | ✅（`props.pointerEvents is deprecated` 已在 filter 中豁免，系 RN 内部框架噪音） |

## Test data preparation

- 测试 phone `+8613922226666`：fresh，脚本起手 DELETE 三表 + Redis DEL → phoneSmsAuth 创建 ACTIVE account → onboard PATCH /me 写 displayName='小明' → 截图 → cleanup
- SMS code `999999`：seed Redis BCrypt hash（与 onboarding / T9 同源）

## 与 spec 验收点

- ✅ **T13 [Visual smoke]**：4 状态截图归档完整 + run.mjs exit 0 + 视觉与 PR #70 mockup translation handoff.md § 3 对齐
- ✅ **DB 副作用清理**：测试 account 删净，display_name='小明' 仅存在于截图期间
- ✅ **mockup ↔ implementation 一致性**：scrollY 阈值 / onBlur 切换 / tab underline 动画 / TabPlaceholder 文案全部与 `design/handoff.md` 约定一致

## 结论

✅ **4 状态视觉冒烟 PASS** — my-profile mockup translation 视觉端无回归：

- default-notes / sticky-scrolled / graph-tab / kb-tab 4 态视觉清晰可读
- TopNav onBlur 双态（透明/白底）、SlideTabs underline 动画、TabPlaceholder 切换稳定
- DB 零污染（onboard 副作用在测试后立即清理）

后续若引入 visual regression 工具（per tasks.md T14，M2+），本批 4 张 PNG 可直接作为基线。
