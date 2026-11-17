import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import { SavedReportService, type ApiSavedReport } from '@irene/api/services/saved-report';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { formatDateTime, formatRelativeTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription, AkAlertTitle } from '@irene/ui/ak-alert';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { DeleteReportDialog } from '@/features/reports/components/delete-report-dialog';
import { savedReportKeys, savedReportPreviewOptions } from '@/features/reports/queries/saved-reports';
import { DownloadDrawer } from '@/features/reports/report-view/download-drawer';
import { MoreMenu } from '@/features/reports/report-view/more-menu';
import { ReportBody } from '@/features/reports/report-view/report-body';
import { ReportHeader, type ReportSaveState } from '@/features/reports/report-view/report-header';
import { SaveChangesDrawer } from '@/features/reports/report-view/save-changes-drawer';
import { SaveReportDrawer } from '@/features/reports/report-view/save-report-drawer';
import { getFreeReportName } from '@/features/reports/report-view/state';
import { UnsavedChangesGuard } from '@/features/reports/report-view/unsaved-changes-guard';
import { useReportView } from '@/features/reports/report-view/use-report-view';
import { REPORT_NAME_MAX_LENGTH } from '@/features/reports/schemas/report-name';
import { getLunaErrorMessage } from '@/features/reports/utils';

import { RenameReport } from './rename-report';

/** Which drawer or dialog is open over the report. */
type Overlay = 'saveChanges' | 'saveAsNew' | 'delete' | null;

/**
 * A saved report: the generated table and chart in the saved columns and
 * filters, with every change measured against the saved version.
 *
 * Changes can be saved over the report or as a new one, discarded, or kept
 * while leaving only after confirming. Refresh fetches the rows again without
 * the AI; a failed refresh keeps the old rows and says why.
 *
 * @param props.report - The report.
 */
