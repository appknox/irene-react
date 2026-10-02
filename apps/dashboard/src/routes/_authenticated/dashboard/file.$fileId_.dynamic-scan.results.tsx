import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; automated DAST notifications link here. */
export const Route = createFileRoute(
  '/_authenticated/dashboard/file/$fileId_/dynamic-scan/results'
)({
  staticData: { pageTitle: () => akMT('dynamicScan') },
  component: () => <RouteShell name={akMT('dynamicScan')} />,
});
