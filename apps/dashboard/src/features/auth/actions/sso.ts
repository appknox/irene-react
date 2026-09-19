import { redirect } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { startSession } from '@/features/auth/actions/session';
import type { ApiSessionResponse } from '@irene/api/services/auth';

/**
 * Sends the user back to the login page, saying why they did not get in.
 *
 * The reason rides in the search params, like the guard's `unauthenticated`
 * flag, so the login page can show it as an alert rather than a toast that
 * expires while the user is still reading it.
 *
 * @param reason - What went wrong, ready to show.
 * @returns Never — it always throws the redirect.
 */
export function bounceToLogin(reason: string): never {
  throw redirect({ to: '/login', search: { sso_login_error: reason } });
}

/**
 * Signs the user in with what an identity provider handed back, and puts them
 * in the dashboard.
 *
 * @param response - The token and user id from the provider's exchange.
 * @param queryClient - The cache to seed, so the guard does not re-check.
 * @returns Never — it always throws the redirect.
 */
export function completeSsoSignIn(response: ApiSessionResponse, queryClient: QueryClient): never {
  startSession(queryClient, response);

  throw redirect({ to: '/' });
}
