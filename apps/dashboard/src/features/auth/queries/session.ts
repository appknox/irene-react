import { queryOptions } from '@tanstack/react-query';

import { AuthService } from '@irene/api/services/auth';
import { clearStoredSession, getStoredSession } from '@irene/api/utils/session';
import { authKeys } from '@/features/auth/queries/keys';

/**
 * Builds the query that confirms the stored session with the API.
 *
 * Reads the session from storage and posts it to `api/check`. If storage holds
 * no session, the query returns null without calling the API. If the call
 * fails for any reason, the session is deleted from storage.
 *
 * The result is cached for the life of the tab, so the call runs once per page
 * load.
 *
 * @returns Query options resolving to the stored session, or null when storage
 * holds none or the call failed.
 */
export const sessionCheckOptions = () =>
  queryOptions({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const session = getStoredSession();

      // If no session is stored, return null
      if (!session) {
        return null;
      }

      // Confirm the session token is still valid
      try {
        await AuthService.checkSession();
      } catch {
        clearStoredSession();

        return null;
      }

      // If the session is valid, return it
      return session;
    },
    staleTime: 'static',
  });
