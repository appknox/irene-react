import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the notification dropdown links here. */
export const Route = createFileRoute('/_authenticated/dashboard/notifications')({
  staticData: { pageTitle: () => akMT('notifications') },
  component: () => <RouteShell name={akMT('notifications')} />,
});
