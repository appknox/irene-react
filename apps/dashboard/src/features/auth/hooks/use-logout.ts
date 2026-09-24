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
 * @param options.replaceRoute - Swaps the current history entry for `/login`
 * instead of adding one, so the browser's back button cannot return to a page
 * the signed-out user can no longer load.
 * @returns The mutation.
 */
export function useLogout({ replaceRoute = false }: Readonly<{ replaceRoute?: boolean }> = {}) {
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
      await navigate({ to: '/login', replace: replaceRoute });
      router.clearCache(); // Clears the cached route matches.
    },
  });
}
