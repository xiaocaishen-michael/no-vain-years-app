# Runtime debug screenshots

每次真后端冒烟 / Playwright 自动化跑通的截图归档目录。统一观看与管理。

## 约定

### 目录结构

```text
apps/native/runtime-debug/
├── README.md                                   # 本文件，进 git
├── <YYYY-MM-DD>-<phase>-<short-name>/          # 每次验证一个文件夹
│   ├── README.md                               # session 元数据（场景 / SHA / 结果），进 git
│   └── NN-<scenario>-<step>.png                # 截图按时间顺序编号，**不进 git**
└── ...
```

### 命名

| 维度           | 规则                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| Session 文件夹 | `<YYYY-MM-DD>-<phase>-<short-name>` 形如 `2026-05-04-phase3-unified-auth` |
| Phase          | 与 ADR / spec phase 对齐（phase1 / phase2 / phase3 / m1.3 / m2 等）       |
| Short name     | 用例 / 模块名（unified-auth / register / pkm-canvas 等）                  |
| 截图编号       | 两位数 `NN-`（01 / 02 / ...）保证 ls 顺序 = 时间顺序                      |
| Scenario 标签  | 一词 kebab：`happy` / `401` / `429` / `network` / `success` 等            |
| Step 标签      | `initial` / `form-filled` / `submit` / `error` / 等                       |

例：`03-401-error.png` / `06-happy-success.png` / `08-network-error.png`

### 进 git vs 不进 git

| 文件                             | 进 git | 理由                                          |
| -------------------------------- | ------ | --------------------------------------------- |
| Root README.md（本文件）         | ✅     | 约定文档                                      |
| Session 文件夹 README.md         | ✅     | 场景元数据 / SHA / 结果 narrative             |
| Session 文件夹 `*.png` / `*.jpg` | ❌     | 二进制 + 体积；本地存即可（per `.gitignore`） |

**理由**：截图是 ad-hoc artifact，不在 review / merge 闭环；READMEnarrative 让 reader 不需要看图也能理解验证结果（与 ADR-0017 "代码是真相源" 心智一致）。

## 工具

[`apps/native/tools/runtime-debug.mjs`](../tools/runtime-debug.mjs) — Playwright 启动 :8081 + 录 console / pageerror / networkfail + ordered action list（click / fill / shot / wait / press）+ JSON 输出。

### 推荐输出路径

```bash
SESSION=2026-05-04-phase3-unified-auth
mkdir -p apps/native/runtime-debug/$SESSION
node tools/runtime-debug.mjs http://localhost:8081 \
  --shot apps/native/runtime-debug/$SESSION/01-happy-initial.png \
  --fill '[aria-label="手机号"]' '13800138000' \
  --fill '[aria-label="验证码"]' '865157' \
  --shot apps/native/runtime-debug/$SESSION/02-form-ready.png \
  --click '[aria-label="登录"]' \
  --wait 2000 \
  --shot apps/native/runtime-debug/$SESSION/03-success.png
```

## Session README 模板

每个 session 文件夹下的 `README.md` 推荐结构（参考 [`2026-05-04-phase3-unified-auth/README.md`](./2026-05-04-phase3-unified-auth/README.md)）：

```markdown
# Runtime debug session: <page> <phase>

- **Date**: 2026-MM-DD HH:MM
- **Branch / SHA**: <git SHA>
- **Phase**: <ADR ref>
- **Tool**: tools/runtime-debug.mjs
- **Server profile**: dev / prod-dryrun / etc

## Scenarios

| #   | Scenario | Result | Screenshots  | Notes                              |
| --- | -------- | ------ | ------------ | ---------------------------------- |
| 1   | happy    | ✅     | 01 / 02 / 03 | DB last_login_at 12s 前更新        |
| 2   | 401      | ✅     | 04 / 05 / 06 | mapApiError → "手机号或验证码错误" |
| ... |          |        |              |                                    |

## Verifications

- Backend log（关键 INFO 行 / 时间戳）
- DB state changes（SQL snapshot）
- Console errors（pageerror / consoleError 拷贝）
- Anti-pattern check（如 SC-002 反枚举一致响应）

## 结论

✅ <N> scenario PASS / ❌ <N> FAIL
留下次的：<gap>
```

## 跨设备同步

当前不跨设备同步（与 docs/daily 不同，截图体积大不适合 iCloud）。需要看历史截图请回到当时的设备 / 重跑相同 session。

如未来需要跨设备查看，评估方案：

- iCloud symlink（与 docs/experience 同模式）— 体积可能撑满 iCloud 配额
- 仅同步 README.md（git 已含）+ 关键缩略图（new convention）
- ad-hoc 截图归档到对象存储（OSS）
