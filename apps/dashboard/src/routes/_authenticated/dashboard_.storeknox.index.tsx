import { createFileRoute, redirect } from '@tanstack/react-router';

/* Store monitoring has no landing page: it opens on the inventory it watches. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/storeknox/inventory/app-list', replace: true });
  },
});
