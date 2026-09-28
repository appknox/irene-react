import { createFileRoute, redirect } from '@tanstack/react-router';

/* Reporting has no landing page: it opens on the page that generates a report. */
export const Route = createFileRoute('/_authenticated/dashboard_/reports/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/reports/generate', replace: true });
  },
});
