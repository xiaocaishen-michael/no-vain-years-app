# T16-smoke 占位 — delete-cancel PHASE 2 visual smoke 6 状态(deferred)

> **状态**:🟡 deferred(同 spec C T11 真后端冒烟)
> **本 session**:T_mock + T13 + T14 + T15 + T16-doc 已 ship。**T16-smoke 未跑** —— 留作下次 manual session(stack 起完后跑 Playwright)。
> **解锁条件**:server release 0.2.0 production deploy 后跑 T11 + T16-smoke 同 session,共享 stack 启动成本

## 6 状态截图清单

| #   | 文件                             | 描述                                                                                                                                                         |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01  | `01-delete-idle.png`             | delete-account 默认态:警示双段 / 双 checkbox 全空 / SendCodeRow disabled / CodeInput sunken / SubmitButton destructive disabled                              |
| 02  | `02-delete-checked-cooldown.png` | delete-account 双勾 + 60s cooldown:checkbox 真控件 brand fill + ✓ / SendCodeRow `45s 后可重发` / CodeInput 第一格 focused brand ring                         |
| 03  | `03-delete-error.png`            | delete-account 提交失败:CodeInput 切 err 红 ring / ErrorRow err-soft 底卡 `验证码错误` / SubmitButton destructive 红 fill active                             |
| 04  | `04-cancel-prefilled.png`        | cancel-deletion 预填态:RecoverBanner brand-soft / phone read-only sunken + 🔒 + maskPhone / SendCodeRow cooldown / SubmitButton brand fill                   |
| 05  | `05-cancel-deeplink.png`         | cancel-deletion deep-link 空态:phone editable empty + placeholder / SendCodeRow disabled / SubmitButton brand disabled                                       |
| 06  | `06-freeze-modal-active.png`     | login + freeze modal:scrim modal-overlay(0.48)/ Card w296 rounded-md shadow-modal / warn icon-circle + heading + 双 button([保持] ghost / [撤销] brand fill) |

## Stack 启动前提(future manual run)

```bash
# 1. server dev (in my-beloved-server repo)
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run -pl mbw-app

# 2. docker compose dev (postgres + redis)
docker compose -f docker-compose.dev.yml up -d

# 3. metro web bundle
cd no-vain-years-app && pnpm web

# 4. Playwright (run.mjs to be authored alongside actual smoke run)
node apps/native/runtime-debug/2026-05-07-delete-cancel-mockup-translation/run.mjs
```

## 状态构造策略(future run.mjs 设计)

参考 onboarding T_smoke 套路(`page.route` 拦请求 + force render 各状态),本 spec 因 6 状态跨 page 比 onboarding 4 单页态复杂,但 mock-based force-render 仍可:

- DELETE-IDLE / CHECKED-COOLDOWN / ERROR:同页面,checkbox + send-code 触发 + msw mock POST 响应切换
- CANCEL-PREFILLED / DEEPLINK:不同 deep-link 路径(`/(auth)/cancel-deletion?phone=+86138****` / `/(auth)/cancel-deletion`)
- FREEZE-MODAL-ACTIVE:login phone-sms-auth → mock 返 ACCOUNT_IN_FREEZE_PERIOD → freeze modal 弹起

## 下次跑时点

| 触发                                       | 行动                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| server release 0.2.0 production deploy     | 同 session 跑 T11 真后端冒烟 + T16-smoke 6 状态 mock-based 视觉冒烟,共享 stack |
| 本 PR ship 后但 server release 仍 deferred | 跑 T16-smoke mock-based 视觉冒烟,无需 server release(不影响 T11)               |
| (替代)本地 dev 起完 stack 后 ad-hoc        | manual 跑生成 6 PNG,直接落本目录                                               |

跑完后:

1. 6 PNG 落本目录
2. 改 spec C `tasks.md`:T16-smoke `🟡 deferred` → `✅`
3. 顶 Status 行更新

## References

- [`apps/native/spec/delete-account-cancel-deletion-ui/tasks.md`](../../spec/delete-account-cancel-deletion-ui/tasks.md) — T16 拆 doc + smoke
- [`apps/native/spec/delete-account-cancel-deletion-ui/design/handoff.md`](../../spec/delete-account-cancel-deletion-ui/design/handoff.md) § 3 — 6 状态 ↔ FR/SC 对齐表
- [`apps/native/runtime-debug/2026-05-06-onboarding-mockup-translation/`](../2026-05-06-onboarding-mockup-translation/) — onboarding T_smoke run.mjs 套路参考
- [`apps/native/runtime-debug/2026-05-07-my-profile-mockup-translation/`](../2026-05-07-my-profile-mockup-translation/) — my-profile T13 run.mjs 套路参考
