import { apiRequest } from '@irene/api/request';
import { SsoEndpoints } from './config';
import type { SsoCheck } from '@irene/api/types/sso';

/** Talks to the endpoints that decide and start SSO sign-in. */
export default class SsoService {
  /**
   * Asks how a user signs in. Runs before the user has any credential.
   *
   * @param username - The username or email the user typed.
   * @returns Whether SAML or OIDC is available, whether SSO is enforced, and the token for the SSO redirect.
   */
  public static readonly check = (username: string): Promise<SsoCheck> =>
    apiRequest.post(SsoEndpoints.check(), { username });
}
