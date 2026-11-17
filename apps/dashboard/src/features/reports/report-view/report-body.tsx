import type { ApiReportPreview } from '@irene/api/services/report-request';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import NoApisCaptured from '@irene/ui/svgs/no-apis-captured.svg?react';

import { ColumnsPopover } from './columns-popover';
import { FiltersPopover } from './filters-popover';
import { ReportTable } from './report-table';
import { VisualizationCard } from './visualization-card';

import type { FilterCondition, ViewColumn } from './state';

interface ReportBodyProps {
  preview: ApiReportPreview | undefined;
  isLoading: boolean;
  error: string | null;
  columns: ViewColumn[];
  filters: FilterCondition[];
  page: { limit: number; offset: number };
  onColumnsChange: (columns: ViewColumn[]) => void;
  onColumnsReset: () => void;
  onFiltersApply: (filters: FilterCondition[]) => void;
  onPage: (page: { limit: number; offset: number }) => void;
}

/** A message standing in for the table: no rows, no columns, or a failure. */
export function ReportMessage({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center" data-test-report-message>
      <NoApisCaptured className="h-32 w-auto" aria-hidden />

      <AkTypography variant="h6" tag="h2">
        {title}
      </AkTypography>

      <AkTypography color="textSecondary" className="max-w-100">
        {body}
      </AkTypography>
    </div>
  );
}

/**
 * The report's data: the default-filter notice, the column and filter
 * controls, the table, and the chart below it.
 *
 * @param props.preview - The page Luna sent, once it has.
 * @param props.isLoading - Whether the first page is still loading.
 * @param props.error - Why the page could not be read, if it could not.
 * @param props.columns - The view's columns.
 * @param props.filters - The applied conditions.
 * @param props.page - The page size and first row.
 * @param props.onColumnsChange - Receives new columns.
 * @param props.onColumnsReset - Goes back to the report's own columns.
 * @param props.onFiltersApply - Receives the conditions to apply.
 * @param props.onPage - Moves to another page.
 */
export function ReportBody(props: Readonly<ReportBodyProps>) {
  const { preview, isLoading, error, columns, filters, page } = props;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6" data-test-report-loading>
        <AkSkeleton height="36px" width="320px" />

        <AkSkeleton height="320px" />
      </div>
    );
  }

  if (error || !preview) {
    return <ReportMessage title={akMT('reportModule.failedToPreview')} body={error ?? akMT('pleaseTryAgain')} />;
  }

  const fields = preview.filter_details.flatMap((section) => section.fields);
  const hasDefaultFilters = preview.filter_details.some((section) => section.has_filters);
  const noColumns = columns.every((column) => !column.selected);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-md border border-border bg-background">
        {hasDefaultFilters && (
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5" data-test-report-default-filter>
            <AkIcon name="material-symbols:warning" className="text-foreground" />

            <AkTypography variant="body2">{akMT('reportModule.defaultFilter')}</AkTypography>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <ColumnsPopover columns={columns} onChange={props.onColumnsChange} onReset={props.onColumnsReset} />

          <FiltersPopover
            fields={fields}
            filters={filters}
            rowCount={preview.pagination.count}
            onApply={props.onFiltersApply}
          />
        </div>

        {noColumns ? (
          <ReportMessage
            title={akMT('reportModule.noSelectedColumnsHeader')}
            body={akMT('reportModule.noSelectedColumnsDesc')}
          />
        ) : preview.data.length === 0 ? (
          <ReportMessage title={akMT('noResultsFound')} body={akMT('reportModule.noResultDesc')} />
        ) : (
          <ReportTable
            title={preview.title}
            columns={columns}
            rows={preview.data}
            count={preview.pagination.count}
            limit={page.limit}
            offset={page.offset}
            onPage={props.onPage}
          />
        )}
      </div>

      {preview.chart && preview.chart_data.length > 0 && (
        <VisualizationCard
          title={preview.title}
          chart={preview.chart}
          rows={preview.chart_data}
          columns={preview.columns}
        />
      )}
    </div>
  );
}
