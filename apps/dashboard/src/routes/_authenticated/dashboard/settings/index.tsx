import { createFileRoute, redirect } from '@tanstack/react-router';

/* Account settings has no landing page: it opens on the general tab, as irene's route does. */
export const Route = createFileRoute('/_authenticated/dashboard/settings/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/settings/general', replace: true });
  },
});
