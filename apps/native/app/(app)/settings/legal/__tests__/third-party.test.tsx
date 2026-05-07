import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', async () => {
  const React = (await import('react')).default;
  const Text = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', null, children);
  const ScrollView = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return { Text, ScrollView };
});

import ThirdPartyShareListScreen from '../third-party';

describe('ThirdPartyShareListScreen (spec account-settings-shell T8 / FR-009 + FR-011 + Q6)', () => {
  afterEach(() => cleanup());

  it('renders 占位文案 (法务定稿前的兜底)', () => {
    render(<ThirdPartyShareListScreen />);
    expect(screen.getByText('本清单内容由法务团队定稿后填入,预计 M3 内测前完成。')).toBeTruthy();
  });
});
