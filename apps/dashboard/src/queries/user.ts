import { queryOptions } from '@tanstack/react-query';
import { UserService } from '@irene/api/services/user';

/** The cache keys for the signed-in account. */
export const userKeys = {
  all: () => ['user'] as const,
  detail: (userId: number | string) => [...userKeys.all(), 'detail', userId] as const,
};

/**
 * Builds the query for the signed-in account.
 *
 * @param userId - The user id the session carries.
 * @returns Query options resolving to the account, including the language it reads in.
 */
export const userOptions = (userId: number | string) =>
  queryOptions({
    queryKey: userKeys.detail(userId),
    queryFn: () => UserService.getUser(userId),
    staleTime: Infinity,
  });
