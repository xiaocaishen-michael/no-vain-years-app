# Runtime debug session: my-profile business flow (M1.X / SDD A T9)

- **Date**: 2026-05-07 (script created; screenshots pending next dev session)
- **Branch**: `feature/my-profile-spec` — T1-T8 committed
- **Phase**: ADR-0017 类 1 PHASE 1 — 占位 UI 业务流冒烟（mockup PHASE 2 pending Claude Design）
- **Tool**: `run.mjs`（Playwright headless Chromium, viewport 390×844）
- **Server profile**: dev（`SPRING_PROFILES_ACTIVE=dev MBW_AUTH_JWT_SECRET=test-secret-... DATASOURCE_PASSWORD=mbw ./mvnw -pl mbw-app spring-boot:run`）
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm web`（Metro :8081）

## Preconditions

1. Server running on :8080 with dev profile
2. Metro dev server on :8081 (`pnpm web`)
3. Test user already onboarded: phone `+8613922224444`, displayName='小明' (from onboarding smoke)
   - If user doesn't exist, run the onboarding smoke first to create it.
4. Redis: seed sms_code hash (see onboarding README if fresh login needed)

## Scenarios

| #   | Scenario                                                | Result  | Screenshots | Notes                                                       |
| --- | ------------------------------------------------------- | ------- | ----------- | ----------------------------------------------------------- |
| 1   | 已 onboarded 用户冷启动 → (tabs)/profile landing        | pending | 01 → 02     | AuthGate 三态 → noop; (tabs)/profile 是新 landing (T1 改动) |
| 2   | 切 slide tab → 图谱                                     | pending | 03          | SlideTabs 状态机 tap 切换                                   |
| 3   | ScrollView sticky tabs（Web bundle position:sticky）    | pending | 04          | stickyHeaderIndices={[2]}                                   |
| 4   | 底 tab 切 首页 → 切回 我的 → activeTab 仍 graph         | pending | 05 → 06     | unmountOnBlur=false; cross-tab activeTab 保持               |
| 5   | 点 ⚙️ → router.push /(app)/settings（dev warning 接受） | pending | 07          | settings 路由不存在 → dev warning; spec B 落地后消失        |

## Dev warning note

点击 ⚙️ 会触发 `router.push('/(app)/settings')`。当前 settings 路由尚未实现（spec B 范围）。

**预期行为**: Expo Router 在 web bundle 可能抛 navigation error 或 404 dev warning — **接受**，`router.push` call 已 fire 正确，路由缺失是已知技术债（spec B: account-settings-shell 落地后消失）。

## Usage

```bash
# From monorepo root
node apps/native/runtime-debug/2026-05-07-my-profile-business-flow/run.mjs
```

## SC Acceptance (spec my-profile / ADR-0017 PHASE 1)

- [ ] **SC-002**: AuthGate 三态 — 已 onboarded 用户冷启动 → (tabs)/profile（noop）
- [ ] **SC-003**: Cross-tab activeTab 保持（图谱 → 首页 → 我的 仍 graph）
- [ ] **SC-004**: 占位 UI 0 视觉决策（grep pass in T8）
- [ ] **SC-006**: 反枚举不变性（no accountId in render, grep pass in T8）
- [ ] **SC-007**: 冷启动无 AuthGate 抖动（SplashPlaceholder 显示直到 rehydrate 完成）
- [ ] **SC-008**: 底 tab 无图标（grep pass in T8）
- [ ] **SC-009**: (app)/index.tsx 删除，旧路由引用全部迁移（T4 grep pass）
- [ ] **SC-010**: 视情况手动 logout → AuthGate 跳 login（integration test 已覆盖逻辑层）
