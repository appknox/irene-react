import { createFileRoute, redirect } from '@tanstack/react-router';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

export const Route = createFileRoute('/_authenticated')({
  /** Sends anyone without a live session to the login page. */
  beforeLoad: async ({ context }) => {
    const sessionOptions = {
      ...sessionCheckOptions(),
      staleTime: 'static' as const,
    };

    const session = await context.queryClient.query(sessionOptions);

    // redirect to login if no session
    if (!session) {
      throw redirect({ to: '/login', search: { unauthenticated: true } });
    }

    return { session };
  },

  component: AuthenticatedLayout,
});
