import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the StoreKnox new-version notification links here. */
export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/inventory-details/$id/unscanned-version'
)({
  staticData: { pageTitle: () => akMT('storeknox.title') },
  component: () => <RouteShell name={akMT('storeknox.title')} />,
});
