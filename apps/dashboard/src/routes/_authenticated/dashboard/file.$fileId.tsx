import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; scan notifications link here. */
export const Route = createFileRoute('/_authenticated/dashboard/file/$fileId')({
  staticData: { pageTitle: () => akMT('file') },
  component: () => <RouteShell name={akMT('file')} />,
});
