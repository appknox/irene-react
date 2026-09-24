import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';

import { LoginPage } from '@/features/auth/pages/login';
import { sessionCheckOptions } from '@/features/auth/queries/session';
import { returnPathSchema } from '@/utils/login-return-path';

export const Route = createFileRoute('/_unauthenticated/login')({
  staticData: { pageTitle: () => akMT('login') },

  validateSearch: z.object({
    unauthenticated: z.boolean().optional(),
    ssoLoginError: z.string().optional(),
    sessionExpired: z.boolean().optional(),
    userInactive: z.boolean().optional(),

    /*
      The URL the `_authenticated` guard blocked (for unauthenticated users), 
      which the login navigates to instead of `/`. The OIDC screens need it: 
      an external client sends the user to `/dashboard/oidc/redirect?oidc_token=<token>`, 
      and the token is single-use and only in that URL, so a signed-out user who arrives on the
      dashboard without it must restart the authorization from the client.
    */
    redirectTo: returnPathSchema,
  }),

  /**
   * Sends anyone already signed in to the dashboard, on the answer the boot
   * settled rather than a request of its own.
   */
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query(sessionCheckOptions());

    if (session) {
      throw redirect({ to: '/' });
    }
  },

  component: LoginPage,
});
