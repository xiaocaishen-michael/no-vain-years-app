# Login 页 — Claude Design handoff notes (v2)

> Bundle 来源：[claude.ai/design](https://claude.ai/design) export，2026-05-04 12:37 生成（v2 合一页 unified phone-SMS auth，per ADR-0016）。完整原始 bundle 在 `./source-v2/`。本文档记录**项目特定决策**与翻译期注意点。
>
> v1 bundle（双 tab + password）已 SUPERSEDED，留档 `./source/`（详 [`./SUPERSEDED.md`](./SUPERSEDED.md)）。

## 1. Bundle 内容速览

| 文件                                       | 角色                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `source-v2/LoginScreen.tsx` (18.4KB)       | 主组件，含 5 状态 + 全部子组件 + 6 helper（Spinner/SuccessCheck/useCountdown/LogoMark/TopBar/各 Glyph） |
| `source-v2/LoginScreenPreview.tsx` (3.9KB) | 预览 wrapper，4 状态 + errorScope=sms/submit 各一组                                                     |
| `source-v2/IOSFrame.tsx` (1.9KB)           | iOS 设备外框（仅展示用，不进 implementation）                                                           |
| `source-v2/tailwind.config.js` (1.8KB)     | bundle 自带 Tailwind 配置（**与 v1 byte-identical**，design-tokens 0 改动）                             |
| `source-v2/assets/logo-mark.svg`           | 品牌 logo（12 道光线 + 橙色 sun + 蓝色背景 — 与 v1 简单字标显著不同）                                   |
| `source-v2/CLAUDE-DESIGN-BUNDLE-README.md` | Claude Design 通用 README（与本 bundle 实际形态无关，仅留底参考）                                       |

## 2. 组件 breakdown

| 组件               | 在 bundle 中位置      | 抽取目标                                        | 备注                                                                        |
| ------------------ | --------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `Spinner`          | LoginScreen.tsx ~L45  | `@nvy/ui`                                       | 既有 v1 已有；v2 实现一致，无改动                                           |
| `SuccessCheck`     | LoginScreen.tsx ~L61  | `@nvy/ui`                                       | 同上                                                                        |
| `useCountdown`     | LoginScreen.tsx ~L79  | **不抽** — `useLoginForm` 已自带 `smsCountdown` | 避免双源                                                                    |
| `LogoMark`         | LoginScreen.tsx ~L93  | `@nvy/ui`（**重写 v1 → v2 SVG glyph**）         | v1 简单字标 → v2 12 道光线 + 橙色 sun                                       |
| `TopBar`           | LoginScreen.tsx ~L122 | login.tsx 内联（简单 close 按钮，不抽）         | `onClose` callback 由 caller 传入                                           |
| `PhoneInput`       | LoginScreen.tsx ~L135 | `@nvy/ui`（既有微调）                           | 加 `errored` prop；加 `▾` chevron（与 v1 D7 决议有 drift，per § 5 Drift 1） |
| `SmsInput`         | LoginScreen.tsx ~L163 | `@nvy/ui`（既有微调）                           | 加 `errored` + `requesting` props；ticking 内嵌 spinner 改为静态文字        |
| `ErrorRow`         | LoginScreen.tsx ~L199 | `@nvy/ui`                                       | 既有 v1 一致                                                                |
| `PrimaryButton`    | LoginScreen.tsx ~L210 | `@nvy/ui`                                       | 既有 v1 一致；CTA 文案由 caller 决定                                        |
| `OAuthCircle`      | LoginScreen.tsx ~L224 | login.tsx 内联（薄 wrapper）                    | 容器 + label，glyph 由各 specific 按钮提供                                  |
| `WeChatGlyph`      | LoginScreen.tsx ~L238 | `@nvy/ui/WechatButton`（**新**）                | SVG 微信图标；自包含 `<OAuthCircle bg="bg-[#07C160]">`                      |
| `GoogleGlyph`      | LoginScreen.tsx ~L257 | `@nvy/ui/GoogleButton`（既有重写）              | 替换 v1 多彩 G 为 v2 单字 `G` 风格                                          |
| `AppleGlyph`       | LoginScreen.tsx ~L260 | `@nvy/ui/AppleButton`（**新**）                 | Apple icon 字符；caller 端 `Platform.OS === 'ios'` conditional              |
| `SuccessOverlay`   | LoginScreen.tsx ~L267 | login.tsx 内联（业务文案，不抽享）              | 含 SuccessCheck + 骨架屏                                                    |
| `LoginScreen` 主体 | LoginScreen.tsx 全文  | `apps/native/app/(auth)/login.tsx`              | 接 `useLoginForm` hook，删 phase 1 占位 banner                              |

## 3. 状态机覆盖（与 spec / plan / hook 对齐）

| 状态值           | 视觉描述                                                                             | 对应业务事件                      |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| `idle`           | 首次进入。phone / sms 都空，CTA disabled                                             | render                            |
| `requesting_sms` | 点 "获取验证码" 后；SmsInput 右侧显示 "发送中…" + spinner；inputs 锁定               | `requestSmsCode` 进行中           |
| `sms_sent`       | 倒计时 60s 进行中。SmsInput 右侧 `{N}s 后重发`；CTA 此时 enabled（form valid 时）    | `requestSmsCode` 成功             |
| `submitting`     | CTA loading 态（bg-brand-300 + spinner）；inputs 锁定                                | `phoneSmsAuth` 进行中             |
| `error`          | 根据 `errorScope`（'sms' / 'submit'）决定哪个 input 标红 + ErrorRow 文案             | API 抛 ResponseError / FetchError |
| `success`        | 切到 SuccessOverlay（绿色对勾 reanimated scale-in + 骨架屏）→ AuthGate 自动 redirect | `phoneSmsAuth` 成功               |

`spec.md` 状态机命名与 mockup 完全对齐（5 + error + success 共 6 态），无翻译映射开销。

**`errorScope` 字段**：mockup 引入；hook (`useLoginForm`) 当前未含，phase 2 实施时**扩展 hook 加 `errorScope: 'sms' | 'submit' | null` 字段**（在 `requestSms` / `submit` 抛错时分别 setErrorScope('sms') / setErrorScope('submit')）。

## 4. Token 决策记录

`packages/design-tokens` v1 mirror 仍有效；**v2 tailwind.config.js 与 v1 byte-identical**，无任何 token 增删改。

| 维度     | v2 复用 v1 命名                                                   |
| -------- | ----------------------------------------------------------------- |
| Brand    | `brand-{50..900}` + `brand-soft` ✅                               |
| Accent   | `accent` (DEFAULT + soft) ✅                                      |
| Text     | `ink` (DEFAULT + muted + subtle) ✅                               |
| Border   | `line` (DEFAULT + strong + soft) ✅                               |
| Surface  | `surface` (DEFAULT + alt + sunken) ✅                             |
| Feedback | `ok` / `warn` / `err`（each + soft） ✅                           |
| Spacing  | `xs(4) / sm(8) / md(16) / lg(24) / xl(32) / 2xl(48) / 3xl(64)` ✅ |
| Radius   | `xs(4) / sm(8) / md(12) / lg(16) / full` ✅                       |
| Font     | `sans (Inter + Noto Sans SC + PingFang) / mono` ✅                |
| Shadow   | `card` / `cta` ✅                                                 |

`bg-[#07C160]`（微信品牌绿）是**唯一 ad-hoc 任意值**，仅 WechatButton 内部使用；不进 design-tokens（不是 design system token，是品牌色 literal，per Apple Sign-in 黑色 `bg-ink` 也类似品牌 literal）。

## 5. 翻译期注意点（impl 阶段必读）

### 5.1 `w-18 h-18` 不可用（既有 v1 gotcha 仍适用）

`source-v2/LoginScreen.tsx:71` 的 `SuccessCheck` 用 `className="w-18 h-18 ..."`，但 **Tailwind 默认 spacing scale 没有 18 这一档**（仅 16, 20）。NativeWind 编译时会丢弃这两个 class。

**修复**：用 `w-[72px] h-[72px]` 任意值（保留 mockup 原意 72px）。

### 5.2 Mockup 与 spec drift 4 处（impl 时按下述处理）

| #   | Drift                           | mockup v2                                        | spec.md 修订                                                                                                                                                           |
| --- | ------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 顶部右上 "立即体验" link        | ❌ mockup 删了，改为 close `×` 按钮              | spec.md FR-008 删除（mockup 落地反向更新 spec；游客模式 M2 评估，UI 占位也无必要）                                                                                     |
| 2   | CTA 文案 "登录 / 注册"          | mockup 写 "登录 / 注册"                          | **改为 "登录"** — 违反 ADR-0016 决策 4 negative constraint "无注册引导文案"；mockup 此处 drift 为 bug，**spec FR-001 / impl 以 spec 为准**                             |
| 3   | PhoneInput +86 后跟 `▾` chevron | ✅ mockup 加了                                   | **保留** — v1 D7 删 chevron 的理由（M1.2 大陆唯一）仍有效但 mockup 视觉决定保留 chevron 留扩展位；接受 mockup 视觉，**chevron 静态不绑定下拉行为**（Pressable 不响应） |
| 4   | 协议同意句                      | mockup `《服务条款》《隐私政策》`（中间无 "与"） | 加 "与" 字                                                                                                                                                             |

### 5.3 Apple Android conditional render 在 caller 层

mockup `Platform.OS !== "android"` 内嵌在 LoginScreen 主体内（line 378）。impl 时**抽到 caller 层**（`login.tsx`），用 `Platform.OS === 'ios' ? <AppleButton .../> : null`。理由：

- AppleButton 组件本身跨端可渲染（per ADR-0016 + spec FR-007 + plan.md 反模式 §）
- conditional render 决策由 caller 决定（避免 packages/ui 内部判 platform 引入隐式平台耦合）

### 5.4 `useCountdown` 不要抽出来

mockup 自带 `useCountdown(60, ticking)` hook（line 79）；`useLoginForm` 已有 `smsCountdown`（与 timer cleanup 一并管理）。impl 时**LoginScreen 直接用 hook 暴露的 `smsCountdown`**，不引入 `useCountdown`（避免双源 + timer leak 风险）。

### 5.5 `errorScope` 由 hook 提供

mockup 主体接受 `errorScope: 'sms' | 'submit'` prop 决定哪个 input 标红 + ErrorRow 文案。impl 时**扩展 useLoginForm hook**：

```ts
// useLoginForm 加字段
errorScope: 'sms' | 'submit' | null;
// requestSms 抛错时 setErrorScope('sms')；submit 抛错时 setErrorScope('submit')
// clearError 时 setErrorScope(null)
```

LoginScreen 接 `errorScope` 从 hook 而非 caller 控制；ErrorRow 文案由 hook `errorToast` 决定（不再像 mockup 用 hardcoded 文案）。

### 5.6 OAuthCircle 不抽到 packages/ui

mockup 的 `OAuthCircle` 是薄 wrapper（容器 + label）。impl 时**inline 在 login.tsx**；packages/ui 提供 specific 按钮（WechatButton / GoogleButton / AppleButton），各自包含 OAuthCircle 模式实现 + glyph。理由：每按钮自包含一致性 > shared wrapper 节省的几行代码。

## 6. Drift 政策

代码是真相源（per ADR-0015）。

| 情况                                      | 动作                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| 实施期发现 mockup 视觉决策不合理 → 改代码 | ✅ 直接改（如 § 5.2 drift 2 CTA 文案）                                          |
| Mockup 与最终代码视觉不完全一致（drift）  | ✅ 不算 bug，不回头改 mockup                                                    |
| Token 重新定调                            | ⚠️ 改 `packages/design-tokens`，本 handoff.md "决策记录" 段同步更新（重要变更） |
| 同页第三轮 mockup（如有重大视觉调整）     | 加 `source-v3/` 子目录 + `mockup-v3.png`，不覆盖 v2                             |

## 7. 引用

- [ADR-0014 — NativeWind 跨端 UI 底座](../../../../../docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](../../../../../docs/adr/0015-claude-design-from-m1-2.md)
- [ADR-0016 — Unified mobile-first phone-SMS auth](../../../../../docs/adr/0016-unified-mobile-first-auth.md)
- [ADR-0017 — SDD 业务流先行 + mockup 后置（本页正是 ADR-0017 类 1 流程的 mockup 阶段产出）](../../../../../docs/adr/0017-sdd-business-flow-first-then-mockup.md)
- [`spec.md`](../spec.md)（功能性需求 + 状态机 + 验收）
- [`plan.md`](../plan.md)（架构设计 + UI 结构段 — phase 2 回填后）
- [`tasks.md`](../tasks.md)（任务拆分 + impl 顺序）
- [v1 SUPERSEDED note](./SUPERSEDED.md)
