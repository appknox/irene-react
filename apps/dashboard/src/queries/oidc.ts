import { queryOptions } from '@tanstack/react-query';
import { OidcService } from '@irene/api/services/oidc';

/** Keys for what the API makes of an OIDC token. */
export const oidcKeys = {
  all: () => ['oidc'] as const,
  validation: (token: string) => [...oidcKeys.all(), 'validation', token] as const,
  authorization: (token: string) => [...oidcKeys.all(), 'authorization', token] as const,
};

/**
 * Builds the query that checks an OIDC token.
 *
 * Not retried: the token is single use, and a refusal is an answer rather than
 * a failure to try again.
 *
 * @param token - The `oidc_token` the client's redirect carried.
 * @returns Query options resolving to the validation result.
 */
export const oidcTokenValidationOptions = (token: string) =>
  queryOptions({
    queryKey: oidcKeys.validation(token),
    queryFn: () => OidcService.validateToken(token),
    staleTime: Infinity,
    retry: false,
  });

/**
 * Builds the query that reads what an OIDC client is asking for.
 *
 * @param token - The `oidc_token` the client's redirect carried.
 * @returns Query options resolving to the client's name, scopes and whether the account must be asked.
 */
export const oidcAuthorizationOptions = (token: string) =>
  queryOptions({
    queryKey: oidcKeys.authorization(token),
    queryFn: () => OidcService.getAuthorization(token),
    staleTime: Infinity,
    retry: false,
  });
