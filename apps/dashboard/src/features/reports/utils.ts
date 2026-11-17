import type {
  ApiLunaError,
  ApiReportChart,
  ApiReportRow,
  ApiSavedReportColumn,
  ApiSavedReportViewConfig,
} from '@irene/api/services/saved-report';
import { getApiErrorPayload } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { getCSSVariableValue } from '@irene/ui/css-variable';
import type { AkChartOption } from '@irene/ui/ak-chart';

/** The palette a report chart's series take in turn; a canvas resolves no variable, so each is read here. */
const SERIES_COLOUR_VARIABLES = [
  ['--color-primary', '#fe4d3f'],
  ['--color-info', '#0b7ce4'],
  ['--color-warning', '#f5b11e'],
  ['--color-success', '#22c55e'],
  ['--color-severity-low', '#22d3ee'],
  ['--color-foreground-muted', '#7b7b7b'],
] as const;

/** The widest a bar is drawn, so a report with two groups does not fill the card with two slabs. */
const BAR_MAX_WIDTH = 56;

/**
 * What Luna said went wrong, since its messages are written for the reader.
 *
 * @param error - Whatever the request rejected with.
 * @returns Luna's message, or the generic one when it gave none.
 */
export function getLunaErrorMessage(error: unknown) {
  return getApiErrorPayload<ApiLunaError>(error)?.message || akMT('somethingWentWrong');
}

/**
 * The columns a saved report shows, in its order.
 *
 * A view that names no columns shows the report's defaults, as generated; a
 * name the report no longer has is skipped rather than drawn empty.
 *
 * @param columns - Every column the report can show.
 * @param viewConfig - The saved view settings.
 * @returns The columns to draw.
 */
export function getVisibleColumns(
  columns: ApiSavedReportColumn[],
  viewConfig: ApiSavedReportViewConfig
): ApiSavedReportColumn[] {
  if (!viewConfig.columns) {
    const defaults = columns.filter((column) => column.is_default);

    return defaults.length > 0 ? defaults : columns;
  }

  const byField = new Map(columns.map((column) => [column.field, column]));

  return viewConfig.columns.flatMap((field) => byField.get(field) ?? []);
}

/**
 * A cell's value as text, so a missing value is blank rather than "null".
 *
 * @param value - The value in the row.
 * @returns The text to show.
 */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return Array.isArray(value) ? value.join(', ') : String(value);
}

/**
 * The chart for a report's rows, drawn the way Luna chose: a line over time,
 * bars per group, or bars stacked by a second group.
 *
 * Every row is drawn, whatever the table is filtered to, as the design asks.
 *
 * @param chart - Luna's choice of chart; `number` reports are tiles, not drawn here.
 * @param rows - Every row of the report.
 * @param columns - The report's columns, for the axis and series names.
 * @returns The option to hand `AkChart`, or null when there is nothing to draw.
 */
export function buildReportChartOption(
  chart: ApiReportChart,
  rows: ApiReportRow[],
  columns: ApiSavedReportColumn[]
): AkChartOption | null {
  const { x } = chart;

  if (chart.type === 'number' || !x || rows.length === 0) {
    return null;
  }

  const labelOf = new Map(columns.map((column) => [column.field, column.label]));
  const colours = SERIES_COLOUR_VARIABLES.map(([name, fallback]) => getCSSVariableValue(name, fallback));
  const categories = [...new Set(rows.map((row) => formatCellValue(row[x])))];

  const series =
    chart.type === 'stacked_bar' && chart.series
      ? _stackedSeries(rows, x, chart.series, chart.y[0] ?? '', categories)
      : chart.y.map((field) => ({
          name: labelOf.get(field) ?? field,
          type: chart.type === 'line' ? 'line' : 'bar',
          barMaxWidth: BAR_MAX_WIDTH,
          data: rows.map((row) => Number(row[field]) || 0),
        }));

  return {
    color: colours,
    tooltip: { trigger: 'axis' },
    legend: { show: series.length > 1, bottom: 0 },
    grid: { left: 8, right: 8, top: 16, bottom: series.length > 1 ? 40 : 8, containLabel: true },
    xAxis: { type: 'category', data: categories, name: labelOf.get(x) ?? x },
    yAxis: { type: 'value' },
    series,
  };
}

/** One stacked series per value of the series column, totalled per category. */
function _stackedSeries(
  rows: ApiReportRow[],
  x: string,
  seriesField: string,
  total: string,
  categories: string[]
) {
  const groups = [...new Set(rows.map((row) => formatCellValue(row[seriesField])))];

  return groups.map((group) => ({
    name: group,
    type: 'bar',
    stack: 'total',
    barMaxWidth: BAR_MAX_WIDTH,
    data: categories.map((category) =>
      rows
        .filter(
          (row) => formatCellValue(row[x]) === category && formatCellValue(row[seriesField]) === group
        )
        .reduce((sum, row) => sum + (Number(row[total]) || 0), 0)
    ),
  }));
}
