import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the SBOM completion notification link here. */
export const Route = createFileRoute(
  '/_authenticated/dashboard/sbom/apps_/$sbomProjectId/scans/$sbomFileId'
)({
  staticData: { pageTitle: () => akMT('SBOM') },
  component: () => <RouteShell name={akMT('SBOM')} />,
});
