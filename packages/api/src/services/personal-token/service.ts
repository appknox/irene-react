import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';

import type {
  ApiPersonalToken,
  ApiPersonalTokenListResponse,
  ApiPersonalTokenResource,
  ApiPersonalTokenResponse,
} from '@irene/api/services/personal-token';

import { PersonalTokenEndpoints } from './endpoints';

/** irene asks for the first page and offers no other, so the list stops at the newest ten. */
const PERSONAL_TOKEN_PAGE = { limit: 10, offset: 0 };

/**
 * Takes the JSON:API envelope off one token.
 *
 * @param resource - The token as the endpoint sends it.
 * @returns The token.
 */
const _toPersonalToken = ({ id, attributes }: ApiPersonalTokenResource): ApiPersonalToken => ({
  id,
  name: attributes.name,
  key: attributes.key,
  created: attributes.created,
});

/** Talks to the endpoint holding the API tokens the signed-in account has generated. */
export default class PersonalTokenService {
  /**
   * Fetches the account's tokens, newest first.
   *
   * @returns The newest ten, which is all irene shows.
   */
  public static readonly getPersonalTokens = async () => {
    const response = await apiRequest.get<ApiPersonalTokenListResponse>(
      PersonalTokenEndpoints.list(),
      { params: PERSONAL_TOKEN_PAGE, signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return response.data.map(_toPersonalToken);
  };

  /**
   * Generates a token. Names are unique per account.
   *
   * @param name - What the account calls the token.
   * @returns The new token, key included.
   */
  public static readonly createPersonalToken = async (name: string) => {
    const response = await apiRequest.post<ApiPersonalTokenResponse>(
      PersonalTokenEndpoints.list(),
      { name }
    );

    return _toPersonalToken(response.data);
  };

  /**
   * Revokes a token, so the API refuses it from then on.
   *
   * @param id - The token to revoke.
   * @returns Resolves once it is revoked.
   */
  public static readonly revokePersonalToken = (id: string) =>
    apiRequest.delete<void>(PersonalTokenEndpoints.detail(id));
}
