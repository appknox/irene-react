import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { requireSavedReports } from '@/features/reports/guards';
import { SavedReportPage } from '@/features/reports/pages/saved-report';

export const Route = createFileRoute('/_authenticated/dashboard_/reports/saved/$savedReportId')({
  staticData: { pageTitle: () => akMT('reportModule.savedReports.title') },
  /* A non-numeric id parses to 0, which no report has, so the page shows "not available" rather than failing. */
  params: {
    parse: ({ savedReportId }) => ({ savedReportId: z.coerce.number().int().catch(0).parse(savedReportId) }),
    stringify: ({ savedReportId }) => ({ savedReportId: String(savedReportId) }),
  },
  beforeLoad: ({ context }) => requireSavedReports(context.queryClient, context.session.userId),
  component: SavedReportPage,
});
