import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the home page links here. */
export const Route = createFileRoute('/_authenticated/dashboard/projects')({
  staticData: { pageTitle: () => akMT('projects') },
  component: () => <RouteShell name={akMT('projects')} />,
});
