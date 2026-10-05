import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the store monitoring navigation links here. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/fake-apps')({
  staticData: { pageTitle: () => akMT('storeknox.fakeAppsTitle') },
  component: () => <RouteShell name={akMT('storeknox.fakeAppsTitle')} />,
});
