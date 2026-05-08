import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRouterPush, mockAlertAlert, mockLogoutAll } = vi.hoisted(() => ({
  mockRouterPush: vi.fn<(route: string) => void>(),
  mockAlertAlert: vi.fn(),
  mockLogoutAll: vi.fn<() => Promise<void>>(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
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
      },
      children,
    );
  };

  const Alert = { alert: mockAlertAlert };
  const Platform = { OS: 'ios' as 'ios' | 'android' | 'web' };

  return { Text, View, ScrollView, Pressable, Alert, Platform };
});

import SettingsIndex from '../index';

describe('SettingsIndex (spec account-settings-shell T4 / FR-001 ~ FR-006)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockRouterPush.mockClear();
    mockAlertAlert.mockClear();
    mockLogoutAll.mockClear();
  });

  it('renders Card 1 — 账号与安全 entry', () => {
    render(<SettingsIndex />);
    expect(screen.getByRole('button', { name: '账号与安全' })).toBeTruthy();
  });

  it('renders Card 2 — 4 disabled placeholders (通用 / 通知 / 隐私与权限 / 关于)', () => {
    render(<SettingsIndex />);
    ['通用', '通知', '隐私与权限', '关于'].forEach((label) => {
      const btn = screen.getByRole('button', { name: label }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  it('renders Card 3 — 切换账号 (disabled) + 退出登录 (enabled)', () => {
    render(<SettingsIndex />);
    const switchAcc = screen.getByRole('button', { name: '切换账号' }) as HTMLButtonElement;
    expect(switchAcc.disabled).toBe(true);
    const logout = screen.getByRole('button', { name: '退出登录' }) as HTMLButtonElement;
    expect(logout.disabled).toBe(false);
  });

  it('renders Footer 双链接 (个人信息 + 第三方)', () => {
    render(<SettingsIndex />);
    expect(screen.getByRole('link', { name: '《个人信息收集与使用清单》' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '《第三方共享清单》' })).toBeTruthy();
  });

  it('tap 账号与安全 → router.push account-security', () => {
    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '账号与安全' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/settings/account-security');
  });

  it('tap 《个人信息...》 → router.push legal/personal-info', () => {
    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('link', { name: '《个人信息收集与使用清单》' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/settings/legal/personal-info');
  });

  it('tap 《第三方...》 → router.push legal/third-party', () => {
    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('link', { name: '《第三方共享清单》' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/settings/legal/third-party');
  });

  it('tap 退出登录 → Alert.alert called with confirm dialog', () => {
    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    expect(mockAlertAlert).toHaveBeenCalledOnce();
    const [title, message, buttons] = mockAlertAlert.mock.calls[0] as [
      string,
      undefined,
      Array<{ text: string }>,
    ];
    expect(title).toBe('确定要退出登录?');
    expect(message).toBeUndefined();
    expect(buttons.map((b) => b.text)).toEqual(['取消', '确定']);
  });

  it('disabled tap (通用) → no router call', () => {
    render(<SettingsIndex />);
    fireEvent.click(screen.getByRole('button', { name: '通用' }));
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
