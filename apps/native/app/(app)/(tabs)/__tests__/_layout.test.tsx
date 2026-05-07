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

// react-native-svg renders inert in happy-dom; tabBarIcon factory only needs
// to return a valid React element when invoked.
vi.mock('react-native-svg', async () => {
  const ReactM = (await import('react')).default;
  const passthrough =
    (tag: string) =>
    ({ children }: { children?: React.ReactNode }) =>
      ReactM.createElement(tag, null, children);
  return {
    default: passthrough('svg'),
    Svg: passthrough('svg'),
    Circle: passthrough('circle'),
    G: passthrough('g'),
    Path: passthrough('path'),
  };
});

import TabsLayout from '../_layout';

describe('TabsLayout (spec my-profile T2 / FR-001 / FR-012 / CL-003 + PHASE 2 mockup)', () => {
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

  it('has tabBarIcon function on each screen (per PHASE 2 mockup translation)', () => {
    render(<TabsLayout />);
    capturedScreens.forEach((s) => {
      expect(typeof s.options['tabBarIcon']).toBe('function');
    });
  });

  it('tabBarIcon factory returns a React element when invoked', () => {
    render(<TabsLayout />);
    const profileScreen = capturedScreens.find((s) => s.name === 'profile');
    const iconFactory = profileScreen?.options['tabBarIcon'] as
      | ((p: { color: string; focused: boolean }) => React.ReactElement | null)
      | undefined;
    const el = iconFactory?.({ color: '#000', focused: true });
    expect(el).toBeTruthy();
    expect(React.isValidElement(el)).toBe(true);
  });

  it('sets headerShown: false in global screenOptions (per FR-012)', () => {
    render(<TabsLayout />);
    expect(capturedGlobalOptions['headerShown']).toBe(false);
  });

  it('sets brand-500 active and ink-subtle inactive tint colors', () => {
    render(<TabsLayout />);
    expect(capturedGlobalOptions['tabBarActiveTintColor']).toBe('#2456E5');
    expect(capturedGlobalOptions['tabBarInactiveTintColor']).toBe('#999999');
  });
});
