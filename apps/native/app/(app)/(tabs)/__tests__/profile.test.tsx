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
    accessibilityState,
  }: {
    children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityState?: { disabled?: boolean; selected?: boolean };
  }) => {
    const disabled = accessibilityState?.disabled ?? false;
    return createElement(
      'button',
      {
        onClick: disabled ? undefined : onPress,
        'aria-label': accessibilityLabel,
        'aria-disabled': disabled || undefined,
        disabled: disabled || undefined,
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );
  };

  return { Text, View, ScrollView, Pressable };
});

// --- Tests ---

import React from 'react';
import ProfileScreen from '../profile';

describe('ProfileScreen (spec my-profile T5/T6 / FR-004-009 / FR-014 / FR-018)', () => {
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
      expect(screen.getByText('5 关注')).toBeTruthy();
      expect(screen.getByText('12 粉丝')).toBeTruthy();
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
      fireEvent.click(screen.getByRole('button', { name: '图谱' }));
      expect(screen.getByText('图谱内容即将推出')).toBeTruthy();
    });

    it('switches to kb content when 知识库 tab is pressed', () => {
      render(<ProfileScreen />);
      fireEvent.click(screen.getByRole('button', { name: '知识库' }));
      expect(screen.getByText('知识库内容即将推出')).toBeTruthy();
    });

    it('switches back to notes after navigating away', () => {
      render(<ProfileScreen />);
      fireEvent.click(screen.getByRole('button', { name: '图谱' }));
      fireEvent.click(screen.getByRole('button', { name: '笔记' }));
      expect(screen.getByText('笔记内容即将推出')).toBeTruthy();
    });

    it('repeated press on same tab has no side effect', () => {
      render(<ProfileScreen />);
      const notesBtn = screen.getByRole('button', { name: '笔记' });
      fireEvent.click(notesBtn);
      fireEvent.click(notesBtn);
      expect(screen.getByText('笔记内容即将推出')).toBeTruthy();
    });
  });

  describe('SC-006 anti-enum', () => {
    it('renders no raw numeric-only text (account id must not leak)', () => {
      render(<ProfileScreen />);
      // Only digit-only strings would be an accidental id leak.
      // '5 关注' / '12 粉丝' contain non-digit chars so they pass.
      const allText = document.body.textContent ?? '';
      // Remove known placeholder numbers embedded in Chinese strings
      const stripped = allText.replace(/\d+ 关注|\d+ 粉丝/g, '');
      expect(stripped).not.toMatch(/^\d+$/m);
    });
  });
});
