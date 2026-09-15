import { queryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { AUTH_SESSION_QUERY_KEY, AuthService } from '@irene/api/services/auth';
import { clearStoredSession, getStoredSession } from '@irene/api/utils/session';

/**
 * Builds the query that restores the stored session. A refused credential (401) clears the stored session.
 *
 * @returns Query options resolving to the live session, or null when nothing is stored or the API refuses it.
 */
export const sessionCheckOptions = () =>
  queryOptions({
    queryKey: [AUTH_SESSION_QUERY_KEY],
    queryFn: async () => {
      const session = getStoredSession();

      // Early return when no session is stored.
      if (!session) {
        return null;
      }

      // Check if the session is still valid with the API.
      try {
        await AuthService.check(session.b64token);
      } catch (error) {
        if (isAxiosError(error) && error.status === 401) {
          clearStoredSession();

          return null;
        }

        throw error;
      }

      return session;
    },
    staleTime: Infinity,
  });
