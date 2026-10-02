import { useQuery } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';

import { userOptions } from '@/queries/user';

/**
 * The signed-in account, from the cache the authenticated route already filled.
 *
 * `setupUserAndOrgContext` loads it before any page renders, so this reads a
 * cache hit rather than making a request.
 *
 * @returns The account, or undefined while the cache is still empty.
 */
export function useSignedInUser() {
  const { session } = useRouteContext({ from: '/_authenticated' });
  const { data } = useQuery(userOptions(session.userId));

  return data;
}
