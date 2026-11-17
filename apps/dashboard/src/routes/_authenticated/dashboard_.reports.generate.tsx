import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { GeneratePage } from '@/features/reports/pages/generate';

export const Route = createFileRoute('/_authenticated/dashboard_/reports/generate')({
  staticData: { pageTitle: () => akMT('reportModule.generateReport') },
  component: GeneratePage,
});
