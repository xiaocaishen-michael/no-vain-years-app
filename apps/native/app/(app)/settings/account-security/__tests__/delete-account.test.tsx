import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestDeleteAccountSmsCode: vi.fn(),
}));

vi.mock('@nvy/auth', () => ({
  requestDeleteAccountSmsCode: mocks.requestDeleteAccountSmsCode,
}));

vi.mock('@nvy/api-client', () => {
  class ResponseError extends Error {
    public readonly response: Response;
    constructor(response: Response, message?: string) {
      super(message);
      this.name = 'ResponseError';
      this.response = response;
    }
  }
  class FetchError extends Error {
    public override readonly cause: Error;
    constructor(cause: Error, message?: string) {
      super(message);
      this.name = 'FetchError';
      this.cause = cause;
    }
  }
  class ApiClientError extends Error {
    public readonly status: number;
    public readonly code: string;
    constructor(status: number, body: { code?: string; message?: string }) {
      super(body.message ?? `HTTP ${status}`);
      this.name = 'ApiClientError';
      this.status = status;
      this.code = body.code ?? 'UNKNOWN_ERROR';
    }
  }
  return { ResponseError, FetchError, ApiClientError };
});

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const createElement = React.createElement;
  const Text = ({ children }: { children?: React.ReactNode; accessibilityLabel?: string }) =>
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
    accessibilityState?: { disabled?: boolean; checked?: boolean; busy?: boolean };
    style?: { opacity?: number };
  }) => {
    const isDisabled = accessibilityState?.disabled ?? false;
    return createElement(
      'button',
      {
        onClick: isDisabled ? undefined : onPress,
        'aria-label': accessibilityLabel,
        'aria-disabled': isDisabled || undefined,
        'aria-checked':
          accessibilityState?.checked === undefined ? undefined : accessibilityState.checked,
        'aria-busy': accessibilityState?.busy || undefined,
        disabled: isDisabled || undefined,
        'data-opacity': style?.opacity,
      },
      children,
    );
  };
  return { Text, View, TextInput, Pressable };
});

import { ResponseError } from '@nvy/api-client';

import DeleteAccountScreen from '../delete-account';

