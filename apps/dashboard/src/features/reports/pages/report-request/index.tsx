import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';

import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';

import { isReportRequestDone, reportRequestOptions } from '@/features/reports/queries/report-requests';
import { ReportMessage } from '@/features/reports/report-view/report-body';

import { GeneratedReport } from './generated-report';

const route = getRouteApi('/_authenticated/dashboard_/reports/preview/$reportRequestId');

/**
 * A report just generated from a question.
 *
 * A question that could not be answered, or a request that failed, is
 * explained in place as irene explains it, with no call for rows. A request
 * still being generated (a link opened early) waits for Luna.
 */
export function ReportRequestPage() {
  const { reportRequestId } = route.useParams();
  const request = useQuery(reportRequestOptions(reportRequestId));

  if (request.isPending || (request.data && !isReportRequestDone(request.data))) {
    return (
      <section className="flex flex-col gap-3 p-6" data-test-report-request-loading>
        <AkSkeleton width="320px" height="28px" />

        <AkSkeleton height="320px" />
      </section>
    );
  }

  if (request.isError) {
    return getApiErrorStatus(request.error) === HTTP_STATUS_CODES.NOT_FOUND ? (
      <ReportMessage
        title={akMT('reportModule.savedReports.notAvailableTitle')}
        body={akMT('reportModule.view.requestNotFound')}
      />
    ) : (
      <ReportMessage title={akMT('reportModule.failedToPreview')} body={akMT('pleaseTryAgain')} />
    );
  }

  if (!request.data.is_relevant) {
    return request.data.error ? (
      <ReportMessage
        title={akMT('reportModule.somethingWentWrongHeader')}
        body={request.data.error_message || akMT('reportModule.somethingWentWrongDesc')}
      />
    ) : (
      <ReportMessage title={akMT('reportModule.rephrasingErrorHeader')} body={akMT('reportModule.rephrasingErrorDesc')} />
    );
  }

  return <GeneratedReport key={request.data.id} request={request.data} />;
}
