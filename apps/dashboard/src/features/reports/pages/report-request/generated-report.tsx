import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ReportRequestService, type ApiReportRequest } from '@irene/api/services/report-request';
import { SavedReportService } from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { hasSavedReports } from '@/features/reports/guards';
import { reportPreviewOptions } from '@/features/reports/queries/report-requests';
import { savedReportKeys, savedReportsOptions } from '@/features/reports/queries/saved-reports';
import { DownloadDrawer } from '@/features/reports/report-view/download-drawer';
import { ReportBody } from '@/features/reports/report-view/report-body';
import { ReportHeader } from '@/features/reports/report-view/report-header';
import { SaveReportDrawer } from '@/features/reports/report-view/save-report-drawer';
import { getFreeReportName } from '@/features/reports/report-view/state';
import { FIRST_PAGE, useReportView } from '@/features/reports/report-view/use-report-view';
import { REPORT_NAME_MAX_LENGTH } from '@/features/reports/schemas/report-name';
import { getLunaErrorMessage } from '@/features/reports/utils';

/**
 * A generated report: its table and chart, with columns, filters, download
 * and, where the organization has saved reports, Save.
 *
 * Saving keeps the columns and filters on screen, then opens the saved report.
 *
 * @param props.request - The answered request.
 */
export function GeneratedReport({ request }: Readonly<{ request: ApiReportRequest }>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canSave = hasSavedReports();
  const [isSaving, setIsSaving] = useState(false);
  /* The first page brings the report's columns; with the view untouched it is the same request as the table's. */
  const preview = useQuery(reportPreviewOptions(request.id, FIRST_PAGE, []));
  const view = useReportView(preview.data?.columns);
  const page = useQuery(reportPreviewOptions(request.id, view.page, view.filterSections));
  const savedNames = useQuery({ ...savedReportsOptions(''), enabled: canSave });
  const title = page.data?.title ?? preview.data?.title ?? '';

  const defaultName = getFreeReportName(
    title || request.query,
    (savedNames.data?.items ?? []).map((report) => report.name),
    REPORT_NAME_MAX_LENGTH
  );

  return (
    <div className="flex min-h-full flex-col" data-test-generated-report>
      <ReportHeader
        crumb={akMT('reportModule.reportGenerated')}
        title={
          <AkTypography variant="h5" tag="h1" data-test-report-title>
            {title}
          </AkTypography>
        }
        query={request.query}
        saveState={canSave ? { kind: 'notSaved' } : undefined}
        actions={
          <>
            {canSave && (
              <AkButton
                variant="outlined"
                color="neutral"
                disabled={!page.data}
                leftIcon={<AkIcon name="material-symbols:bookmark" />}
                onClick={() => setIsSaving(true)}
                data-test-save-report
              >
                {akMT('reportModule.savedReports.saveReport')}
              </AkButton>
            )}

            <DownloadDrawer
              defaultType={request.report_type}
              disabled={!page.data || page.data.pagination.count === 0}
              getUrl={(type) =>
                ReportRequestService.getReportDownloadUrl(request.id, {
                  report_type: type,
                  columns: view.columns
                    .filter((column) => column.selected)
                    .map(({ field, label }) => ({ field, label })),
                  filter_details: view.filterSections,
                })
              }
            />
          </>
        }
      />

      <ReportBody
        preview={page.data}
        isLoading={preview.isPending}
        error={page.isError ? getLunaErrorMessage(page.error) : null}
        columns={view.columns}
        filters={view.filters}
        page={view.page}
        onColumnsChange={view.setColumns}
        onColumnsReset={view.resetColumns}
        onFiltersApply={view.applyFilters}
        onPage={view.setPage}
      />

      {canSave && (
        <SaveReportDrawer
          open={isSaving}
          onOpenChange={setIsSaving}
          title={akMT('reportModule.savedReports.saveReport')}
          submitLabel={akMT('reportModule.savedReports.saveReport')}
          defaultName={defaultName}
          save={(name) =>
            SavedReportService.saveReport({ report_request: request.id, name, view_config: view.viewConfig })
          }
          onSaved={(report) => {
            queryClient.setQueryData(savedReportKeys.detail(report.id), report);
            void queryClient.invalidateQueries({ queryKey: savedReportKeys.lists() });

            akNotify.success(akMT('reportModule.view.reportSaved'), {
              description: akMT('reportModule.view.reportSavedBody', { name: report.name }),
            });

            void navigate({ to: '/dashboard/reports/saved/$savedReportId', params: { savedReportId: report.id } });
          }}
        />
      )}
    </div>
  );
}
