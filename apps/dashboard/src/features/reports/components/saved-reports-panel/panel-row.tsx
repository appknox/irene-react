import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type KeyboardEvent } from 'react';

import { AkMenu, AkMenuContent, AkMenuItem, AkMenuTrigger } from '@irene/ui/ak-menu';

import { SavedReportService, type ApiSavedReportSummary } from '@irene/api/services/saved-report';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { cn } from '@irene/ui/cn';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { DeleteReportDialog } from '@/features/reports/components/delete-report-dialog';
import { savedReportKeys } from '@/features/reports/queries/saved-reports';
import { REPORT_NAME_MAX_LENGTH } from '@/features/reports/schemas/report-name';
import { getLunaErrorMessage } from '@/features/reports/utils';

interface PanelRowProps {
  report: ApiSavedReportSummary;
  isActive: boolean;
  now: Date;
  onDeleted: (report: ApiSavedReportSummary) => void;
}

/**
 * When a report last changed, as the panel shows it: the time for today, the
 * date before that.
 */
const _changedAt = (report: ApiSavedReportSummary, now: Date) =>
  new Date(report.updated_on).toDateString() === now.toDateString()
    ? formatDateTime(report.updated_on, 'time')
    : formatDateTime(report.updated_on, 'mediumDate');

/**
 * One saved report in the panel: an icon for a chart or a table, the name
 * (which opens it), what it holds and when it changed, and a menu to rename it
 * in place, pin or unpin it, or delete it.
 *
 * @param props.report - The report.
 * @param props.isActive - Whether it is the report open on the page.
 * @param props.now - The time the panel counts from.
 * @param props.onDeleted - Runs once the report is deleted.
 */
export function PanelRow({ report, isActive, now, onDeleted }: Readonly<PanelRowProps>) {
  const queryClient = useQueryClient();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const update = useMutation({
    mutationFn: (changes: { name?: string; pinned?: boolean }) =>
      SavedReportService.updateSavedReport(report.id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(savedReportKeys.detail(report.id), updated);
      void queryClient.invalidateQueries({ queryKey: savedReportKeys.lists() });
      setIsRenaming(false);
    },
    onError: unlessRateLimited((error) => {
      akNotify.error(getLunaErrorMessage(error));
    }),
  });

  const finishRename = (name: string) => {
    const trimmed = name.trim();

    if (!trimmed || trimmed === report.name) {
      setIsRenaming(false);
    } else {
      update.mutate({ name: trimmed });
    }
  };

  const onRenameKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      finishRename(event.currentTarget.value);
    } else if (event.key === 'Escape') {
      setIsRenaming(false);
    }
  };

  const subtitle = [
    report.has_chart
      ? akMT('reportModule.savedReports.tableAndChart')
      : akMT('reportModule.savedReports.tableOnly'),
    _changedAt(report, now),
  ].join(' · ');

  return (
    <li
      className={cn(
        'group relative flex items-center gap-2.5 rounded-sm px-2 py-1.75 hover:bg-hover-light',
        isActive && 'bg-primary/10 hover:bg-primary/10'
      )}
      data-test-saved-reports-panel-row
    >
      <span className="
        flex size-7 shrink-0 items-center justify-center rounded-sm border border-border
        bg-background
      ">
        <AkIcon
          name={report.has_chart ? 'material-symbols:bar-chart' : 'material-symbols:table-chart-outline'}
          className="text-foreground-muted"
        />
      </span>

      {isRenaming ? (
        <input
          autoFocus
          defaultValue={report.name}
          maxLength={REPORT_NAME_MAX_LENGTH}
          aria-label={akMT('reportModule.savedReports.reportName')}
          disabled={update.isPending}
          className="
            min-w-0 flex-1 rounded-sm border border-primary bg-background px-2 py-1 text-base
          "
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={onRenameKey}
          onBlur={(event) => finishRename(event.currentTarget.value)}
          data-test-saved-reports-panel-rename
        />
      ) : (
        <Link
          to="/dashboard/reports/saved/$savedReportId"
          params={{ savedReportId: report.id }}
          className="flex min-w-0 flex-1 flex-col"
          aria-current={isActive ? 'page' : undefined}
        >
          <AkTypography tag="span" fontWeight={isActive ? 'medium' : undefined} className="block" noWrap>
            {report.name}
          </AkTypography>

          <AkTypography tag="span" variant="body2" color="textSecondary" className="block" noWrap>
            {subtitle}
          </AkTypography>
        </Link>
      )}

      <AkMenu>
        <AkMenuTrigger asChild>
          <AkIconButton
            size="small"
            aria-label={akMT('reportModule.savedReports.moreFor', { name: report.name })}
            className="
              opacity-0
              group-focus-within:opacity-100
              group-hover:opacity-100
              data-[state=open]:opacity-100
            "
          >
            <AkIcon name="material-symbols:more-horiz" />
          </AkIconButton>
        </AkMenuTrigger>

        {/* Focus is not handed back to the trigger: the drawer or rename field just opened keeps it. */}
      <AkMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <AkMenuItem onSelect={() => setIsRenaming(true)}>
            <AkIcon name="material-symbols:edit-outline" />
            {akMT('reportModule.savedReports.renameShort')}
          </AkMenuItem>

          <AkMenuItem onSelect={() => update.mutate({ pinned: !report.pinned })}>
            <AkIcon name={report.pinned ? 'material-symbols:push-pin' : 'material-symbols:push-pin-outline'} />
            {report.pinned ? akMT('reportModule.savedReports.unpin') : akMT('reportModule.savedReports.pin')}
          </AkMenuItem>

          <AkMenuItem className="text-danger" onSelect={() => setIsDeleting(true)}>
            <AkIcon name="material-symbols:delete-outline" />
            {akMT('delete')}
          </AkMenuItem>
        </AkMenuContent>
      </AkMenu>

      <DeleteReportDialog
        report={report}
        open={isDeleting}
        onOpenChange={setIsDeleting}
        onDeleted={() => onDeleted(report)}
      />
    </li>
  );
}
