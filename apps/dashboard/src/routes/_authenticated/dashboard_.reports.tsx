import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { ReportLayout } from '@/layouts/report-layout';

/* Reporting is its own product, so it renders its own layout rather than the dashboard's. */
export const Route = createFileRoute('/_authenticated/dashboard_/reports')({
  staticData: { pageTitle: () => akMT('reportModule.title') },
  component: ReportLayout,
});
