import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { SecurityLayout } from '@/layouts/security-layout';

/* The security dashboard is its own product, with a layout that carries its tabs in the bar. */
export const Route = createFileRoute('/_authenticated/security')({
  staticData: { pageTitle: () => akMT('securityDashboard') },
  component: SecurityLayout,
});
