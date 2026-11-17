import { useMemo } from 'react';

import type {
  ApiReportChart,
  ApiReportRow,
  ApiSavedReportColumn,
} from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';
import { AkChart } from '@irene/ui/ak-chart';
import { AkTypography } from '@irene/ui/ak-typography';

import { buildReportChartOption, formatCellValue } from '@/features/reports/utils';

interface ReportChartProps {
  title: string;
  chart: ApiReportChart;
  rows: ApiReportRow[];
  columns: ApiSavedReportColumn[];
}

/**
 * The chart Luna chose for the report, drawn from every row whatever the table
 * is filtered to: totals without a split as figures, everything else on
 * ECharts.
 *
 * @param props.title - The report's title, which names the chart for screen readers.
 * @param props.chart - Luna's choice of chart.
 * @param props.rows - Every row of the report.
 * @param props.columns - The report's columns, for labels.
 */
export function ReportChart({ title, chart, rows, columns }: Readonly<ReportChartProps>) {
  const option = useMemo(() => buildReportChartOption(chart, rows, columns), [chart, rows, columns]);

  if (chart.type === 'number') {
    const labelOf = new Map(columns.map((column) => [column.field, column.label]));

    return (
      <div className="flex flex-wrap gap-4" data-test-report-figures>
        {chart.y.map((field) => (
          <div key={field} className="flex min-w-40 flex-col gap-1 rounded-md bg-background-subtle p-4">
            <AkTypography color="textSecondary">{labelOf.get(field) ?? field}</AkTypography>

            <AkTypography variant="h4" className="tabular-nums">
              {formatCellValue(rows[0]?.[field])}
            </AkTypography>
          </div>
        ))}
      </div>
    );
  }

  if (!option) {
    return null;
  }

  return (
    <div data-test-report-chart>
      <AkChart
        option={option}
        className="h-80 w-full"
        ariaLabel={akMT('reportModule.savedReports.chartLabel', { title })}
      />
    </div>
  );
}
