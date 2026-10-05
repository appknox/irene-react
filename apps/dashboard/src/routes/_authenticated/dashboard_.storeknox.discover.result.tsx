import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the store monitoring navigation links here. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/discover/result')({
  staticData: { pageTitle: () => akMT('discovery') },
  component: () => <RouteShell name={akMT('discovery')} />,
});
