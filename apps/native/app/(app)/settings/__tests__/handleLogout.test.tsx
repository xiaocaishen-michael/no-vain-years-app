import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRouterReplace, mockAlertAlert, mockLogoutAll, mockConsoleWarn } = vi.hoisted(() => ({
  mockRouterReplace: vi.fn<(route: string) => void>(),
  mockAlertAlert:
    vi.fn<
      (
        title: string,
        message: string | undefined,
        buttons?: Array<{ text: string; style?: string; onPress?: () => void }>,
      ) => void
    >(),
  mockLogoutAll: vi.fn<() => Promise<void>>(),
  mockConsoleWarn: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockRouterReplace }),
}));

vi.mock('@nvy/auth', () => ({
  logoutAll: mockLogoutAll,
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
    style,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { disabled?: boolean; busy?: boolean };
    disabled?: boolean;
    style?: { opacity?: number };
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
        'data-opacity': style?.opacity,
        'data-busy': accessibilityState?.busy ?? undefined,
      },
      children,
    );
  };
  const Alert = { alert: mockAlertAlert };
  return { Text, View, ScrollView, Pressable, Alert };
});

import SettingsIndex from '../index';

// Helper: simulates 用户点 Alert 的 "确定" 按钮 (index 1; index 0 = 取消).
function pressConfirm() {
  mockAlertAlert.mockImplementationOnce((_title, _msg, buttons) => {
    buttons?.[1]?.onPress?.();
  });
}

function pressCancel() {
  mockAlertAlert.mockImplementationOnce((_title, _msg, buttons) => {
    buttons?.[0]?.onPress?.();
  });
}

describe('handleLogout flow (spec account-settings-shell T5 / FR-005 + FR-019 + plan 决策 2 + 9)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockRouterReplace.mockClear();
    mockAlertAlert.mockClear();
    mockLogoutAll.mockReset();
    mockConsoleWarn.mockClear();
    vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
  });

  it('happy: Alert 确定 → logoutAll → router.replace login', async () => {
    pressConfirm();
    mockLogoutAll.mockResolvedValue(undefined);

    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await Promise.resolve();
    await Promise.resolve();

    expect(mockLogoutAll).toHaveBeenCalledOnce();
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('user 点 取消 → logoutAll 不调用 + router 不变', () => {
    pressCancel();

    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    expect(mockLogoutAll).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('server fail (logoutAll throws) → best-effort: console.warn + router.replace 仍调用', async () => {
    pressConfirm();
    mockLogoutAll.mockRejectedValue(new Error('503 Service Unavailable'));

    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await Promise.resolve();
    await Promise.resolve();

    expect(mockLogoutAll).toHaveBeenCalledOnce();
    expect(mockConsoleWarn).toHaveBeenCalledWith('[settings] logoutAll failed', expect.any(Error));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('race guard: logoutAll pending 期间 button disabled,二次 click 不再触发 Alert', async () => {
    pressConfirm();
    let resolveLogout: () => void = () => undefined;
    mockLogoutAll.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      }),
    );

    render(<SettingsIndex />);

    // 第 1 次 click → Alert + 确定 onPress → logoutAll pending → setIsLoading(true) flush
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    await Promise.resolve();

    // 第 2 次 click(button 已 disabled,onClick 设 undefined,所以 confirmLogout 不应被调用)
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    expect(mockAlertAlert).toHaveBeenCalledOnce();
    expect(mockLogoutAll).toHaveBeenCalledOnce();

    resolveLogout();
  });

  it('disabled 视觉: logoutAll pending 期间 退出登录 button data-busy=true + opacity=0.5', async () => {
    pressConfirm();
    let resolveLogout: () => void = () => undefined;
    mockLogoutAll.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      }),
    );

    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    await Promise.resolve();

    const btn = screen.getByRole('button', { name: '退出登录' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('data-busy')).toBe('true');
    expect(btn.getAttribute('data-opacity')).toBe('0.5');

    resolveLogout();
  });
});
