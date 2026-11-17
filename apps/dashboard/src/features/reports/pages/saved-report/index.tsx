import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';

import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

import { savedReportOptions } from '@/features/reports/queries/saved-reports';

import { SavedReportView } from './components/saved-report-view';

const route = getRouteApi('/_authenticated/dashboard_/reports/saved/$savedReportId');

/**
 * One saved report: its name (renamable), the question it answers, when its
 * rows were fetched, Refresh and Download, the chart and a page of the rows in
 * the saved columns.
 *
 * A report that is gone, or was never the account's, reads as not available,
 * with the way back to the list.
 */
export function SavedReportPage() {
  const { savedReportId } = route.useParams();
  const report = useQuery(savedReportOptions(savedReportId));

  if (report.isPending) {
    return <_ReportSkeleton />;
  }

  if (report.isError) {
    return <_ReportUnavailable notFound={getApiErrorStatus(report.error) === HTTP_STATUS_CODES.NOT_FOUND} />;
  }

  return <SavedReportView key={report.data.id} report={report.data} />;
}

/** Shaped like the page, while the report loads. */
function _ReportSkeleton() {
  return (
    <section className="flex flex-col gap-4 p-6" data-test-saved-report-loading>
      <AkSkeleton width="240px" height="28px" />

      <AkSkeleton width="60%" height="18px" />

      <AkSkeleton height="320px" />
    </section>
  );
}

/** What stands in for a report that is gone, never was the account's, or could not be read. */
function _ReportUnavailable({ notFound }: Readonly<{ notFound: boolean }>) {
  return (
    <section className="flex flex-col items-center gap-3 p-16 text-center" data-test-saved-report-unavailable>
      <AkTypography variant="h6" tag="h1">
        {notFound
          ? akMT('reportModule.savedReports.notAvailableTitle')
          : akMT('reportModule.savedReports.loadFailedTitle')}
      </AkTypography>

      <AkTypography color="textSecondary" className="max-w-120">
        {notFound
          ? akMT('reportModule.savedReports.notAvailableBody')
          : akMT('reportModule.savedReports.loadFailedBody')}
      </AkTypography>

      <AkButton asChild variant="outlined">
        <Link to="/dashboard/reports/generate">{akMT('reportModule.view.generateAReport')}</Link>
      </AkButton>
    </section>
  );
}
