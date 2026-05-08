import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ScreenConfig = { name: string; options: Record<string, unknown> };

const { capturedScreens, capturedGlobalOptions } = vi.hoisted(() => ({
  capturedScreens: [] as ScreenConfig[],
  capturedGlobalOptions: {} as Record<string, unknown>,
}));

vi.mock('expo-router', () => {
  const MockScreen = ({
    name,
    options = {},
  }: {
    name: string;
    options?: Record<string, unknown>;
  }) => {
    capturedScreens.push({ name, options });
    return null;
  };

  const MockStack = ({
    children,
    screenOptions = {},
  }: {
    children: React.ReactNode;
    screenOptions?: Record<string, unknown>;
  }) => {
    Object.assign(capturedGlobalOptions, screenOptions);
    return <>{children}</>;
  };
  MockStack.Screen = MockScreen;

  return { Stack: MockStack };
});

import AccountSecurityLayout from '../_layout';

describe('AccountSecurityLayout (spec account-settings-shell T6)', () => {
  beforeEach(() => {
    capturedScreens.length = 0;
    Object.keys(capturedGlobalOptions).forEach((k) => delete capturedGlobalOptions[k]);
  });

  it('sets headerShown: true in global screenOptions', () => {
    render(<AccountSecurityLayout />);
    expect(capturedGlobalOptions['headerShown']).toBe(true);
  });

  it('registers index screen with title 账号与安全', () => {
    render(<AccountSecurityLayout />);
    const idx = capturedScreens.find((s) => s.name === 'index');
    expect(idx).toBeDefined();
    expect(idx?.options['title']).toBe('账号与安全');
  });

  it('registers phone screen with title 手机号', () => {
    render(<AccountSecurityLayout />);
    const phone = capturedScreens.find((s) => s.name === 'phone');
    expect(phone).toBeDefined();
    expect(phone?.options['title']).toBe('手机号');
  });

  it('registers delete-account screen with title 注销账号 (spec C T2)', () => {
    render(<AccountSecurityLayout />);
    const del = capturedScreens.find((s) => s.name === 'delete-account');
    expect(del).toBeDefined();
    expect(del?.options['title']).toBe('注销账号');
  });

  it('hides header for login-management — its nested _layout owns the header', () => {
    // login-management is a nested stack (index + [id]) with its own _layout
    // providing header titles. Without headerShown:false here the outer stack
    // would auto-register it with route name 'login-management' as title and
    // double-stack the header.
    render(<AccountSecurityLayout />);
    const lm = capturedScreens.find((s) => s.name === 'login-management');
    expect(lm).toBeDefined();
    expect(lm?.options['headerShown']).toBe(false);
  });
});
