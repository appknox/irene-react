import { apiRequest } from '@irene/api/request';
import { AuthEndpoints } from './config';
import type { LoginRequest, SessionResponse } from '@irene/api/types/session';

/** Talks to the endpoints that sign a user in and check their session. */
export default class AuthService {
  /**
   * Checks that a stored credential is still live. The header goes on per request until an auth interceptor exists.
   *
   * @param b64token - The base64 `userId:token` credential from the stored session.
   * @returns Resolves on a 2xx; rejects with the `AxiosError` otherwise, 401 meaning refused.
   */
  public static readonly check = (b64token: string): Promise<void> =>
    apiRequest.post(AuthEndpoints.check(), {}, { headers: { Authorization: `Basic ${b64token}` } });

  /**
   * Signs a user in with a username or email and password. Sends the username lowercased because the server compares it case-insensitively.
   *
   * @param credentials - The username or email, and the password.
   * @returns The token and user id to build a session from.
   */
  public static readonly login = ({ username, password }: LoginRequest) =>
    apiRequest.post<SessionResponse>(AuthEndpoints.login(), {
      username: username.toLowerCase(),
      password,
    });
}
