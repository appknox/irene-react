import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the marketplace's integration cards link here. */
export const Route = createFileRoute(
  '/_authenticated/dashboard/organization/settings/integrations'
)({
  staticData: { pageTitle: () => akMT('integration') },
  component: () => <RouteShell name={akMT('integration')} />,
});
