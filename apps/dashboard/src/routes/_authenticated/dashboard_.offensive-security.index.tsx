import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the home page and the navigation link here. */
export const Route = createFileRoute('/_authenticated/dashboard_/offensive-security/')({
  staticData: { pageTitle: () => akMT('offensiveSecurity.attackRuns') },
  component: () => <RouteShell name={akMT('offensiveSecurity.attackRuns')} />,
});
