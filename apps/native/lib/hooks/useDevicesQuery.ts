import { useQuery } from '@tanstack/react-query';
import { listDevices, type DeviceListResult } from '@nvy/auth';

export function useDevicesQuery(page: number, size: number) {
  return useQuery<DeviceListResult>({
    queryKey: ['devices', page],
    queryFn: () => listDevices(page, size),
    staleTime: 30_000,
    retry: 1,
  });
}
