import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';

import { AuthService } from '@irene/api/services/auth';
import { getStoredSession } from '@irene/api/utils/session';
import { endSession } from '@/features/auth/actions/session';

/**
 * Signs the user out and returns them to the login page.
 *
 * The local session is dropped whether or not the server acknowledged it: a
 * user who asked to sign out must not be left signed in by a failed request.
 *
 * @returns The mutation.
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Nothing to release when there is no session to begin with.
      if (getStoredSession()) {
        await AuthService.logout();
      }
    },

    onSettled: async () => {
      endSession(queryClient);
      await navigate({ to: '/login' });

      /*
        Drops the cached route matches, so the next sign-in re-runs the loaders
        instead of rendering the previous account's data. Runs after the
        navigation, since clearCache only removes matches that are unmounted.
      */
      router.clearCache();
    },
  });
}
