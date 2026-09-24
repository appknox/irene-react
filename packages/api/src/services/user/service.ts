import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformUserResponse } from '@irene/api/utils/transforms';
import type { ApiUserResponse } from '@irene/api/services/user';

import { UserEndpoints } from './endpoints';

/** Talks to the endpoints describing the signed-in account. */
export default class UserService {
  /**
   * Fetches the signed-in account.
   *
   * The endpoint answers with the asking account whichever id it is given, and
   * withholds the private half of the fields unless the id is that account's.
   *
   * @param id - The user id, which the session already carries.
   * @returns The account.
   */
  public static readonly getUser = async (id: number | string) => {
    const response = await apiRequest.get<ApiUserResponse>(UserEndpoints.detail(id), {
      timeout: REQUEST_ABORT_TIMEOUT_MS,
    });

    return transformUserResponse(response);
  };
}
