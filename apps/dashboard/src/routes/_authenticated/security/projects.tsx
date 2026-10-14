import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until the security dashboard is its own app; the switcher links here. */
export const Route = createFileRoute('/_authenticated/security/projects')({
  staticData: { pageTitle: () => akMT('securityDashboard') },
  component: () => <RouteShell name={akMT('securityDashboard')} />,
});
