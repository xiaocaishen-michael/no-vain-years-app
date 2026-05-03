import { defineConfig } from 'vitest/config';

// Vitest config for apps/native unit tests.
//
// 范围（per CLAUDE.md § 五 测试约定）：
//   - lib/**/*.test.ts(x)      ← 工具函数 / 自定义 hook / 状态机
//   - app/**/*.test.ts(x)      ← page-level 业务逻辑（少量；UI 渲染不强制 TDD）
//
// **不**覆盖：apps/native/app/(*)/*.tsx 完整渲染树（Expo Router + RN 组件树需 jest-expo / detox）。
// 思路：业务逻辑层 / hook 用 vitest + happy-dom + vi.mock(expo-router/RN/...)；
//      UI 渲染层走 manual smoke (pnpm web) 直到 detox / playwright 引入（M2+）。
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['lib/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.expo', 'spec/**'],
    globals: false,
  },
});
