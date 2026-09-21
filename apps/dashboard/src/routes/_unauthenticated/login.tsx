import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { LoginPage } from '@/features/auth/pages/login';
import { sessionCheckOptions } from '@/features/auth/queries/session';

export const Route = createFileRoute('/_unauthenticated/login')({
  staticData: { pageTitle: () => akMT('login') },

  validateSearch: z.object({
    unauthenticated: z.boolean().optional(),
    ssoLoginError: z.string().optional(),
    sessionExpired: z.boolean().optional(),
    userInactive: z.boolean().optional(),
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
