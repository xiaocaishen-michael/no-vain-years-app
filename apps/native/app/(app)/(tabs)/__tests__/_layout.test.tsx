import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ScreenConfig = { name: string; options: Record<string, unknown> };

// vi.hoisted so these variables are accessible inside the hoisted vi.mock factory.
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

  const MockTabs = ({
    children,
    screenOptions = {},
  }: {
    children: React.ReactNode;
    screenOptions?: Record<string, unknown>;
  }) => {
    Object.assign(capturedGlobalOptions, screenOptions);
    return <>{children}</>;
  };
  MockTabs.Screen = MockScreen;

  return { Tabs: MockTabs };
});

import TabsLayout from '../_layout';

describe('TabsLayout (spec my-profile T2 / FR-001 / FR-012 / CL-003)', () => {
  beforeEach(() => {
    capturedScreens.length = 0;
    Object.keys(capturedGlobalOptions).forEach((k) => delete capturedGlobalOptions[k]);
  });

  it('registers exactly 4 Screens', () => {
    render(<TabsLayout />);
    expect(capturedScreens).toHaveLength(4);
  });

  it('registers screens in order: index, search, pkm, profile', () => {
    render(<TabsLayout />);
    expect(capturedScreens.map((s) => s.name)).toEqual(['index', 'search', 'pkm', 'profile']);
  });

  it('sets correct Chinese tabBarLabels', () => {
    render(<TabsLayout />);
    expect(capturedScreens.map((s) => s.options['tabBarLabel'])).toEqual([
      '首页',
      '搜索',
      '外脑',
      '我的',
    ]);
  });

  it('has no tabBarIcon on any screen (per SC-008)', () => {
    render(<TabsLayout />);
    capturedScreens.forEach((s) => {
      expect(s.options['tabBarIcon']).toBeUndefined();
    });
  });

  it('sets headerShown: false in global screenOptions (per FR-012)', () => {
    render(<TabsLayout />);
    expect(capturedGlobalOptions['headerShown']).toBe(false);
  });
});
