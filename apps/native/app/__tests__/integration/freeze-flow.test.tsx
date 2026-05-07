/**
 * Integration tests for the freeze-flow business path (spec C T10).
 *
 * Path: (auth)/login → freeze-modal → router.push '/(auth)/cancel-deletion?phone=…'
 *       → (auth)/cancel-deletion (with phone param) → submit → router.replace '/(app)/(tabs)'
 *
 * Strategy mirrors account-settings-shell-flow.test.tsx: sequential mount of
 * each route + assert router push/replace targets and inter-screen state
 * passing (phone param decoded + setParams undefined per FR-022). Not a real
 * Stack navigation (vitest/happy-dom 不支持 Expo Router 真栈) — Playwright
 * smoke (T11) covers actual stack pop / URL bar.
 *
 * Plus SC-008 anti-enum static grep: cancel-deletion source must not contain
 * "未注册" / "已匿名化" / status-distinguishing copy that could leak account
 * state through differential UI.
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn<(href: string) => void>(),
  routerReplace: vi.fn<(href: string) => void>(),
  routerBack: vi.fn(),
  routerCanGoBack: vi.fn(() => true),
  setParams: vi.fn<(p: { phone?: string | undefined }) => void>(),
  useLocalSearchParams: vi.fn<() => { phone?: string }>(),
  useLoginForm: vi.fn(),
  clearFrozenModal: vi.fn(),
  showPlaceholderToast: vi.fn(),
  clearError: vi.fn(),
  requestSms: vi.fn(),
  loginSubmit: vi.fn(),
  requestCancelDeletionSmsCode: vi.fn(),
  cancelDeletion: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    replace: mocks.routerReplace,
    back: mocks.routerBack,
    canGoBack: mocks.routerCanGoBack,
    setParams: mocks.setParams,
  }),
  useLocalSearchParams: () => mocks.useLocalSearchParams(),
}));

vi.mock('../../../lib/hooks/use-login-form', () => ({
  useLoginForm: () => mocks.useLoginForm(),
}));

vi.mock('@nvy/auth', () => ({
  requestCancelDeletionSmsCode: mocks.requestCancelDeletionSmsCode,
  cancelDeletion: mocks.cancelDeletion,
}));

vi.mock('@nvy/ui', async () => {
  const React = (await import('react')).default;
  const stub =
    () =>
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement('span', null, children);
  return {
    AppleButton: stub(),
    ErrorRow: ({ text }: { text: string }) => React.createElement('span', null, text),
    GoogleButton: stub(),
    LogoMark: stub(),
    PhoneInput: ({ value }: { value: string }) =>
      React.createElement('input', { 'aria-label': 'login-phone', value, readOnly: true }),
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
        { 'aria-label': 'login-primary', onClick: disabled ? undefined : onPress, disabled },
        label,
      ),
    SmsInput: ({ value }: { value: string }) =>
      React.createElement('input', { 'aria-label': 'login-sms', value, readOnly: true }),
    Spinner: stub(),
    SuccessCheck: stub(),
    WechatButton: stub(),
  };
});

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const createElement = React.createElement;
  const Text = ({ children }: { children?: React.ReactNode }) =>
    createElement('span', null, children);
  const View = ({ children }: { children?: React.ReactNode }) =>
    createElement('div', null, children);
  const TextInput = ({
    value,
    accessibilityLabel,
    editable,
    maxLength,
    onChangeText,
  }: {
    value?: string;
    accessibilityLabel?: string;
    editable?: boolean;
    maxLength?: number;
    onChangeText?: (t: string) => void;
  }) =>
    createElement('input', {
      value: value ?? '',
      'aria-label': accessibilityLabel,
      disabled: editable === false || undefined,
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
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityState?: { disabled?: boolean };
  }) => {
    const isDisabled = accessibilityState?.disabled ?? false;
    return createElement(
      'button',
      {
        onClick: isDisabled ? undefined : onPress,
        'aria-label': accessibilityLabel,
        disabled: isDisabled || undefined,
      },
      children,
    );
  };
  const Modal = ({
    children,
    visible,
    accessibilityLabel,
  }: {
    children?: React.ReactNode;
    visible?: boolean;
    accessibilityLabel?: string;
  }) => (visible ? createElement('div', { 'aria-label': accessibilityLabel }, children) : null);
  return { Text, View, TextInput, Pressable, Modal, Platform: { OS: 'web' } };
});

import LoginScreen from '../../(auth)/login';
import CancelDeletionScreen from '../../(auth)/cancel-deletion';

describe('Freeze-flow integration (spec C T10 / SC-002 / SC-009)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) {
        (m as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    mocks.routerCanGoBack.mockReturnValue(true);
  });
  afterEach(() => cleanup());

  it('SC-002 full chain: login [撤销] → push cancel-deletion?phone=… → render with phone → submit → replace home', async () => {
    // STEP 1: render login with the freeze modal already open (driven by
    // useLoginForm.showFrozenModal=true — the helper's frozen-detection path
    // is covered in use-login-form.test.ts; this test focuses on the
    // page-level handoff to cancel-deletion).
    mocks.useLoginForm.mockReturnValue({
      state: 'idle' as const,
      errorToast: null,
      errorScope: null,
      smsCountdown: 0,
      showFrozenModal: true,
      clearFrozenModal: mocks.clearFrozenModal,
      requestSms: mocks.requestSms,
      submit: mocks.loginSubmit,
      showPlaceholderToast: mocks.showPlaceholderToast,
      clearError: mocks.clearError,
    });

    const { unmount } = render(<LoginScreen />);
    expect(screen.getByLabelText('freeze-modal')).toBeTruthy();

    // tap [撤销] — should clear modal + push cancel-deletion with empty phone
    // (the LoginScreen local form is fresh so phoneE164 = '+86')
    fireEvent.click(screen.getByLabelText('freeze-cancel-delete'));
    expect(mocks.clearFrozenModal).toHaveBeenCalledTimes(1);
    expect(mocks.routerPush).toHaveBeenCalledTimes(1);
    const pushedHref = mocks.routerPush.mock.calls[0]?.[0];
    expect(pushedHref).toMatch(/^\/\(auth\)\/cancel-deletion\?phone=/);

    unmount();

    // STEP 2: render cancel-deletion as if Expo Router consumed the pushed
    // href — extract the phone param, decode, mount the screen.
    const decoded = decodeURIComponent(pushedHref!.split('phone=')[1] ?? '');
    mocks.useLocalSearchParams.mockReturnValue({ phone: decoded });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);
    mocks.cancelDeletion.mockResolvedValue({
      accountId: 7,
      accessToken: 'a',
      refreshToken: 'r',
    });

    render(<CancelDeletionScreen />);

    // FR-022: setParams cleared the URL phone immediately on mount.
    expect(mocks.setParams).toHaveBeenCalledWith({ phone: undefined });

    // STEP 3: send code → input code → submit → assert cancelDeletion called
    // with the prefilled phone + redirect home.
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    fireEvent.change(screen.getByLabelText('code-input'), { target: { value: '654321' } });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('submit'));
    });

    expect(mocks.cancelDeletion).toHaveBeenCalledTimes(1);
    expect(mocks.cancelDeletion).toHaveBeenCalledWith(decoded, '654321');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });

  it('SC-009 link integrity: deep-link path (no prior login) is identical end-state', async () => {
    // Direct mount with phone param — no login screen. Exercises the
    // independent entry point (e.g. saved bookmark, share URL).
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);
    mocks.cancelDeletion.mockResolvedValue({
      accountId: 7,
      accessToken: 'a',
      refreshToken: 'r',
    });

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    fireEvent.change(screen.getByLabelText('code-input'), { target: { value: '111111' } });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('submit'));
    });

    expect(mocks.cancelDeletion).toHaveBeenCalledWith('+8613800138000', '111111');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });
});

describe('Freeze-flow SC-008 anti-enum static grep (spec C T10)', () => {
  it('cancel-deletion source code does not contain status-distinguishing copy', () => {
    const sourcePath = path.resolve(__dirname, '../../(auth)/cancel-deletion.tsx');
    const source = fs.readFileSync(sourcePath, 'utf-8');
    // 反枚举: error toast must collapse — no "phone 未注册" / "已匿名化" /
    // "已注销" copy that could leak account state through differential UI.
    expect(source).not.toMatch(/未注册/);
    expect(source).not.toMatch(/已匿名化/);
    expect(source).not.toMatch(/已注销/);
  });

  it('cancel-deletion-errors source maps all 4xx to invalid_credentials (no per-status differentiation)', () => {
    const sourcePath = path.resolve(__dirname, '../../(auth)/cancel-deletion-errors.ts');
    const source = fs.readFileSync(sourcePath, 'utf-8');
    // The mapper logic uses status >= 400 collapse. No per-status branch
    // that hands out different kinds for 401 vs 403 vs 404.
    expect(source).toMatch(/status >= 400/);
    // Zero per-status invalid kind branches:
    expect(source).not.toMatch(/status === 401[\s\S]*?invalid_credentials[\s\S]*?status === 403/);
  });

  it('cancel-deletion COPY map has zero per-status error strings', () => {
    const sourcePath = path.resolve(__dirname, '../../(auth)/cancel-deletion.tsx');
    const source = fs.readFileSync(sourcePath, 'utf-8');
    // Only one canonical "凭证或验证码无效" label; no variants.
    const matches = source.match(/凭证或验证码无效/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
