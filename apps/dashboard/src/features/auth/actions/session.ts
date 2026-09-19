import type { QueryClient } from '@tanstack/react-query';

import {
  clearStoredSession,
  createSessionFromResponse,
  storeSession,
  type Session,
} from '@irene/api/utils/session';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import type { ApiSessionResponse } from '@irene/api/services/auth';

/**
 * Records a session the app has just been granted: stored for the next visit,
 * and seeded into the cache so the route guards do not re-check what we just
 * learnt.
 *
 * @param queryClient - The cache to seed.
 * @param response - The token and user id from a sign-in.
 * @returns The stored session.
 */
export function startSession(queryClient: QueryClient, response: ApiSessionResponse): Session {
  const session = createSessionFromResponse(response);

  storeSession(session);
  queryClient.setQueryData(sessionCheckOptions().queryKey, session);

  return session;
}

/**
 * Forgets the session, in storage and in the cache. Safe to call when there is
 * none, so a failed sign-out can still leave the user signed out.
 *
 * @param queryClient - The cache to clear.
 */
export function endSession(queryClient: QueryClient): void {
  clearStoredSession();
  queryClient.setQueryData(sessionCheckOptions().queryKey, null);
}
