import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; override-request notifications link here. */
export const Route = createFileRoute(
  '/_authenticated/dashboard/file/$fileId_/analysis/$analysisId'
)({
  staticData: { pageTitle: () => akMT('vulnerability') },
  component: () => <RouteShell name={akMT('vulnerability')} />,
});
