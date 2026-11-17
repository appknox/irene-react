import { useMemo, useState } from 'react';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import type { ApiReportRow } from '@irene/api/services/saved-report';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';

import { formatCellValue } from '@/features/reports/utils';

import type { ViewColumn } from './state';

/** The page sizes on offer, as irene has them. */
const REPORT_PAGE_SIZES = [10, 25, 50] as const;

/** How much of a long value shows before "more details", as irene cuts it. */
const LONG_VALUE = 1000;

const DATE_TYPES = new Set(['datetime', 'date']);

const rowColumn = createAkTableColumns<ApiReportRow>();

/**
 * A cell's text: dates with the month named, everything else as it is.
 * Unlike irene, `false` and `0` show rather than reading as blank.
 */
const _cellText = (value: unknown, type: string) =>
  DATE_TYPES.has(type) && value ? formatDateTime(String(value), 'mediumDate') : formatCellValue(value);

/** A value longer than irene shows in full, cut short with a toggle. */
function LongValue({ text }: Readonly<{ text: string }>) {
  const [expanded, setExpanded] = useState(false);

  return (
    <span className="whitespace-pre-wrap">
      {expanded ? text : `${text.slice(0, LONG_VALUE)}…`}{' '}

      <AkButton variant="text" color="primary" noPadding className="h-fit" onClick={() => setExpanded(!expanded)}>
        {expanded ? akMT('lessDetails') : akMT('moreDetails')}
      </AkButton>
    </span>
  );
}

interface ReportTableProps {
  title: string;
  columns: ViewColumn[];
  rows: ApiReportRow[];
  count: number;
  limit: number;
  offset: number;
  onPage: (page: { limit: number; offset: number }) => void;
}

/**
 * One page of a report's rows in the view's shown columns, with the page size,
 * the range and previous and next.
 *
 * @param props.title - The report's title, used as the table's caption.
 * @param props.columns - The view's columns; only the shown ones are drawn.
 * @param props.rows - The rows of this page.
 * @param props.count - How many rows match.
 * @param props.limit - The page size.
 * @param props.offset - The first row of this page.
 * @param props.onPage - Moves to another page or page size.
 */
export function ReportTable(props: Readonly<ReportTableProps>) {
  const { title, columns, rows, count, limit, offset, onPage } = props;

  const tableColumns = useMemo(
    () =>
      rowColumn.columns(
        columns
          .filter((column) => column.selected)
          .map((column) =>
            rowColumn.accessor((row) => _cellText(row[column.field], column.type), {
              id: column.field,
              header: () => column.label,
              cell: ({ getValue }) =>
                getValue().length > LONG_VALUE ? (
                  <LongValue text={getValue()} />
                ) : (
                  <AkTypography tag="span">{getValue()}</AkTypography>
                ),
            })
          )
      ),
    [columns]
  );

  const lastRow = Math.min(offset + rows.length, count);

  return (
    <div className="flex flex-col" data-test-report-table>
      <div className="overflow-x-auto">
        <AkTable columns={tableColumns} data={rows} caption={title} dense />
      </div>

      <div className="
        flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background px-4 py-2
      ">
        <div className="flex items-center gap-2">
          <AkTypography variant="body2" color="textSecondary">
            {akMT('recordPerPage')}
          </AkTypography>

          <AkSelect value={String(limit)} onValueChange={(value) => onPage({ limit: Number(value), offset: 0 })}>
            <AkSelectTrigger aria-label={akMT('recordPerPage')} size="sm" className="w-20">
              <AkSelectValue />
            </AkSelectTrigger>

            <AkSelectContent position="popper">
              {REPORT_PAGE_SIZES.map((size) => (
                <AkSelectItem key={size} value={String(size)}>
                  {size}
                </AkSelectItem>
              ))}
            </AkSelectContent>
          </AkSelect>
        </div>

        <AkTypography variant="body2" color="textSecondary" className="tabular-nums" data-test-report-page-range>
          {akMT('reportModule.savedReports.pageRange', { from: count === 0 ? 0 : offset + 1, to: lastRow, count })}
        </AkTypography>

        <AkIconButton
          size="small"
          aria-label={akMT('reportModule.savedReports.previousPage')}
          disabled={offset === 0}
          onClick={() => onPage({ limit, offset: Math.max(offset - limit, 0) })}
        >
          <AkIcon name="material-symbols:chevron-left" />
        </AkIconButton>

        <AkIconButton
          size="small"
          aria-label={akMT('reportModule.savedReports.nextPage')}
          disabled={lastRow >= count}
          onClick={() => onPage({ limit, offset: offset + limit })}
        >
          <AkIcon name="material-symbols:chevron-right" />
        </AkIconButton>
      </div>
    </div>
  );
}
