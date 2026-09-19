import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AuthService, type ApiSessionResponse } from '@irene/api/services/auth';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';

import { bounceToLogin, completeSsoSignIn } from '@/features/auth/actions/sso';
import { SsoRedirectPage } from '@/features/auth/pages/sso-redirect';

export const Route = createFileRoute('/_unauthenticated/saml2/redirect')({
  validateSearch: z.object({
    sso_token: z.string().optional(),
    err: z.string().optional(),
  }),

  loaderDeps: ({ search }) => search,

  /** Trades the token the identity provider sent the user back with for a session. */
  loader: async ({ deps, context }) => {
    // The provider's own complaint is the most specific thing anyone has.
    if (deps.err || !deps.sso_token) {
      bounceToLogin(deps.err ?? akMT('ssoLoginFailed'));
    }

    let session: ApiSessionResponse;

    try {
      session = await AuthService.loginWithSaml(deps.sso_token);
    } catch (error) {
      const reason = getApiErrorMessage(error);
      const failed = akMT('ssoLoginFailed');

      bounceToLogin(reason ? `${failed}: ${reason}` : failed);
    }

    // Outside the try: signing in throws the redirect that lands the user home.
    completeSsoSignIn(session, context.queryClient);
  },

  // The loader is a round trip to the server and always ends in a redirect, so
  // its pending state is the whole of what the user sees. Shown from the first
  // frame rather than after the router's default delay.
  pendingMs: 0,
  pendingComponent: SsoRedirectPage,
});