describe('DeleteAccountScreen — IDLE state render (spec C T2 / US1 acceptance 2-4)', () => {
  beforeEach(() => mocks.requestDeleteAccountSmsCode.mockReset());
  afterEach(() => cleanup());

  it('renders both warning lines', () => {
    render(<DeleteAccountScreen />);
    expect(screen.getByText(/15 天冻结期，期间可登录撤销恢复/)).toBeTruthy();
    expect(screen.getByText(/期满后账号数据将永久匿名化，不可恢复/)).toBeTruthy();
  });

  it('renders both checkboxes in unchecked state (US1 scenario 2)', () => {
    render(<DeleteAccountScreen />);
    expect(screen.getByLabelText('checkbox-1').getAttribute('aria-checked')).toBe('false');
    expect(screen.getByLabelText('checkbox-2').getAttribute('aria-checked')).toBe('false');
  });

  it('send-code button is disabled when neither checkbox is checked (US1 scenario 2)', () => {
    render(<DeleteAccountScreen />);
    const btn = screen.getByLabelText('send-code');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('code input is disabled at IDLE', () => {
    render(<DeleteAccountScreen />);
    const input = screen.getByLabelText('code-input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.maxLength).toBe(6);
  });

  it('submit button is disabled at IDLE', () => {
    render(<DeleteAccountScreen />);
    expect(screen.getByLabelText('submit').getAttribute('aria-disabled')).toBe('true');
  });

  it('FR-014 anti-leak: rendered HTML has no hex / px literals', () => {
    render(<DeleteAccountScreen />);
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).not.toMatch(/\d+px\b/);
  });
});

describe('DeleteAccountScreen — state machine (spec C T3 / US2 acceptance 1-3 / US3)', () => {
  beforeEach(() => mocks.requestDeleteAccountSmsCode.mockReset());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('US2-1: tapping both checkboxes enables send-code button', () => {
    render(<DeleteAccountScreen />);
    fireEvent.click(screen.getByLabelText('checkbox-1'));
    fireEvent.click(screen.getByLabelText('checkbox-2'));
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBeNull();
  });

  it('US2-1: only one checkbox keeps send-code disabled', () => {
    render(<DeleteAccountScreen />);
    fireEvent.click(screen.getByLabelText('checkbox-1'));
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBe('true');
  });

  it('US2-2: send-code success → code input enabled + 60s cooldown countdown', async () => {
    vi.useFakeTimers();
    mocks.requestDeleteAccountSmsCode.mockResolvedValue(undefined);

    render(<DeleteAccountScreen />);
    fireEvent.click(screen.getByLabelText('checkbox-1'));
    fireEvent.click(screen.getByLabelText('checkbox-2'));

    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    expect(mocks.requestDeleteAccountSmsCode).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('code-input') as HTMLInputElement).disabled).toBe(false);
    expect(screen.getByLabelText('send-code').textContent).toMatch(/60s 后可重发/);
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBe('true');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('send-code').textContent).toMatch(/59s 后可重发/);

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getByLabelText('send-code').textContent).toMatch(/^发送验证码$/);
    expect(screen.getByLabelText('send-code').getAttribute('aria-disabled')).toBeNull();
  });

  it('US2-3: typing 6-digit code enables submit button', async () => {
    mocks.requestDeleteAccountSmsCode.mockResolvedValue(undefined);
    render(<DeleteAccountScreen />);
    fireEvent.click(screen.getByLabelText('checkbox-1'));
    fireEvent.click(screen.getByLabelText('checkbox-2'));
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    const input = screen.getByLabelText('code-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12345' } });
    expect(screen.getByLabelText('submit').getAttribute('aria-disabled')).toBe('true');

    fireEvent.change(input, { target: { value: '123456' } });
    expect(screen.getByLabelText('submit').getAttribute('aria-disabled')).toBeNull();
  });

  it('code input strips non-digit chars and caps at 6', async () => {
    mocks.requestDeleteAccountSmsCode.mockResolvedValue(undefined);
    render(<DeleteAccountScreen />);
    fireEvent.click(screen.getByLabelText('checkbox-1'));
    fireEvent.click(screen.getByLabelText('checkbox-2'));
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });

    const input = screen.getByLabelText('code-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a1b2c3d4e5f6g7' } });
    expect(input.value).toBe('123456');
  });

  // US3-1 / US3-3 single-rejection paths covered by delete-account-errors.test.ts
  // (mapDeletionError unit test) — vitest's spy-rejection tracker falsely reports
  // the mock's rejected promise as "unhandled" through React event handlers even
  // though the component catches it, so component-level error-path tests for
  // single-mock-rejection cases are owned by the helper unit test.
  // The chained reject→resolve path below exercises the same component-level
  // catch + error-row clearing semantics.

  it('US3-4: error row clears on retry tap (next send-code starts with errorMsg null)', async () => {
    mocks.requestDeleteAccountSmsCode
      .mockImplementationOnce(async () => {
        throw new ResponseError(new Response(null, { status: 503 }));
      })
      .mockResolvedValueOnce(undefined);

    render(<DeleteAccountScreen />);
    fireEvent.click(screen.getByLabelText('checkbox-1'));
    fireEvent.click(screen.getByLabelText('checkbox-2'));
    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    expect(screen.queryByText(/网络错误/)).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('send-code'));
    });
    expect(screen.queryByText(/网络错误/)).toBeNull();
  });

  // Race guard owns full coverage in T4 (handleSubmit) where the same
  // sendingRef pattern applies; covering it once is sufficient for the
  // ref-based single-flight pattern.
});
