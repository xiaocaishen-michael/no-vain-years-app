# no-vain-years-app — 客户端规则

「不虚此生」项目的跨端前端。目标：Web + iOS + Android 同步上线，Desktop 后期（约 1 年内）补齐。

## 技术栈

（待脚手架化时最终确认；当前选型方向来自 meta 仓 plan）

- Expo SDK 52+（基于 React Native）
- TypeScript
- Expo Router v4（文件式路由）
- React Native Web（Web 端渲染）
- 状态管理：Zustand 或 Jotai（待选）
- 数据获取：TanStack Query
- 样式：Tamagui 或 NativeWind（待选）
- 表单：React Hook Form + Zod
- 本地存储：MMKV（mobile）+ localStorage（web），Expo 封装统一 API
- API 客户端：由 OpenAPI Generator 从 `../my-beloved-server` 的 spec 自动生成
- 构建 / 发布：EAS Build + EAS Submit + EAS Update
- Desktop：Tauri 2.0 包装 Web bundle

## 目录约定

（骨架，待脚手架化后补充完整）

```
no-vain-years-app/
├── app/            # Expo Router 路由（页面）
├── components/     # 跨端通用组件
├── features/       # 业务模块（按领域划分）
├── lib/
│   ├── api/        # OpenAPI 生成的客户端（不手写）
│   ├── storage/    # 本地存储抽象
│   └── auth/
└── hooks/
```

## 跨端差异约定

- 优先写**同一份代码**跑三端
- 必须分端时用文件后缀：`foo.web.tsx` / `foo.native.tsx` / `foo.ios.tsx` / `foo.android.tsx`
- 样式尽量用跨端方案（Tamagui / NativeWind），避免直接写 `StyleSheet.create` 的平台特定值

## 构建与运行

（待脚手架化后补充具体命令）

## 关联

- Meta 仓公共规则：`../CLAUDE.md`（Git workflow、业务命名、API 契约原则）
- 后端 API 提供方：`../my-beloved-server`（通过 OpenAPI 生成类型）
