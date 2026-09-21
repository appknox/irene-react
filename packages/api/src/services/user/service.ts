import { apiRequest } from '@irene/api/request';
import type { ApiUser } from '@irene/api/services/user';

import { UserEndpoints } from './endpoints';

/** Talks to the endpoints describing the signed-in account. */
export default class UserService {
  /**
   * Fetches the signed-in account.
   * @param id - The user id, which the session already carries.
   * @returns The account.
   */
  public static readonly getUser = (id: number | string) =>
    apiRequest.get<ApiUser>(UserEndpoints.detail(id));
}
