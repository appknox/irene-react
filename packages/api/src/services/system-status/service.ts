import { HTTP_STATUS_CODES } from '@irene/constants';
import { apiRequest } from '@irene/api/request';

import { StatusEndpoints } from './endpoints';
import type { ApiPingResponse, ApiStorageProbe } from '.';

/**
 * Checks each system the status page reports on.
 *
 * Every check resolves rather than rejects: a system being unreachable is the
 * answer, not a failed request, so the caller reads it as data and a later check
 * can replace it. A check that rejected would leave the last answer on screen.
 */
export default class StatusService {
  /**
   * Checks the object store.
   *
   * `api/status` hands back a pre-signed URL for an object that does not exist,
   * so a reachable store answers 404 and an unreachable one does not answer at
   * all. The request is made with `fetch` rather than the API client, since the
   * URL is the object store's own and must carry none of our headers.
   *
   * @returns Whether the object store answered.
   */
  public static readonly checkStorage = async (): Promise<boolean> => {
    try {
      const probe = await apiRequest.get<ApiStorageProbe>(StatusEndpoints.status());
      const answer = await fetch(probe.data.storage);

      return answer.status === HTTP_STATUS_CODES.NOT_FOUND;
    } catch {
      return false;
    }
  };

  /**
   * Checks the API itself.
   *
   * Any answer counts. The endpoint being reachable is the question, so the
   * body is not read: a deployment that answers it with something other than a
   * pong is still up.
   *
   * @returns Whether it answered at all.
   */
  public static readonly checkApi = async (): Promise<boolean> => {
    try {
      await apiRequest.get<ApiPingResponse>(StatusEndpoints.ping());

      return true;
    } catch {
      return false;
    }
  };
}
