# `apps/native/spec/` — SDD 三件套 + Mockup 留迹

本目录托管每页 SDD 四步法的产出 + Claude Design mockup 留迹（per [ADR-0010 SDD](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0010-sdd-with-spec-kit.md) + [ADR-0015 Claude Design from M1.2](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0015-claude-design-from-m1-2.md)）。

## 目录结构

每个 use case / 页面一个子目录：

```text
apps/native/spec/
├── README.md                      ← 本文件
├── login/                         ← M1.2 第一页
│   ├── spec.md                    ← /speckit.specify 产出
│   ├── plan.md                    ← /speckit.plan 产出（含 UI 结构段，吸收 mockup 决策）
│   ├── tasks.md                   ← /speckit.tasks 产出
│   └── design/                    ← Claude Design mockup 留迹
│       ├── mockup-v1.png          ← 视觉 mockup（PNG 截图，可选）
│       ├── mockup-v2.png          ← 迭代版本（如需）
│       ├── handoff.md             ← 项目特定决策 + 翻译期注意点（人类作者）
│       └── source/                ← Claude Design export bundle 原样保留（只读快照）
│           ├── *.tsx              ← bundle 自带的 RN+NativeWind 源码
│           ├── tailwind.config.js ← bundle 自带 token 配置（参考用，已 mirror 到 packages/design-tokens）
│           ├── assets/            ← 品牌资源
│           └── *-README.md        ← Claude Design 通用 handoff 文档（重命名带前缀）
├── register/
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   └── design/
└── home/
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    └── design/
```

## SDD 四步 + mockup 嵌入位置

```text
1. /speckit.specify  → 写 spec.md（user scenarios / FR / success criteria）
2. (Claude Design)   → 出 mockup PNG + handoff，落 design/ 子目录；spec.md 内引用
3. /speckit.plan     → 写 plan.md（含 UI 结构段，吸收 mockup 决策）
4. /speckit.tasks    → 写 tasks.md（拆 packages/ui 组件 + 集成）
5. /speckit.implement → TDD 红绿循环 + className 1:1 paste 翻译 mockup
```

> mockup 不增加步骤数（仍是 4 步），是 spec 阶段的视觉补充。Claude Design 输出 Tailwind className → NativeWind 直接 paste（per [ADR-0014](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0014-nativewind-tailwind-universal.md) 选 NativeWind 让翻译成本近 0）。

## Mockup 留迹纪律

| 项                | 约定                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 路径              | `<page>/design/`，与 spec.md 同位                                                                                                                              |
| 文件命名          | `mockup-v{N}.png` / `handoff.md` / `source/...`；不要带空格 / 中文                                                                                             |
| 体积              | 单页通常 1-3 MB；M3 内测前评估是否需 git LFS                                                                                                                   |
| `mockup-v{N}.png` | 视觉快照（**可选**）。bundle 含 RN+NativeWind 源码时 PNG 价值低；bundle 仅含 HTML preview 时建议补 PNG                                                         |
| `handoff.md`      | **必有**，人类作者。组件 breakdown / token 决策 / 翻译期注意点 / drift 政策。详见 `login/design/handoff.md` 模板                                               |
| `source/`         | **必有**（v2 起）。Claude Design export bundle 原样保留，**只读**，不在此处编辑；bundle 内 README.md 重命名为 `<TOOL>-BUNDLE-README.md` 避免与 handoff.md 混淆 |
| 心智              | **代码是真相源**；mockup 与 source/ 都是历史快照。代码演化后 drift **不算 bug**；只在 design system 大重设时清理                                               |
| commit 入 git     | ✅ 入 git，方便复盘 / 对外分享；不分支管理（mockup 总跟当时的 spec 走）                                                                                        |
| 二轮迭代          | 加 `mockup-v2.png` + `source-v2/`；不覆盖 v1（保留迭代历史）                                                                                                   |

## Claude Design 操作 playbook

实际操作步骤（如何打开 Claude Design / 如何 prompt / handoff bundle 怎么导出）等 M1.2 login 页第一次跑通后写到 [`<meta>/docs/experience/claude-design-handoff.md`](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/experience/claude-design-handoff.md)（届时本 README 加引用）。

## 与 spec-kit CLI 的协同

spec-kit `/speckit.*` slash command 当前不感知 design/ 子目录。约定为：

- `spec.md` 第一段引用 mockup（如 `> Mockup: ./design/mockup-v1.png`），让 Claude Code `/plan` 阶段读 spec.md 时能看到引用
- `/plan` 阶段除读 spec.md 外，主动 read `design/` 子目录里的 PNG / handoff，把视觉决策吸收进 plan.md `## UI 结构` 段

## 引用

- [ADR-0014 — NativeWind 跨端 UI 底座](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0014-nativewind-tailwind-universal.md)
- [ADR-0015 — Claude Design from M1.2](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/adr/0015-claude-design-from-m1-2.md)
- [`docs/ui-ux-workflow.md`](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/ui-ux-workflow.md)
- [`docs/conventions/sdd.md`](https://github.com/xiaocaishen-michael/no-vain-years/blob/main/docs/conventions/sdd.md)
