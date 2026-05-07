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

import LegalLayout from '../_layout';

describe('LegalLayout (spec account-settings-shell T8)', () => {
  beforeEach(() => {
    capturedScreens.length = 0;
    Object.keys(capturedGlobalOptions).forEach((k) => delete capturedGlobalOptions[k]);
  });

  it('sets headerShown: true in global screenOptions', () => {
    render(<LegalLayout />);
    expect(capturedGlobalOptions['headerShown']).toBe(true);
  });

  it('registers personal-info screen with full title', () => {
    render(<LegalLayout />);
    const p = capturedScreens.find((s) => s.name === 'personal-info');
    expect(p).toBeDefined();
    expect(p?.options['title']).toBe('《个人信息收集与使用清单》');
  });

  it('registers third-party screen with full title', () => {
    render(<LegalLayout />);
    const t = capturedScreens.find((s) => s.name === 'third-party');
    expect(t).toBeDefined();
    expect(t?.options['title']).toBe('《第三方共享清单》');
  });
});
