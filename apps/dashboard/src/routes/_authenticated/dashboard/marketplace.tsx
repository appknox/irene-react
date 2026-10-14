import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the side navigation links here. */
export const Route = createFileRoute('/_authenticated/dashboard/marketplace')({
  staticData: { pageTitle: () => akMT('marketplace') },
  component: () => <RouteShell name={akMT('marketplace')} />,
});
