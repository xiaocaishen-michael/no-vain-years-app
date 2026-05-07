# Runtime debug session: account-settings-shell 5-state visual smoke (M1.X PHASE 2 / SDD T15)

- **Date**: 2026-05-07 18:54 CST
- **Branch / SHA**: app `feature/account-settings-shell-mockup-translation`(post mockup translation T_mock + T13 + T14);server `main` `0136a50`
- **Phase**: ADR-0017 类 1 PHASE 2 落地后 visual smoke — 5 page mockup translation 视觉稳定回归
- **Tool**: `apps/native/runtime-debug/2026-05-07-account-settings-shell-mockup-translation/run.mjs`(Playwright headless Chromium,viewport 390×844)
- **Server profile**: dev(`SPRING_PROFILES_ACTIVE=dev`,`scripts/dev-server.sh` 启动)
- **Frontend setup**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm --filter native web`(Metro :8081)

## 与 PHASE 1 冒烟(`2026-05-07-my-profile-business-flow/`)的区分

| 维度       | PHASE 1(business flow,T9 集成测覆盖)                                     | PHASE 2(visual smoke)                                                                       |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 目的       | 验证 settings stack 5 page navigation + handleLogout race guard + 反枚举 | 验证 mockup translation 后 5 page 视觉态稳定可读(per handoff.md § 3)                        |
| 真后端调用 | vitest mock(无真后端)                                                    | ✅ phoneSmsAuth + GET /me + PATCH /me;真后端含 phone 字段(server PR #139 已 merge main)     |
| DB 副作用  | 无                                                                       | onboard 写入 displayName='小明';测试完毕 cleanup(account + refresh_token + credential 删净) |
| 截图数     | 0(测试断言为主)                                                          | 5 张(5 page 默认状态)                                                                       |
| Mock 策略  | mock react-native + mock expo-router                                     | 无 mock(全真实路由 + 真后端)                                                                |

## Scenarios

| #   | Scenario            | Result | Screenshot                                             | 视觉验收点                                                                                                                                                                                          | 构造方式                                       |
| --- | ------------------- | ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 01  | settings            | ✅     | [01-settings](./01-settings.png)                       | Stack header "设置";Card 1 "账号与安全 >" 单行 active;Card 2 4 行 disabled(通用 / 通知 / 隐私与权限 / 关于);Card 3 切换账号 disabled + 退出登录 destructive 红字居中;Footer 双 accent(橙)链接       | onboard 完成 → tap ⚙️ → push /(app)/settings   |
| 02  | account-security    | ✅     | [02-account-security](./02-account-security.png)       | Stack header "账号与安全";Card 1 手机号 + `+86 139****8888` + chevron / 实名认证 disabled / 第三方账号绑定 disabled;Card 2 登录设备 disabled;Card 3 注销账号 destructive 红字 + 安全小知识 disabled | tap "账号与安全" → push account-security/index |
| 03  | phone-mask          | ✅     | [03-phone-mask](./03-phone-mask.png)                   | Stack header "手机号";中央 mono + tracking-wide 大字 mask `+86 139****8888`;无副标题 / 无操作 / 无装饰(per spec Q4)                                                                                 | tap "手机号" → push account-security/phone     |
| 04  | legal-personal-info | ✅     | [04-legal-personal-info](./04-legal-personal-info.png) | Stack header "《个人信息收集与使用清单》";占位文案居中 ink-muted text-sm leading-relaxed                                                                                                            | back ×2 + tap "《个人信息收集与使用清单》"     |
| 05  | legal-third-party   | ✅     | [05-legal-third-party](./05-legal-third-party.png)     | 同 04 模板,标题改 "《第三方共享清单》"                                                                                                                                                              | back + tap "《第三方共享清单》"                |

## 视觉一致性(vs mockup handoff.md § 3 + § 4)

5 张截图完全 match handoff.md 状态机覆盖:

- **Card 视觉**:`bg-surface rounded-md border border-line-soft overflow-hidden` — 白卡片 + 软线边框 + 中等圆角 ✓
- **页底 sunken**:`bg-surface-sunken`(列表 page)/ `bg-surface`(单文本 page)— 卡片浮起对比 ✓
- **Row 三态 tone**:`text-ink`(default) / `text-ink-muted`(disabled) / `text-err`(destructive) ✓
- **Footer 链接**:`text-accent`(橙)— per Token 决策避免与 brand-500 蓝撞色 ✓
- **PhoneScreen mask**:`text-2xl font-semibold text-ink font-mono tracking-wide` — 数字 affordance 强烈 ✓
- **Legal 文案**:`text-sm text-ink-muted leading-relaxed text-center` — 占位轻量呈现 ✓
- **Token 0 新增**:全套复用 my-profile PHASE 2 base(per handoff § 4)

## Drift 验证(代码 > mockup,per handoff § 6)

| Drift 项                                 | mockup      | 落地实现                                                                                            | 截图证据                                                                                    |
| ---------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 自定义 `<StackHeader>`                   | mockup 自画 | 删除,Expo Router default Stack header(iOS native 体验)                                              | 5 张截图顶 nav 一致(返回箭头 + 居中标题)                                                    |
| `<LogoutAlert>` custom modal             | mockup 自画 | 删除,保留 PHASE 1 `Alert.alert()`(已 ship + T5 测试覆盖)                                            | 01 截图无弹窗(Alert 触发后由 RN 系统 sheet 渲染)                                            |
| PhoneScreen 副标题 "已绑定手机号"        | mockup 加   | 删除(per spec Q4 仅 mask 显示)                                                                      | 03 截图仅居中 mask,无副标题                                                                 |
| primitives 从 SettingsScreen 反向 export | mockup 形式 | 抽到 `apps/native/components/settings/primitives.tsx`(app/ 下 `_xxx.tsx` 会被 Expo Router 当成路由) | 0 console warning(原 `_primitives.tsx` 触发 missing default export warning,relocate 后消失) |

## Network log(`page.on('request')`)

```text
[REQ]  POST /api/v1/accounts/phone-sms-auth   ← 登录预热
[REQ]  GET  /api/v1/accounts/me                ← loadProfile(displayName=null,phone=+8613922228888)
[RESP] 200  /api/v1/accounts/me
[REQ]  PATCH /api/v1/accounts/me              ← onboard 设 displayName='小明'
[RESP] 200  /api/v1/accounts/me
```

## DB state

```sql
-- before cleanup (post-onboard):
SELECT id, phone, status, display_name FROM account.account WHERE phone = '+8613922228888';
-- 16 | +8613922228888 | ACTIVE | 小明   ✅ phone 字段服务端写入正确(per server PR #139)

-- after cleanup:
SELECT COUNT(*) FROM account.account WHERE phone = '+8613922228888';
-- 0   ✅ refresh_token + credential + account 全删净
```

## 已知非问题

- ⚠️ **首次跑发现 console warning** `Route "./(app)/settings/_primitives.tsx" is missing default export` — Expo Router file-based routing 把 `_primitives.tsx` 当成 route 文件(只有 `_layout.tsx` 和 `+not-found.tsx` 是 Expo Router special-cased,**任何其他 `_xxx.tsx` 仍会被当 route**)
- ✅ **修复**:把 `_primitives.tsx` 移到 `apps/native/components/settings/primitives.tsx`(在 `app/` 之外)+ 改两处 import path;重跑 smoke 后 console warning 完全消失
- 收益沉淀进 `<meta>/docs/experience/` 候选 — Expo Router 路由排除规则,见 commit message

## 检查清单(用户验收)

- [x] 5 张截图视觉对得上 mockup handoff.md § 3
- [x] 0 page errors / 0 console errors / 0 network fails
- [x] DB cleanup 干净(rows after cleanup = 0)
- [x] 真实 phone 字段从 server `/me` 反传到 store + maskPhone 渲染(`+86 139****8888`)
- [x] 退出登录 destructive 红字 + chevron 否决(per Row 视觉规则)
- [x] disabled 项 opacity 0.5 + ink-muted(per 状态视觉转移表)
- [x] Footer 法规链接 `text-accent` 橙色(per Token 决策)
