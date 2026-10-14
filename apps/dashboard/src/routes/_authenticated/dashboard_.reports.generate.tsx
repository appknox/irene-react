import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the reporting navigation links here. */
export const Route = createFileRoute('/_authenticated/dashboard_/reports/generate')({
  staticData: { pageTitle: () => akMT('reportModule.generateReport') },
  component: () => <RouteShell name={akMT('reportModule.generateReport')} />,
});
