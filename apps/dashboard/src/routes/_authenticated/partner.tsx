import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { DashboardLayout } from '@/layouts/dashboard-layout';

/* The partner screens sit in the same chrome as the dashboard, under their own prefix. */
export const Route = createFileRoute('/_authenticated/partner')({
  staticData: { pageTitle: () => akMT('partner') },
  component: DashboardLayout,
});
