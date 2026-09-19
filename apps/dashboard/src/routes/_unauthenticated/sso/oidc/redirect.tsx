import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AuthService, type ApiOidcCallbackResponse } from '@irene/api/services/auth';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';

import { bounceToLogin, completeSsoSignIn } from '@/features/auth/actions/sso';
import { SsoRedirectPage } from '@/features/auth/pages/sso-redirect';

export const Route = createFileRoute('/_unauthenticated/sso/oidc/redirect')({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),

  loaderDeps: ({ search }) => search,

  /** Exchanges the single-use code the identity provider sent the user back with. */
  loader: async ({ deps, context }) => {
    // If there is an error, redirect to login.
    if (deps.error) {
      bounceToLogin(deps.error_description ?? deps.error);
    }

    // If there is no code, redirect to login.
    if (!deps.code) {
      bounceToLogin(akMT('ssoSettings.oidc.missingCode'));
    }

    let response: ApiOidcCallbackResponse;

    try {
      response = await AuthService.completeOidcLogin({ code: deps.code, state: deps.state });
    } catch (error) {
      const reason = getApiErrorMessage(error);
      const failed = akMT('ssoSettings.oidc.authFailed');

      bounceToLogin(reason ? `${failed}: ${reason}` : failed);
    }

    // Outside the try: signing in throws the redirect that lands the user home.
    completeSsoSignIn({ token: response.token, user_id: response.user.id }, context.queryClient);
  },

  // The loader is a round trip to the server and always ends in a redirect, so
  // its pending state is the whole of what the user sees. Shown from the first
  // frame rather than after the router's default delay.
  pendingMs: 0,
  pendingComponent: SsoRedirectPage,
});