export function SavedReportView({ report }: Readonly<{ report: ApiSavedReport }>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const view = useReportView(report.columns, report.view_config);
  const isRefreshing = report.snapshot.status === 'refreshing';
  /* Set just before this page navigates away itself (after a copy or a delete), so the guard lets it go. */
  const isLeavingOnPurpose = useRef(false);

  const page = useQuery(
    savedReportPreviewOptions(report.id, view.page, view.filterSections, report.snapshot.refreshed_at)
  );

  const keep = (saved: ApiSavedReport) => {
    queryClient.setQueryData(savedReportKeys.detail(saved.id), saved);
    void queryClient.invalidateQueries({ queryKey: savedReportKeys.lists() });
  };

  const refresh = useMutation({
    mutationFn: () => SavedReportService.refreshSavedReport(report.id),
    onSuccess: (snapshot) => queryClient.setQueryData(savedReportKeys.detail(report.id), { ...report, snapshot }),
    onError: unlessRateLimited((error) => akNotify.error(getLunaErrorMessage(error))),
  });

  const pin = useMutation({
    mutationFn: () => SavedReportService.updateSavedReport(report.id, { pinned: !report.pinned }),
    onSuccess: keep,
    onError: unlessRateLimited((error) => akNotify.error(getLunaErrorMessage(error))),
  });

  const openCopy = (saved: ApiSavedReport) => {
    keep(saved);
    isLeavingOnPurpose.current = true;

    akNotify.success(akMT('reportModule.view.savedAsNew'), {
      description: akMT('reportModule.view.reportSavedBody', { name: saved.name }),
    });

    void navigate({ to: '/dashboard/reports/saved/$savedReportId', params: { savedReportId: saved.id } });
  };

  const saveState: ReportSaveState = view.isChanged
    ? { kind: 'changed', summary: view.changesInWords }
    : { kind: 'saved', when: formatRelativeTime(report.updated_on) };

  return (
    <div className="flex min-h-full flex-col" data-test-saved-report-page>
      <ReportHeader
        crumb={akMT('reportModule.view.savedReport')}
        title={
          <div className="flex min-w-0 items-center gap-1">
            <AkTypography variant="h5" tag="h1" className="truncate" data-test-saved-report-name>
              {report.name}
            </AkTypography>

            <RenameReport report={report} />
          </div>
        }
        query={report.query}
        saveState={saveState}
        meta={
          <span className="flex items-center gap-2">
            <AkTypography variant="body2" color="textSecondary" data-test-saved-report-refreshed>
              {isRefreshing
                ? akMT('reportModule.savedReports.refreshing')
                : akMT('reportModule.view.lastUpdated', {
                    when: formatDateTime(report.snapshot.refreshed_at, 'dateTime'),
                  })}
            </AkTypography>

            <AkButton
              variant="text"
              size="sm"
              disabled={isRefreshing}
              loading={refresh.isPending}
              leftIcon={<AkIcon name="material-symbols:refresh" />}
              onClick={() => refresh.mutate()}
              data-test-refresh-report
            >
              {akMT('refresh')}
            </AkButton>
          </span>
        }
        actions={
          <>
            {view.isChanged ? (
              <AkButton
                variant="outlined"
                color="neutral"
                leftIcon={<AkIcon name="material-symbols:bookmark" />}
                onClick={() => setOverlay('saveChanges')}
                data-test-save-changes
              >
                {akMT('reportModule.view.saveChanges')}
              </AkButton>
            ) : (
              <AkButton variant="outlined" color="neutral" disabled leftIcon={<AkIcon name="material-symbols:check" />}>
                {akMT('reportModule.view.saved')}
              </AkButton>
            )}

            <DownloadDrawer
              defaultType={null}
              disabled={report.snapshot.row_count === 0}
              getUrl={(type) =>
                SavedReportService.getSavedReportDownloadUrl(report.id, {
                  report_type: type,
                  columns: view.columns.filter((column) => column.selected).map((column) => column.field),
                  filter_details: view.filterSections,
                })
              }
            />

            <MoreMenu
              isPinned={report.pinned}
              isChanged={view.isChanged}
              isRefreshing={isRefreshing}
              onSaveAsNew={() => setOverlay('saveAsNew')}
              onTogglePin={() => pin.mutate()}
              onRefresh={() => refresh.mutate()}
              onDiscard={() => {
                view.discard();
                akNotify.success(akMT('reportModule.view.changesDiscarded'));
              }}
              onDelete={() => setOverlay('delete')}
            />
          </>
        }
      />

      {report.snapshot.status === 'failed' && (
        <div className="px-6 pt-4">
          <AkAlert variant="error" data-test-saved-report-refresh-failed>
            <AkIcon name="lucide:octagon-x" />

            <AkAlertTitle>{akMT('reportModule.savedReports.refreshFailed')}</AkAlertTitle>

            <AkAlertDescription>{report.snapshot.error}</AkAlertDescription>
          </AkAlert>
        </div>
      )}

      <ReportBody
        preview={page.data}
        isLoading={page.isPending}
        error={page.isError ? getLunaErrorMessage(page.error) : null}
        columns={view.columns}
        filters={view.filters}
        page={view.page}
        onColumnsChange={view.setColumns}
        onColumnsReset={view.resetColumns}
        onFiltersApply={view.applyFilters}
        onPage={view.setPage}
      />

      <SaveChangesDrawer
        open={overlay === 'saveChanges'}
        onOpenChange={(open) => setOverlay(open ? 'saveChanges' : null)}
        reportName={report.name}
        whatChanged={view.changesInWords}
        copyName={getFreeReportName(report.name, [report.name], REPORT_NAME_MAX_LENGTH)}
        update={() => SavedReportService.updateSavedReport(report.id, { view_config: view.viewConfig })}
        saveAsNew={(name) => SavedReportService.copySavedReport(report.id, { name, view_config: view.viewConfig })}
        onSaved={(saved, asNew) => {
          if (asNew) {
            openCopy(saved);

            return;
          }

          keep(saved);
          view.discard();
          akNotify.success(akMT('reportModule.view.reportUpdated'));
        }}
      />

      <SaveReportDrawer
        open={overlay === 'saveAsNew'}
        onOpenChange={(open) => setOverlay(open ? 'saveAsNew' : null)}
        title={akMT('reportModule.view.saveAsNew')}
        submitLabel={akMT('reportModule.view.saveAsNew')}
        defaultName={getFreeReportName(report.name, [report.name], REPORT_NAME_MAX_LENGTH)}
        save={(name) => SavedReportService.copySavedReport(report.id, { name, view_config: view.viewConfig })}
        onSaved={openCopy}
      />

      <DeleteReportDialog
        report={report}
        open={overlay === 'delete'}
        onOpenChange={(open) => setOverlay(open ? 'delete' : null)}
        onDeleted={() => {
          isLeavingOnPurpose.current = true;
          void navigate({ to: '/dashboard/reports/generate' });
        }}
      />

      <UnsavedChangesGuard
        shouldBlock={() => view.isChanged && !isLeavingOnPurpose.current}
        reportName={report.name}
        onSaveAndLeave={() => setOverlay('saveChanges')}
      />
    </div>
  );
}
