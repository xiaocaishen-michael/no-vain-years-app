import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks (hoisted so vi.mock factories can reference them) ---

const { mockDisplayName, mockRouterPush } = vi.hoisted(() => ({
  mockDisplayName: vi.fn<() => string | null>(() => null),
  mockRouterPush: vi.fn<(route: string) => void>(),
}));

vi.mock('@nvy/auth', () => ({
  useAuthStore: (selector: (state: { displayName: string | null }) => unknown) =>
    selector({ displayName: mockDisplayName() }),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('react-native-safe-area-context', async () => {
  const React = (await import('react')).default;
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
  };
});

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
  }: {
    children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { disabled?: boolean; selected?: boolean };
  }) => {
    const disabled = accessibilityState?.disabled ?? false;
    // Map RN accessibilityRole to ARIA role; 'imagebutton' is RN-only so collapse to 'button'.
    const ariaRole = accessibilityRole === 'imagebutton' ? 'button' : accessibilityRole;
    return createElement(
      'button',
      {
        onClick: disabled ? undefined : onPress,
        'aria-label': accessibilityLabel,
        'aria-disabled': disabled || undefined,
        'aria-selected': accessibilityState?.selected,
        disabled: disabled || undefined,
        role: ariaRole,
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );
  };

  return { Text, View, ScrollView, Pressable };
});

// SVG glyphs render inert (visual-only); business assertions use a11y selectors on
// outer Pressables, never on inner SVG nodes.
vi.mock('react-native-svg', async () => {
  const React = (await import('react')).default;
  const inert = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('svg', null, children);
  return {
    default: inert,
    Svg: inert,
    Rect: inert,
    Circle: inert,
    G: inert,
    Path: inert,
    Line: inert,
    Polyline: inert,
    Defs: inert,
    LinearGradient: inert,
    Stop: inert,
  };
});

// Reanimated underline animation: shared/animated style hooks return inert values;
// Animated.View renders as a div so it appears in the tree without breaking layout.
vi.mock('react-native-reanimated', async () => {
  const React = (await import('react')).default;
  const View = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return {
    default: { View, createAnimatedComponent: <T,>(C: T) => C },
    useSharedValue: <T,>(v: T) => ({ value: v }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    withTiming: <T,>(v: T) => v,
    Easing: { out: () => () => 0, cubic: 0 },
  };
});

// --- Tests ---

import React from 'react';
import ProfileScreen from '../profile';

describe('ProfileScreen (spec my-profile T5/T6 / FR-004-009 / FR-014 / FR-018 + PHASE 2)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockDisplayName.mockReturnValue(null);
    mockRouterPush.mockClear();
  });

  describe('Hero area', () => {
    it('renders displayName from store', () => {
      mockDisplayName.mockReturnValue('小明');
      render(<ProfileScreen />);
      expect(screen.getByText('小明')).toBeTruthy();
    });

    it('shows fallback when displayName is null', () => {
      mockDisplayName.mockReturnValue(null);
      render(<ProfileScreen />);
      expect(screen.getByText('未命名')).toBeTruthy();
    });

    it('shows placeholder follower and fan counts (per FR-007)', () => {
      render(<ProfileScreen />);
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('关注')).toBeTruthy();
      expect(screen.getByText('12')).toBeTruthy();
      expect(screen.getByText('粉丝')).toBeTruthy();
    });

    it('renders avatar initial from displayName (first grapheme)', () => {
      mockDisplayName.mockReturnValue('小明');
      render(<ProfileScreen />);
      expect(screen.getByText('小')).toBeTruthy();
    });

    it('falls back to 👤 emoji when displayName is null', () => {
      mockDisplayName.mockReturnValue(null);
      render(<ProfileScreen />);
      expect(screen.getByText('👤')).toBeTruthy();
    });
  });

  describe('Top nav', () => {
    it('pushes settings route when ⚙️ is pressed', () => {
      render(<ProfileScreen />);
      fireEvent.click(screen.getByRole('button', { name: '设置' }));
      expect(mockRouterPush).toHaveBeenCalledOnce();
      expect(mockRouterPush).toHaveBeenCalledWith('/(app)/settings');
    });

    it('does nothing when disabled ≡ menu is pressed', () => {
      render(<ProfileScreen />);
      const menuBtn = screen.getByRole('button', { name: '菜单' }) as HTMLButtonElement;
      expect(menuBtn.disabled).toBe(true);
      fireEvent.click(menuBtn);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does nothing when disabled 🔍 search is pressed', () => {
      render(<ProfileScreen />);
      const searchBtn = screen.getByRole('button', { name: '搜索' }) as HTMLButtonElement;
      expect(searchBtn.disabled).toBe(true);
      fireEvent.click(searchBtn);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('SlideTabs state machine (T6 / FR-008 / FR-009 / FR-014 / SC-003)', () => {
    it('renders notes content by default', () => {
      render(<ProfileScreen />);
      expect(screen.getByText('笔记内容即将推出')).toBeTruthy();
    });

    it('switches to graph content when 图谱 tab is pressed', () => {
      render(<ProfileScreen />);
      fireEvent.click(screen.getByRole('tab', { name: '图谱' }));
      expect(screen.getByText('图谱内容即将推出')).toBeTruthy();
    });

    it('switches to kb content when 知识库 tab is pressed', () => {
      render(<ProfileScreen />);
      fireEvent.click(screen.getByRole('tab', { name: '知识库' }));
      expect(screen.getByText('知识库内容即将推出')).toBeTruthy();
    });

    it('switches back to notes after navigating away', () => {
      render(<ProfileScreen />);
      fireEvent.click(screen.getByRole('tab', { name: '图谱' }));
      fireEvent.click(screen.getByRole('tab', { name: '笔记' }));
      expect(screen.getByText('笔记内容即将推出')).toBeTruthy();
    });

    it('repeated press on same tab has no side effect', () => {
      render(<ProfileScreen />);
      const notesBtn = screen.getByRole('tab', { name: '笔记' });
      fireEvent.click(notesBtn);
      fireEvent.click(notesBtn);
      expect(screen.getByText('笔记内容即将推出')).toBeTruthy();
    });
  });

  describe('SC-006 anti-enum', () => {
    it('renders no 4+ digit run (account id must not leak)', () => {
      render(<ProfileScreen />);
      // Allowed numeric placeholders: 5 (following) / 12 (followers) — both ≤ 2 digits.
      // Any 4+ consecutive digit run would be an account id leak.
      const allText = document.body.textContent ?? '';
      expect(allText).not.toMatch(/\d{4,}/);
    });
  });
});
