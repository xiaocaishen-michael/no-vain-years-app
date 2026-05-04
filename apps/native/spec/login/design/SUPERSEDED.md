# Mockup v1 superseded by ADR-0016

The 2026-05-03 mockup bundle (双 tab + password / sms 切换 + 跳 register footer) is superseded by [ADR-0016 unified mobile-first phone-SMS auth](../../../../../docs/adr/0016-unified-mobile-first-auth.md).

新版合一页 mockup（v2）需重做，按 [`docs/experience/claude-design-handoff.md`](../../../../../docs/experience/claude-design-handoff.md) § 2.1b 合一页 prompt 模板，落 `source-v2/`（与 `source/` 平行）。

## 保留原因

`source/` v1 bundle 保留作历史参考（不删除）：

- **Visual tokens** 仍生效 — `packages/design-tokens` 已 mirror v1 token 命名（ink / line / surface / ok / warn / err / accent / brand）；v2 mockup 应**复用 v1 token**，不引入新命名
- **packages/ui 既有组件** 多数保留（per ADR-0016 Migration 表）：Spinner / SuccessCheck / LogoMark / PrimaryButton / PhoneInput / SmsInput / GoogleButton / ErrorRow 这 8 个组件视觉决策仍然有效
- **handoff.md § 5 翻译期硬约束** 仍适用（`w-18` 替换 / reanimated v3 / inline style 仅 reanimated 例外 / token grep cross-check / `gap-7` 验证）

## 失效部分

v1 mockup 的以下视觉 / 结构决策在 v2 合一页**不再适用**：

- ❌ 双 tab "短信登录 / 密码登录" + TabSwitcher 下划线 bar
- ❌ PasswordField 渲染（密码登录 tab 里的密码输入框）
- ❌ "忘记密码" link
- ❌ Footer "还没账号？创建一个" 跳 register 链接
- ❌ `initialMode='sms'` preview 状态

## 翻译记录

`apps/native/spec/login/spec.md` + `plan.md` + `tasks.md` 在 2026-05-04 PR `docs/login-spec-rewrite-adr-0016` 已整体重写为 unified 版本；`packages/ui` 中的 PasswordField / TabSwitcher 在 M1.3 impl PR 删除，新增 WechatButton + AppleButton（per ADR-0016 决策 4）。
