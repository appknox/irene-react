import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the home page links here. */
export const Route = createFileRoute('/_authenticated/dashboard/storeknox/inventory/app-list')({
  staticData: { pageTitle: () => akMT('storeknox.title') },
  component: () => <RouteShell name={akMT('storeknox.title')} />,
});
