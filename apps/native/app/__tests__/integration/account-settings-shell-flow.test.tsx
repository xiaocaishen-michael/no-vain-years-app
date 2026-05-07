/**
 * Integration tests for account-settings-shell business flow (spec T9).
 *
 * Strategy: 两类测试合一文件
 *   1. Cross-page navigation flow — sequential mount + click + assert
 *      router calls. Not real Stack navigation (vitest/happy-dom 不支持
 *      Expo Router 真栈),but verifies 路由 push 顺序 + 全流 logout
 *      best-effort.
 *   2. SC-005 anti-enum static grep — fs.readFileSync 各 settings/* page
 *      source 直接扫描,确认无 accountId render / 无 7+ digit clear-text /
 *      无 packages/ui import (per spec FR-013 PHASE 1 不抽组件)。
 *
 * Per tasks.md T9 + spec.md SC-005 / SC-007 / SC-010 / US9。
 *
 * Scope cut: 真栈 pop 行为 / 底 tab 隐藏 / Web Alert window.confirm 视觉
 * 由 T10 Playwright 真后端冒烟覆盖 (本 PR 不跑,placeholder 标 🟡)。
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRouterPush, mockRouterReplace, mockAlertAlert, mockLogoutAll, mockPhone } = vi.hoisted(
  () => ({
    mockRouterPush: vi.fn<(route: string) => void>(),
    mockRouterReplace: vi.fn<(route: string) => void>(),
    mockAlertAlert:
      vi.fn<
        (
          title: string,
          msg: string | undefined,
          buttons?: Array<{ text: string; style?: string; onPress?: () => void }>,
        ) => void
      >(),
    mockLogoutAll: vi.fn<() => Promise<void>>(),
    mockPhone: vi.fn<() => string | null>(() => null),
  }),
);

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
}));

vi.mock('@nvy/auth', () => ({
  logoutAll: mockLogoutAll,
  useAuthStore: (selector: (state: { phone: string | null }) => unknown) =>
    selector({ phone: mockPhone() }),
}));

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const createElement = React.createElement;
  const Text = ({ children }: { children?: React.ReactNode }) =>
    createElement('span', null, children);
  const View = ({ children }: { children?: React.ReactNode }) =>
    createElement('div', null, children);
  const ScrollView = ({ children }: { children?: React.ReactNode }) =>
    createElement('div', null, children);
  const Pressable = ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { disabled?: boolean };
    disabled?: boolean;
  }) => {
    const isDisabled = disabled || accessibilityState?.disabled || false;
    return createElement(
      'button',
      {
        onClick: isDisabled ? undefined : onPress,
        'aria-label': accessibilityLabel,
        'aria-disabled': isDisabled || undefined,
        disabled: isDisabled || undefined,
        role: accessibilityRole,
      },
      children,
    );
  };
  const Alert = { alert: mockAlertAlert };
  return { Text, View, ScrollView, Pressable, Alert };
});

import SettingsIndex from '../../(app)/settings/index';
import AccountSecurityIndex from '../../(app)/settings/account-security/index';
import PhoneScreen from '../../(app)/settings/account-security/phone';
import PersonalInfoListScreen from '../../(app)/settings/legal/personal-info';
import ThirdPartyShareListScreen from '../../(app)/settings/legal/third-party';

describe('account-settings-shell flow — cross-page navigation (T9 / SC-007 / SC-010 / US9)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
    mockAlertAlert.mockClear();
    mockLogoutAll.mockReset();
    mockPhone.mockReturnValue('+8613812345678');
  });

  it('settings → account-security → phone — push 顺序正确', () => {
    // Step 1: settings/index → click 账号与安全
    const { unmount } = render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '账号与安全' }));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/(app)/settings/account-security');
    unmount();

    // Step 2: account-security/index → click 手机号
    render(<AccountSecurityIndex />);
    fireEvent.click(screen.getByRole('button', { name: '手机号' }));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/(app)/settings/account-security/phone');
  });

  it('phone detail renders maskPhone(store.phone) — SC-005 不漏明文', () => {
    render(<PhoneScreen />);
    expect(screen.getByText('+86 138****5678')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d{7,}/);
  });

  it('settings → footer 双链接 → 法规页面 push 顺序', () => {
    const { unmount } = render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('link', { name: '《个人信息收集与使用清单》' }));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/(app)/settings/legal/personal-info');
    fireEvent.click(screen.getByRole('link', { name: '《第三方共享清单》' }));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/(app)/settings/legal/third-party');
    unmount();

    render(<PersonalInfoListScreen />);
    expect(screen.getByText(/法务团队定稿后填入/)).toBeTruthy();
    cleanup();

    render(<ThirdPartyShareListScreen />);
    expect(screen.getByText(/法务团队定稿后填入/)).toBeTruthy();
  });

  it('退出登录全流 happy: Alert 确定 → logoutAll → router.replace login', async () => {
    mockAlertAlert.mockImplementationOnce((_t, _m, buttons) => buttons?.[1]?.onPress?.());
    mockLogoutAll.mockResolvedValue(undefined);

    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    await Promise.resolve();
    await Promise.resolve();

    expect(mockLogoutAll).toHaveBeenCalledOnce();
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('退出登录全流 server fail: best-effort still router.replace login (SC-010)', async () => {
    mockAlertAlert.mockImplementationOnce((_t, _m, buttons) => buttons?.[1]?.onPress?.());
    mockLogoutAll.mockRejectedValue(new Error('503'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    await Promise.resolve();
    await Promise.resolve();

    expect(mockLogoutAll).toHaveBeenCalledOnce();
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
    warnSpy.mockRestore();
  });
});

describe('SC-005 anti-enumeration — static grep on settings source', () => {
  // Resolve from the test file location: vitest cwd is apps/native, but __dirname
  // is the file's directory. Use path.resolve from __dirname 4 hops up to native.
  const SETTINGS_DIR = path.resolve(process.cwd(), 'app/(app)/settings');

  function readAllSourceFiles(dir: string): string {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let content = '';
    for (const f of files) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (f.name === '__tests__') continue;
        content += readAllSourceFiles(full);
      } else if (f.isFile() && /\.tsx?$/.test(f.name)) {
        content += fs.readFileSync(full, 'utf8');
      }
    }
    return content;
  }

  const allSrc = readAllSourceFiles(SETTINGS_DIR);

  it('no accountId rendering — settings/* source contains no <Text>{accountId}</Text>-style leak', () => {
    // Allow 'accountId' as identifier in mocks / test setup, but not in source
    // since this scope is non-test files. Static check: should NOT appear at all.
    expect(allSrc).not.toMatch(/accountId/);
  });

  it('no clear-text 7+ digit run in source (mask values use **** for the middle)', () => {
    // Allowed: country code prefixes (+86 / +1 / etc. — single-digit or 2-3 digit at file head).
    // Disallowed: any literal digit run ≥ 7 (account id / raw phone leak).
    expect(allSrc).not.toMatch(/\d{7,}/);
  });

  it('no packages/ui import (per spec FR-013 PHASE 1 不抽组件)', () => {
    expect(allSrc).not.toMatch(/from\s+['"]@nvy\/ui['"]/);
  });

  it('no inline hex / px literal (per SC-003 占位 UI 无视觉决策)', () => {
    // Allow: opacity numeric literal (0.5 占位常量) / "color: 'blue'" (footer 占位标记).
    // Disallow: hex (#abc / #abcdef) / px literal in source.
    expect(allSrc).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(allSrc).not.toMatch(/\b\d+px\b/);
  });
});
