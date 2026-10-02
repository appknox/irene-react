import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; upload-denied notifications link here. */
export const Route = createFileRoute('/_authenticated/dashboard/project/$projectId/settings')({
  staticData: { pageTitle: () => akMT('notificationModule.projectSettings') },
  component: () => <RouteShell name={akMT('notificationModule.projectSettings')} />,
});
