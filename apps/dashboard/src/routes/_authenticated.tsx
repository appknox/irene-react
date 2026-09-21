import { createFileRoute, redirect } from '@tanstack/react-router';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

export const Route = createFileRoute('/_authenticated')({
  /**
   * Sends anyone without a live session to the login page.
   *
   * Reads what the boot settled, so no page under here asks the API again
   * until the tab is reloaded.
   */
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query(sessionCheckOptions());

    if (!session) {
      throw redirect({ to: '/login', search: { unauthenticated: true } });
    }

    return { session };
  },

  component: AuthenticatedLayout,
});
