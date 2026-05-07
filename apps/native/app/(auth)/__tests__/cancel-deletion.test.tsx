import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useLocalSearchParams: vi.fn<() => { phone?: string }>(),
  setParams: vi.fn<(params: { phone?: string | undefined }) => void>(),
  routerReplace: vi.fn<(href: string) => void>(),
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => mocks.useLocalSearchParams(),
  useRouter: () => ({ setParams: mocks.setParams, replace: mocks.routerReplace }),
}));

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const createElement = React.createElement;
  const Text = ({ children }: { children?: React.ReactNode }) =>
    createElement('span', null, children);
  const View = ({ children }: { children?: React.ReactNode }) =>
    createElement('div', null, children);
  const TextInput = ({
    value,
    placeholder,
    editable,
    accessibilityLabel,
    maxLength,
    onChangeText,
  }: {
    value?: string;
    placeholder?: string;
    editable?: boolean;
    accessibilityLabel?: string;
    maxLength?: number;
    onChangeText?: (t: string) => void;
  }) =>
    createElement('input', {
      value: value ?? '',
      placeholder,
      disabled: editable === false || undefined,
      'aria-label': accessibilityLabel,
      maxLength,
      onChange: (e: { target: { value: string } }) => {
        if (onChangeText) onChangeText(e.target.value);
      },
    });
  const Pressable = ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityState,
    style,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityState?: { disabled?: boolean; busy?: boolean };
    style?: { opacity?: number };
  }) => {
    const isDisabled = accessibilityState?.disabled ?? false;
    return createElement(
      'button',
      {
        onClick: isDisabled ? undefined : onPress,
        'aria-label': accessibilityLabel,
        'aria-disabled': isDisabled || undefined,
        'aria-busy': accessibilityState?.busy || undefined,
        disabled: isDisabled || undefined,
        'data-opacity': style?.opacity,
      },
      children,
    );
  };
  return { Text, View, TextInput, Pressable };
});

import CancelDeletionScreen from '../cancel-deletion';

describe('CancelDeletionScreen — IDLE state render (spec C T7 / FR-013 / FR-022)', () => {
  beforeEach(() => {
    mocks.useLocalSearchParams.mockReset();
    mocks.setParams.mockReset();
    mocks.routerReplace.mockReset();
  });
  afterEach(() => cleanup());

  it('renders description text', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);
    expect(screen.getByText(/请通过手机号验证码撤销注销/)).toBeTruthy();
  });

  it('FR-013: with phone param → input read-only + maskPhone displayed + setParams clears param', () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613812345678' });
    render(<CancelDeletionScreen />);

    const input = screen.getByLabelText('phone-input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.value).toBe('+86 138****5678');

    expect(mocks.setParams).toHaveBeenCalledTimes(1);
    expect(mocks.setParams).toHaveBeenCalledWith({ phone: undefined });
  });

  it('FR-013: without phone param → input editable + empty default + setParams NOT called', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);

    const input = screen.getByLabelText('phone-input') as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(input.value).toBe('');
    expect(mocks.setParams).not.toHaveBeenCalled();
  });

  it('FR-013: empty phone param → treated as no param (input editable, no setParams)', () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '' });
    render(<CancelDeletionScreen />);

    const input = screen.getByLabelText('phone-input') as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(mocks.setParams).not.toHaveBeenCalled();
  });

  it('FR-022 anti-leak: rendered HTML has no hex / px literals', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).not.toMatch(/\d+px\b/);
  });

  it('IDLE: send-code disabled when phone empty', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBe('true');
  });

  it('IDLE: code input disabled (hasSentCode === false)', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);
    expect((screen.getByLabelText('code-input') as HTMLInputElement).disabled).toBe(true);
  });

  it('IDLE: submit disabled', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);
    expect(screen.getByLabelText('submit').getAttribute('aria-disabled')).toBe('true');
  });
});
