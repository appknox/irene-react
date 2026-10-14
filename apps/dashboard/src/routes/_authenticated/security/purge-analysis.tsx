import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RouteShell } from '@/components/route-shell';

/* A shell until this screen is migrated; the security tabs link here. */
export const Route = createFileRoute('/_authenticated/security/purge-analysis')({
  staticData: { pageTitle: () => akMT('securityModule.purgeApiAnalyses') },
  component: () => <RouteShell name={akMT('securityModule.purgeApiAnalyses')} />,
});
