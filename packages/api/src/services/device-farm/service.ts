import { getConfigValue } from '@irene/config';
import type { ApiDeviceFarmPing } from '@irene/api/services/device-farm';

import { DeviceFarmEndpoints } from './endpoints';

/** What a reachable device farm answers a ping with. */
const PONG = 'pong';

/**
 * The device farm this deployment runs manual and automated sessions on.
 *
 * It lives on a host of its own, so nothing here goes through the API client:
 * the requests must carry none of our headers.
 */
export default class DeviceFarmService {
  /**
   * Resolves the host the device farm is served from.
   *
   * A deployment that names no device farm of its own runs it behind the API,
   * and one that names neither serves it from wherever the app is served, so
   * each is tried in turn rather than treating a system that is up as absent.
   *
   * @param deviceFarmUrl - The host this organization's sessions run on, where one is configured.
   * @returns The first candidate that reads as a URL, or null when none does.
   */
  public static readonly resolveHost = (deviceFarmUrl: string): string | null => {
    const candidates = [deviceFarmUrl, getConfigValue('IRENE_API_HOST'), window.location.href];

    for (const candidate of candidates) {
      if (URL.canParse(candidate)) {
        return new URL('/', candidate).href;
      }
    }

    return null;
  };

  /**
   * Checks that the device farm is reachable.
   *
   * Resolves rather than rejects: being unreachable is the answer, not a failed
   * request.
   *
   * @param deviceFarmUrl - The host this organization's sessions run on.
   * @returns Whether it answered its ping.
   */
  public static readonly ping = async (deviceFarmUrl: string): Promise<boolean> => {
    const host = DeviceFarmService.resolveHost(deviceFarmUrl);

    if (!host) {
      return false;
    }

    try {
      const answer = await fetch(new URL(DeviceFarmEndpoints.ping(), host));
      const body = (await answer.json()) as ApiDeviceFarmPing;

      return body.ping === PONG;
    } catch {
      return false;
    }
  };
}
