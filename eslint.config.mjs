// Root ESLint flat config — applies to all workspaces.
//
// Per-package lint scripts run `eslint .` from their directory; ESLint
// walks up to find this file. Keeps a single source of truth for lint
// rules across apps/* and packages/*.

import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignore — applied to all subsequent configs.
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      'packages/api-client/src/generated/**',
      'pnpm-lock.yaml',
      'eslint.config.mjs',
    ],
  },

  // Base JS / TS recommended rules.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // CommonJS config files (babel.config.js, metro.config.js, etc.) need
  // node globals (module, require, __dirname) + require()-style imports.
  {
    files: ['**/*.{cjs,js}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ES module Node scripts — distinguished by .mjs and run by node directly
  // (not bundled). Need node globals like `console` / `process`.
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // TypeScript / React shared rules.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React 17+ JSX transform — no need for `import React`.
      'react/react-in-jsx-scope': 'off',
      // TS infers prop types.
      'react/prop-types': 'off',
      // Hooks rules of correctness.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Allow leading underscore for intentionally-unused params / vars.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // {} as a type alias for "any non-null" is occasionally useful;
      // we'll re-enable if it bites us.
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Test files — relax some rules.
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Disable formatting-related rules — Prettier owns those.
  prettierConfig,
);
