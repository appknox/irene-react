import { useState } from 'react';

import type { ApiReportChart, ApiReportRow, ApiSavedReportColumn } from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { ReportChart } from './report-chart';

interface VisualizationCardProps {
  title: string;
  chart: ApiReportChart;
  rows: ApiReportRow[];
  columns: ApiSavedReportColumn[];
}

/**
 * The report's chart, below the table as the design places it, which folds
 * away to its heading. It is drawn from every row, whatever the table is
 * filtered to.
 *
 * @param props.title - The report's title, which names the chart for screen readers.
 * @param props.chart - Luna's choice of chart.
 * @param props.rows - Every row of the report.
 * @param props.columns - The report's columns, for labels.
 */
export function VisualizationCard({ title, chart, rows, columns }: Readonly<VisualizationCardProps>) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section
      aria-label={akMT('reportModule.view.visualization')}
      className="rounded-md border border-border bg-background"
      data-test-report-visualization
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <AkTypography fontWeight="medium" className="flex items-center gap-2">
          <AkIcon name="material-symbols:bar-chart" className="text-primary" />

          {akMT('reportModule.view.visualization')}
        </AkTypography>

        <AkIconButton
          size="small"
          aria-expanded={!collapsed}
          aria-label={collapsed ? akMT('reportModule.view.expandChart') : akMT('reportModule.view.collapseChart')}
          onClick={() => setCollapsed(!collapsed)}
        >
          <AkIcon name={collapsed ? 'material-symbols:keyboard-arrow-down' : 'material-symbols:keyboard-arrow-up'} />
        </AkIconButton>
      </div>

      {!collapsed && (
        <div className="border-t border-border p-4">
          <ReportChart title={title} chart={chart} rows={rows} columns={columns} />
        </div>
      )}
    </section>
  );
}
