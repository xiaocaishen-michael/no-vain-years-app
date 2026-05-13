---
description: 从后端 OpenAPI spec 重新生成前端 TypeScript 客户端
model: sonnet
---

前提：项目使用 **pnpm** 作为包管理器（不要换成 npm / yarn / bun）。

执行以下步骤：

1. 确认后端运行中，且 `http://localhost:8080/v3/api-docs` 可访问
2. 进入 `no-vain-years-app/`，运行 `pnpm run gen:api` 从 `/v3/api-docs` 生成 TS 客户端到 `lib/api/`
3. 在前端运行 `pnpm tsc --noEmit` 验证类型正确
4. 如有 breaking change，更新相关调用方
5. **首次接入**（脚手架未就绪）：先在 `package.json#scripts` 加入 `gen:api` 脚本：

   ```json
   "gen:api": "openapi-typescript http://localhost:8080/v3/api-docs -o lib/api/schema.ts"
   ```

   此命令为 M1.1 占位，第一周脚手架完成时按实际工具链最终敲定（候选：openapi-typescript / openapi-generator-cli）。
