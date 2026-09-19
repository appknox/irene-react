import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { LoginPage } from '@/features/auth/pages/login';
import { sessionCheckOptions } from '@/features/auth/queries/session';

export const Route = createFileRoute('/_unauthenticated/login')({
  validateSearch: z.object({
    unauthenticated: z.boolean().optional(),
    sso_login_error: z.string().optional(),
  }),

  /**
   * Sends anyone already signed in to the dashboard. The check costs nothing
   * when signed out, since it answers from storage without a request.
   */
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query({
      ...sessionCheckOptions(),
      staleTime: 'static',
    });

    if (session) {
      throw redirect({ to: '/' });
    }
  },

  component: LoginPage,
});
