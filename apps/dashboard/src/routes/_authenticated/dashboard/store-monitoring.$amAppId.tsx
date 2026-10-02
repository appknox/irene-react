import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the store-monitoring notification link here. */
export const Route = createFileRoute('/_authenticated/dashboard/store-monitoring/$amAppId')({
  staticData: { pageTitle: () => akMT('appMonitoring') },
  component: () => <RouteShell name={akMT('appMonitoring')} />,
});
