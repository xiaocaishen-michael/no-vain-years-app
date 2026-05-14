---
description: 从后端 OpenAPI spec 重新生成前端 TypeScript 客户端
model: sonnet
---

前提：项目使用 **pnpm** 作为包管理器（不要换成 npm / yarn / bun）。

执行以下步骤：

1. 选 spec 来源：
   - 拉本地 `localhost:8080/v3/api-docs` → `pnpm api:gen:dev`（需后端在跑）
   - 拉 prod spec → `pnpm api:gen`
2. 生成产物落到 `packages/api-client/src/generated/`，**禁止手改**
3. 在仓根运行 `pnpm typecheck` 验证类型正确（递归跑所有 workspace）
4. 如有 breaking change，更新相关调用方（apps/native 与其他 packages 中通过 `@nvy/api-client` 入口 import）
