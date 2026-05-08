import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

const mocks = vi.hoisted(() => ({
  listDevices: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock('@nvy/auth', () => ({
  listDevices: mocks.listDevices,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
}));

import { useDevicesQuery } from './useDevicesQuery';

describe('useDevicesQuery (T7)', () => {
  beforeEach(() => {
    mocks.listDevices.mockReset();
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('should_call_listDevices_with_correct_args', () => {
    useDevicesQuery(0, 10);
    const options = mocks.useQuery.mock.calls[0]?.[0] as Record<string, unknown>;
    const queryFn = options['queryFn'] as () => unknown;
    queryFn();
    expect(mocks.listDevices).toHaveBeenCalledWith(0, 10);
  });

  it('should_use_query_key_devices_page', () => {
    useDevicesQuery(2, 10);
    const options = mocks.useQuery.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options['queryKey']).toEqual(['devices', 2]);
  });

  it('should_have_staleTime_30s', () => {
    useDevicesQuery(0, 10);
    const options = mocks.useQuery.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options['staleTime']).toBe(30_000);
  });

  it('should_retry_once_on_failure', () => {
    useDevicesQuery(0, 10);
    const options = mocks.useQuery.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options['retry']).toBe(1);
  });
});
