import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { AnalyticsPage } from '@/features/dashboard/pages/analytics';

export const Route = createFileRoute('/_authenticated/dashboard/analytics')({
  staticData: { pageTitle: () => akMT('analytics') },
  component: AnalyticsPage,
});
