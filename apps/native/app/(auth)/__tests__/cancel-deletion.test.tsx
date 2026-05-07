import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useLocalSearchParams: vi.fn<() => { phone?: string }>(),
  setParams: vi.fn<(params: { phone?: string | undefined }) => void>(),
  routerReplace: vi.fn<(href: string) => void>(),
  requestCancelDeletionSmsCode: vi.fn(),
  cancelDeletion: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => mocks.useLocalSearchParams(),
  useRouter: () => ({ setParams: mocks.setParams, replace: mocks.routerReplace }),
}));

vi.mock('@nvy/auth', () => ({
  requestCancelDeletionSmsCode: mocks.requestCancelDeletionSmsCode,
  cancelDeletion: mocks.cancelDeletion,
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
    mocks.requestCancelDeletionSmsCode.mockReset();
    mocks.cancelDeletion.mockReset();
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

describe('CancelDeletionScreen — state machine (spec C T8 / US7 acceptance 2 / US8 / FR-006 / FR-007)', () => {
  beforeEach(() => {
    mocks.useLocalSearchParams.mockReset();
    mocks.setParams.mockReset();
    mocks.routerReplace.mockReset();
    mocks.requestCancelDeletionSmsCode.mockReset();
    mocks.cancelDeletion.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('typing phone (no param path) enables send-code button', () => {
    mocks.useLocalSearchParams.mockReturnValue({});
    render(<CancelDeletionScreen />);
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBe('true');

    fireEvent.change(screen.getByLabelText('phone-input'), {
      target: { value: '+8613800138000' },
    });
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBeNull();
  });

  it('US7-2 prefilled path: send-code enabled immediately + tap calls wrapper with phone', async () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);

    render(<CancelDeletionScreen />);
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    expect(mocks.requestCancelDeletionSmsCode).toHaveBeenCalledWith('+8613800138000');
  });

  it('FR-007: send-code success → 60s cooldown countdown', async () => {
    vi.useFakeTimers();
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    expect(screen.getByLabelText('send-code').textContent).toMatch(/60s 后可重发/);
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBe('true');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('send-code').textContent).toMatch(/59s 后可重发/);

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    // PHASE 2 T14: send-code button now contains SMS label prefix; partial match.
    expect(screen.getByLabelText('send-code').textContent).toMatch(/发送验证码/);
    expect(screen.getByLabelText('send-code').textContent).not.toMatch(/后可重发/);
  });

  it('US7-2: code input enables after send-code success; typing 6 digits enables submit', async () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    const input = screen.getByLabelText('code-input') as HTMLInputElement;
    expect(input.disabled).toBe(false);

    fireEvent.change(input, { target: { value: '12345' } });
    expect(screen.getByLabelText('submit').getAttribute('aria-disabled')).toBe('true');

    fireEvent.change(input, { target: { value: '123456' } });
    expect(screen.getByLabelText('submit').getAttribute('aria-disabled')).toBeNull();
  });

  it('code input strips non-digit and caps at 6', async () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    const input = screen.getByLabelText('code-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a1b2c3d4e5f6g7' } });
    expect(input.value).toBe('123456');
  });

  it('US7-3+4 happy submit: cancelDeletion called + router.replace /(app)/(tabs)', async () => {
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
    fireEvent.change(screen.getByLabelText('code-input'), { target: { value: '123456' } });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('submit'));
    });

    expect(mocks.cancelDeletion).toHaveBeenCalledTimes(1);
    expect(mocks.cancelDeletion).toHaveBeenCalledWith('+8613800138000', '123456');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });

  it('US9 race guard: rapid double-tap on submit fires cancelDeletion only once', async () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);
    let resolveCancel: (() => void) | undefined;
    mocks.cancelDeletion.mockImplementation(
      () =>
        new Promise<{ accountId: number; accessToken: string; refreshToken: string }>((resolve) => {
          resolveCancel = () => resolve({ accountId: 7, accessToken: 'a', refreshToken: 'r' });
        }),
    );

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    fireEvent.change(screen.getByLabelText('code-input'), { target: { value: '123456' } });

    await act(async () => {
      fireEvent.click(screen.getByLabelText('submit'));
      fireEvent.click(screen.getByLabelText('submit'));
    });

    expect(mocks.cancelDeletion).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCancel?.();
    });
  });

  it('isSubmitting in-flight: a11y disabled+busy, label shows 正在撤销...', async () => {
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode.mockResolvedValue(undefined);
    let resolveCancel: (() => void) | undefined;
    mocks.cancelDeletion.mockImplementation(
      () =>
        new Promise<{ accountId: number; accessToken: string; refreshToken: string }>((resolve) => {
          resolveCancel = () => resolve({ accountId: 7, accessToken: 'a', refreshToken: 'r' });
        }),
    );

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    fireEvent.change(screen.getByLabelText('code-input'), { target: { value: '123456' } });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('submit'));
    });

    const submit = screen.getByLabelText('submit');
    expect(submit.getAttribute('aria-disabled')).toBe('true');
    expect(submit.getAttribute('aria-busy')).toBe('true');
    // PHASE 2 T14: friendly submitting copy '正在撤销...' replaces dev placeholder.
    expect(submit.textContent).toMatch(/正在撤销/);

    await act(async () => {
      resolveCancel?.();
    });
  });

  it('SC-008 反枚举: chained reject→resolve uses single "凭证或验证码无效" string for all 4xx kinds', async () => {
    const ResponseError = (await import('@nvy/api-client')).ResponseError;
    mocks.useLocalSearchParams.mockReturnValue({ phone: '+8613800138000' });
    mocks.requestCancelDeletionSmsCode
      .mockImplementationOnce(async () => {
        throw new ResponseError(new Response(null, { status: 401 }));
      })
      .mockResolvedValueOnce(undefined);

    render(<CancelDeletionScreen />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    expect(screen.getByText(/凭证或验证码无效/)).toBeTruthy();
    // "phone 未注册" / "已匿名化" 等细分文案不出现
    expect(screen.queryByText(/未注册/)).toBeNull();
    expect(screen.queryByText(/匿名化/)).toBeNull();

    // retry → error clears
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    expect(screen.queryByText(/凭证或验证码无效/)).toBeNull();
  });
});
