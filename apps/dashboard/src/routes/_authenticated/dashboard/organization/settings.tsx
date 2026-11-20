import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the MFA notice in account settings links an owner here. */
export const Route = createFileRoute('/_authenticated/dashboard/organization/settings')({
  staticData: { pageTitle: () => akMT('organizationSettings') },
  component: () => <RouteShell name={akMT('organizationSettings')} />,
});
