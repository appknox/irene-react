import { apiRequest } from '@irene/api/request';
import type { ApiOidcAuthorization, ApiOidcValidationResult } from '@irene/api/services/oidc';

import { OidcEndpoints } from './endpoints';

/**
 * Authorizes an OIDC client against the signed-in account.
 *
 * Every endpoint needs a session: a signed-out request is answered 401, which
 * is why the pages send the user to sign in and return them here afterwards.
 */
export default class OidcService {
  /**
   * Checks the token the client's redirect carried.
   *
   * @param token - The `oidc_token` from the URL.
   * @returns Whether it passed, and where to send the browser if it did not.
   */
  public static readonly validateToken = (token: string) =>
    apiRequest.post<ApiOidcValidationResult>(OidcEndpoints.validate(), { oidc_token: token });

  /**
   * Reads what the client is asking for.
   *
   * @param token - The `oidc_token` from the URL.
   * @returns The client's name and scopes, and whether the account must be asked at all.
   */
  public static readonly getAuthorization = (token: string) =>
    apiRequest.post<ApiOidcAuthorization>(OidcEndpoints.authorization(), { oidc_token: token });

  /**
   * Grants or refuses the client.
   *
   * A refusal is answered 400 with a `redirect_url` of its own, so both answers
   * end with the browser going back to the client.
   *
   * @param request.token - The `oidc_token` from the URL.
   * @param request.allow - Whether the account agreed.
   * @returns Where to send the browser.
   */
  public static readonly authorize = ({ token, allow }: { token: string; allow: boolean }) =>
    apiRequest.post<ApiOidcValidationResult>(OidcEndpoints.authorize(), {
      oidc_token: token,
      allow,
    });
}
