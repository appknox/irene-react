import { queryOptions } from '@tanstack/react-query';

import { DeviceFarmService } from '@irene/api/services/device-farm';
import { StatusService } from '@irene/api/services/system-status';

/** Keys for what each system last answered. */
export const statusKeys = {
  all: () => ['system-status'] as const,
  storage: () => [...statusKeys.all(), 'storage'] as const,
  api: () => [...statusKeys.all(), 'api'] as const,
  deviceFarm: (host: string) => [...statusKeys.all(), 'device-farm', host] as const,
};

/*
  A system that is down is the answer the page exists to show, not a failure to
  try again, so none of these retry.

  They are held for the life of the tab, and checked again when the window is
  focused: someone who left the page open while chasing an outage comes back to
  what is true now, not what was true when they opened it. `always` because the
  answers never go stale on their own.
*/
const PROBE = { staleTime: Infinity, retry: false, refetchOnWindowFocus: 'always' } as const;

/**
 * Builds the query that checks the object store.
 *
 * @returns Query options resolving to whether it answered.
 */
export const storageStatusOptions = () =>
  queryOptions({ queryKey: statusKeys.storage(), queryFn: StatusService.checkStorage, ...PROBE });

/**
 * Builds the query that checks the API.
 *
 * @returns Query options resolving to whether it answered its ping.
 */
export const apiStatusOptions = () =>
  queryOptions({ queryKey: statusKeys.api(), queryFn: StatusService.checkApi, ...PROBE });

/**
 * Builds the query that checks the device farm.
 *
 * @param deviceFarmUrl - The host this organization's sessions run on.
 * @returns Query options resolving to whether it answered its ping.
 */
export const deviceFarmStatusOptions = (deviceFarmUrl: string) =>
  queryOptions({
    queryKey: statusKeys.deviceFarm(deviceFarmUrl),
    queryFn: () => DeviceFarmService.ping(deviceFarmUrl),
    ...PROBE,
  });
