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

import SettingsLayout from '../_layout';

describe('SettingsLayout (spec account-settings-shell T4 / FR-001 ~ FR-004)', () => {
  beforeEach(() => {
    capturedScreens.length = 0;
    Object.keys(capturedGlobalOptions).forEach((k) => delete capturedGlobalOptions[k]);
  });

  it('sets headerShown: true in global screenOptions', () => {
    render(<SettingsLayout />);
    expect(capturedGlobalOptions['headerShown']).toBe(true);
  });

  it('registers index screen with title 设置', () => {
    render(<SettingsLayout />);
    const idx = capturedScreens.find((s) => s.name === 'index');
    expect(idx).toBeDefined();
    expect(idx?.options['title']).toBe('设置');
  });

  it('registers account-security child stack (header off so child stack owns it)', () => {
    render(<SettingsLayout />);
    const sec = capturedScreens.find((s) => s.name === 'account-security');
    expect(sec).toBeDefined();
    expect(sec?.options['headerShown']).toBe(false);
  });

  it('registers legal child stack', () => {
    render(<SettingsLayout />);
    const legal = capturedScreens.find((s) => s.name === 'legal');
    expect(legal).toBeDefined();
    expect(legal?.options['headerShown']).toBe(false);
  });
});
