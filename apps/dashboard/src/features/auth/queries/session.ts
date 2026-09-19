import { queryOptions } from '@tanstack/react-query';

import { AuthService } from '@irene/api/services/auth';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { clearStoredSession, getStoredSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';

import { authKeys } from '@/features/auth/queries/keys';

/**
 * Builds the query that restores the stored session.
 * A refused credential (401) clears the stored session.
 *
 * @returns Query options resolving to the live session, or null when nothing is stored or the API refuses it.
 */
export const sessionCheckOptions = () =>
  queryOptions({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const session = getStoredSession();

      // Early return when no session is stored.
      if (!session) {
        return null;
      }

      // Check if the session is still valid with the API.
      try {
        await AuthService.check();
      } catch (error) {
        const errorStatus = getApiErrorStatus(error);
        const isUnauthorized = errorStatus === HTTP_STATUS_CODES.UNAUTHORIZED;

        if (!isUnauthorized) {
          throw error;
        }

        clearStoredSession();

        return null;
      }

      return session;
    },
    staleTime: Infinity,
  });
