import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPhone } = vi.hoisted(() => ({
  mockPhone: vi.fn<() => string | null>(() => null),
}));

vi.mock('@nvy/auth', () => ({
  useAuthStore: (selector: (state: { phone: string | null }) => unknown) =>
    selector({ phone: mockPhone() }),
}));

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const Text = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', null, children);
  const ScrollView = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return { Text, ScrollView };
});

import PhoneScreen from '../phone';

describe('PhoneScreen (spec account-settings-shell T7 / FR-008 + FR-018)', () => {
  afterEach(() => cleanup());
  beforeEach(() => mockPhone.mockReturnValue(null));

  it('renders maskPhone(store.phone) when phone !== null', () => {
    mockPhone.mockReturnValue('+8613812345678');
    render(<PhoneScreen />);
    expect(screen.getByText('+86 138****5678')).toBeTruthy();
  });

  it('renders 未绑定 fallback when store.phone === null', () => {
    mockPhone.mockReturnValue(null);
    render(<PhoneScreen />);
    expect(screen.getByText('未绑定')).toBeTruthy();
  });

  it('SC-005 anti-enum: no 7+ consecutive digit clear-text leak', () => {
    mockPhone.mockReturnValue('+8613812345678');
    render(<PhoneScreen />);
    const allText = document.body.textContent ?? '';
    expect(allText).not.toMatch(/\d{7,}/);
  });
});
