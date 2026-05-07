import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn<(href: string) => void>(),
  routerBack: vi.fn(),
  routerCanGoBack: vi.fn(() => true),
  useLoginForm: vi.fn(),
  clearFrozenModal: vi.fn(),
  showPlaceholderToast: vi.fn(),
  clearError: vi.fn(),
  requestSms: vi.fn(),
  submit: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    back: mocks.routerBack,
    canGoBack: mocks.routerCanGoBack,
  }),
}));

vi.mock('../../../lib/hooks/use-login-form', () => ({
  useLoginForm: () => mocks.useLoginForm(),
}));

// @nvy/ui components: minimal stubs that render label + onPress.
vi.mock('@nvy/ui', async () => {
  const React = (await import('react')).default;
  const stub =
    (name: string) =>
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('span', { 'data-stub': name, ...props }, children);
  return {
    AppleButton: stub('AppleButton'),
    ErrorRow: ({ text }: { text: string }) => React.createElement('span', null, text),
    GoogleButton: stub('GoogleButton'),
    LogoMark: stub('LogoMark'),
    PhoneInput: ({ value }: { value: string }) =>
      React.createElement('input', { 'aria-label': 'phone-input', value, readOnly: true }),
    PrimaryButton: ({
      label,
      onPress,
      disabled,
    }: {
      label: string;
      onPress?: () => void;
      disabled?: boolean;
    }) =>
      React.createElement(
        'button',
        { 'aria-label': 'primary', onClick: disabled ? undefined : onPress, disabled },
        label,
      ),
    SmsInput: ({ value }: { value: string }) =>
      React.createElement('input', { 'aria-label': 'sms-input', value, readOnly: true }),
    Spinner: stub('Spinner'),
    SuccessCheck: stub('SuccessCheck'),
    WechatButton: stub('WechatButton'),
  };
});

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const createElement = React.createElement;
  const Text = ({ children }: { children?: React.ReactNode }) =>
    createElement('span', null, children);
  const View = ({ children }: { children?: React.ReactNode }) =>
    createElement('div', null, children);
  const Pressable = ({
    children,
    onPress,
    accessibilityLabel,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
  }) => createElement('button', { onClick: onPress, 'aria-label': accessibilityLabel }, children);
  type ModalProps = {
    children?: React.ReactNode;
    visible?: boolean;
    accessibilityLabel?: string;
    onRequestClose?: () => void;
  };
  const Modal = ({ children, visible, accessibilityLabel, onRequestClose }: ModalProps) =>
    visible
      ? createElement(
          'div',
          {
            'aria-label': accessibilityLabel,
            'data-on-request-close': onRequestClose ? 'true' : 'false',
          },
          children,
        )
      : null;
  const Platform = { OS: 'web' };
  return { Text, View, Pressable, Modal, Platform };
});

import LoginScreen from '../login';

const baseFormState = {
  state: 'idle' as const,
  errorToast: null,
  errorScope: null,
  smsCountdown: 0,
  showFrozenModal: false,
  clearFrozenModal: mocks.clearFrozenModal,
  requestSms: mocks.requestSms,
  submit: mocks.submit,
  showPlaceholderToast: mocks.showPlaceholderToast,
  clearError: mocks.clearError,
};

describe('LoginScreen — freeze modal (spec C T6 / US4 acceptance 2-4 / FR-011 / FR-012)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) {
        (m as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    mocks.routerCanGoBack.mockReturnValue(true);
  });
  afterEach(() => cleanup());

  it('does not render modal when showFrozenModal === false', () => {
    mocks.useLoginForm.mockReturnValue(baseFormState);
    render(<LoginScreen />);
    expect(screen.queryByLabelText('freeze-modal')).toBeNull();
  });

  it('US4-2: renders modal with description + 2 buttons when showFrozenModal === true', () => {
    mocks.useLoginForm.mockReturnValue({ ...baseFormState, showFrozenModal: true });
    render(<LoginScreen />);
    expect(screen.getByLabelText('freeze-modal')).toBeTruthy();
    expect(screen.getByText(/账号处于注销冻结期/)).toBeTruthy();
    expect(screen.getByLabelText('freeze-cancel-delete')).toBeTruthy();
    expect(screen.getByLabelText('freeze-keep')).toBeTruthy();
  });

  it('US4-3 modal copy contains 冻结期 + 撤销注销 keywords (per Q3 简化文案)', () => {
    mocks.useLoginForm.mockReturnValue({ ...baseFormState, showFrozenModal: true });
    render(<LoginScreen />);
    const desc = screen.getByText(/账号处于注销冻结期/);
    expect(desc.textContent).toMatch(/冻结期/);
    expect(desc.textContent).toMatch(/撤销注销/);
  });

  it('FR-012: tap [撤销] → clearFrozenModal + router.push to cancel-deletion with phone param', () => {
    mocks.useLoginForm.mockReturnValue({ ...baseFormState, showFrozenModal: true });
    render(<LoginScreen />);
    fireEvent.click(screen.getByLabelText('freeze-cancel-delete'));
    expect(mocks.clearFrozenModal).toHaveBeenCalledTimes(1);
    expect(mocks.routerPush).toHaveBeenCalledTimes(1);
    // The form is empty in this test, so encoded phone is "+86"
    expect(mocks.routerPush).toHaveBeenCalledWith('/(auth)/cancel-deletion?phone=%2B86');
  });

  it('FR-012: tap [保持] → clearFrozenModal called (form reset is internal state)', () => {
    mocks.useLoginForm.mockReturnValue({ ...baseFormState, showFrozenModal: true });
    render(<LoginScreen />);
    fireEvent.click(screen.getByLabelText('freeze-keep'));
    expect(mocks.clearFrozenModal).toHaveBeenCalledTimes(1);
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it('Modal wires onRequestClose (Android back / scrim tap → handleKeepLogin)', () => {
    mocks.useLoginForm.mockReturnValue({ ...baseFormState, showFrozenModal: true });
    render(<LoginScreen />);
    const modal = screen.getByLabelText('freeze-modal');
    expect(modal.getAttribute('data-on-request-close')).toBe('true');
  });
});
