import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRouterPush, mockPhone } = vi.hoisted(() => ({
  mockRouterPush: vi.fn<(route: string) => void>(),
  mockPhone: vi.fn<() => string | null>(() => null),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@nvy/auth', () => ({
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
    style,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { disabled?: boolean };
    style?: { opacity?: number };
  }) => {
    const isDisabled = accessibilityState?.disabled ?? false;
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
  return { Text, View, ScrollView, Pressable };
});

import AccountSecurityIndex from '../index';

describe('AccountSecurityIndex (spec account-settings-shell T6 / FR-007 + FR-018 + Q4)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockRouterPush.mockClear();
    mockPhone.mockReturnValue(null);
  });

  it('renders Card 1 — 手机号 entry + 实名认证 disabled + 第三方账号绑定 disabled', () => {
    render(<AccountSecurityIndex />);
    expect(screen.getByRole('button', { name: '手机号' })).toBeTruthy();
    const realname = screen.getByRole('button', { name: '实名认证' }) as HTMLButtonElement;
    expect(realname.disabled).toBe(true);
    const thirdParty = screen.getByRole('button', {
      name: '第三方账号绑定',
    }) as HTMLButtonElement;
    expect(thirdParty.disabled).toBe(true);
  });

  it('renders Card 2 — 登录管理 enabled (T14)', () => {
    render(<AccountSecurityIndex />);
    const btn = screen.getByRole('button', {
      name: '登录管理',
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('renders Card 3 — 注销账号 entry + 安全小知识 disabled', () => {
    render(<AccountSecurityIndex />);
    expect(screen.getByRole('button', { name: '注销账号' })).toBeTruthy();
    const tips = screen.getByRole('button', { name: '安全小知识' }) as HTMLButtonElement;
    expect(tips.disabled).toBe(true);
  });

  it('renders maskPhone(store.phone) when phone !== null', () => {
    mockPhone.mockReturnValue('+8613812345678');
    render(<AccountSecurityIndex />);
    expect(screen.getByText('+86 138****5678')).toBeTruthy();
  });

  it('renders 未绑定 fallback when store.phone === null', () => {
    mockPhone.mockReturnValue(null);
    render(<AccountSecurityIndex />);
    expect(screen.getByText('未绑定')).toBeTruthy();
  });

  it('tap 手机号 → router.push phone detail', () => {
    render(<AccountSecurityIndex />);
    fireEvent.click(screen.getByRole('button', { name: '手机号' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/settings/account-security/phone');
  });

  it('tap 注销账号 → router.push delete-account (spec C 占位)', () => {
    render(<AccountSecurityIndex />);
    fireEvent.click(screen.getByRole('button', { name: '注销账号' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/settings/account-security/delete-account');
  });

  it('disabled tap (实名认证) → no router call', () => {
    render(<AccountSecurityIndex />);
    fireEvent.click(screen.getByRole('button', { name: '实名认证' }));
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('SC-005 anti-enum: no accountId / no 7+ digit run / no 🎧 customer-service icon', () => {
    mockPhone.mockReturnValue('+8613812345678');
    render(<AccountSecurityIndex />);
    const allText = document.body.textContent ?? '';
    // mask renders +86 138****5678; no 7+ consecutive digit clear-text leak.
    // (the country code "8613812345678" raw form would be a leak, masked is OK)
    expect(allText).not.toMatch(/\d{7,}/);
    expect(allText).not.toContain('🎧');
  });
});
