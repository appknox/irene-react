import { queryOptions } from '@tanstack/react-query';
import { PersonalTokenService } from '@irene/api/services/personal-token';

/** The cache keys for the signed-in account's API tokens. */
export const personalTokenKeys = {
  all: () => ['personal-token'] as const,
  list: () => [...personalTokenKeys.all(), 'list'] as const,
};

/**
 * Builds the query for the account's API tokens.
 *
 * @returns Query options resolving to the newest ten tokens.
 */
export const personalTokensOptions = () =>
  queryOptions({
    queryKey: personalTokenKeys.list(),
    queryFn: PersonalTokenService.getPersonalTokens,
  });
