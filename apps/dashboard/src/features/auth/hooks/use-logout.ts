import { useMutation } from '@tanstack/react-query';

import { AuthService } from '@irene/api/services/auth';
import { getStoredSession } from '@irene/api/utils/session';
import { releaseSession } from '@/features/auth/actions/session';

/**
 * Signs the user out and loads the login page.
 *
 * The local session is dropped whether or not the server acknowledged it: a
 * user who asked to sign out must not be left signed in by a failed request.
 *
 * The login page is loaded rather than navigated to, so the signed-in pages
 * are gone before the cache and the stores they read are. Clearing those under
 * a mounted page sends every query off again without a credential to send.
 *
 * @returns The mutation.
 */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      // Nothing to release when there is no session to begin with.
      if (getStoredSession()) {
        await AuthService.logout();
      }
    },

    onSettled: () => {
      releaseSession();

      /* Replaced, so the back button cannot return to a page this user can no longer load. */
      window.location.replace('/login');
    },
  });
}
