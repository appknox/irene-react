import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OffensiveSecurityLayout } from '@/layouts/offensive-security-layout';

/* Offensive security is its own product, so it renders its own layout rather than the dashboard's. */
export const Route = createFileRoute('/_authenticated/dashboard_/offensive-security')({
  staticData: { pageTitle: () => akMT('offensiveSecurity.title') },
  component: OffensiveSecurityLayout,
});
