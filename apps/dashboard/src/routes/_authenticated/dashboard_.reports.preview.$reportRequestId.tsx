import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { ReportRequestPage } from '@/features/reports/pages/report-request';

export const Route = createFileRoute('/_authenticated/dashboard_/reports/preview/$reportRequestId')({
  staticData: { pageTitle: () => akMT('reportModule.preview') },
  /* A non-numeric id parses to 0, which no request has, so the page says it is not available. */
  params: {
    parse: ({ reportRequestId }) => ({
      reportRequestId: z.coerce.number().int().catch(0).parse(reportRequestId),
    }),
    stringify: ({ reportRequestId }) => ({ reportRequestId: String(reportRequestId) }),
  },
  component: ReportRequestPage,
});
