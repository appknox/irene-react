import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import type { ApiReportChart, ApiSavedReportColumn } from '@irene/api/services/saved-report';
import { akMT } from '@irene/translations/intl';

import {
  buildReportChartOption,
  formatCellValue,
  getLunaErrorMessage,
  getVisibleColumns,
} from '@/features/reports/utils';

const COLUMNS: ApiSavedReportColumn[] = [
  { field: 'month', label: 'Month', type: 'string', is_default: true },
  { field: 'platform', label: 'Platform', type: 'string', is_default: true },
  { field: 'uploads', label: 'Uploads', type: 'integer', is_default: true },
  { field: 'id', label: 'ID', type: 'integer', is_default: false },
];

/** A failed request carrying this body, as axios rejects. */
const refusal = (data: unknown) =>
  new AxiosError('refused', '400', undefined, undefined, {
    status: 400,
    statusText: 'Bad Request',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('getVisibleColumns', () => {
  it('shows the report’s defaults when the view names no columns', () => {
    expect(getVisibleColumns(COLUMNS, {}).map((c) => c.field)).toEqual(['month', 'platform', 'uploads']);
  });

  it('shows every column when none is a default', () => {
    const columns = COLUMNS.map((column) => ({ ...column, is_default: false }));

    expect(getVisibleColumns(columns, { columns: null })).toEqual(columns);
  });

  it('follows the view’s order and skips names the report no longer has', () => {
    expect(getVisibleColumns(COLUMNS, { columns: ['uploads', 'gone', 'id'] }).map((c) => c.field)).toEqual([
      'uploads',
      'id',
    ]);
  });
});

describe('formatCellValue', () => {
  it('writes missing values as blank and lists as text', () => {
    expect(formatCellValue(null)).toBe('');
    expect(formatCellValue(undefined)).toBe('');
    expect(formatCellValue(['M1', 'M2'])).toBe('M1, M2');
    expect(formatCellValue(0)).toBe('0');
  });
});

describe('getLunaErrorMessage', () => {
  it('uses Luna’s own message', () => {
    expect(getLunaErrorMessage(refusal({ error: true, message: 'Give the report a name.' }))).toBe(
      'Give the report a name.'
    );
  });

  it('falls back to the generic message', () => {
    expect(getLunaErrorMessage(refusal({}))).toBe(akMT('somethingWentWrong'));
    expect(getLunaErrorMessage(new Error('offline'))).toBe(akMT('somethingWentWrong'));
  });
});

describe('buildReportChartOption', () => {
  const rows = [
    { month: '2026-09', platform: 'Android', uploads: 3 },
    { month: '2026-09', platform: 'iOS', uploads: 2 },
    { month: '2026-10', platform: 'Android', uploads: 5 },
  ];

  it('draws a line per total over time', () => {
    const chart: ApiReportChart = { type: 'line', x: 'month', y: ['uploads'], series: null };
    const option = buildReportChartOption(chart, rows, COLUMNS);

    expect(option).toMatchObject({
      xAxis: { data: ['2026-09', '2026-10'], name: 'Month' },
      series: [{ name: 'Uploads', type: 'line', data: [3, 2, 5] }],
    });
  });

  it('stacks bars by the series column, totalled per category', () => {
    const chart: ApiReportChart = { type: 'stacked_bar', x: 'month', y: ['uploads'], series: 'platform' };
    const option = buildReportChartOption(chart, rows, COLUMNS);

    expect(option).toMatchObject({
      xAxis: { data: ['2026-09', '2026-10'] },
      series: [
        { name: 'Android', stack: 'total', data: [3, 5] },
        { name: 'iOS', stack: 'total', data: [2, 0] },
      ],
      legend: { show: true },
    });
  });

  it('treats a value that is not a number as zero', () => {
    const chart: ApiReportChart = { type: 'bar', x: 'platform', y: ['uploads'], series: null };
    const option = buildReportChartOption(chart, [{ platform: 'Android', uploads: 'n/a' }], COLUMNS);

    expect(option).toMatchObject({ series: [{ type: 'bar', data: [0] }] });
  });

  it('draws nothing for figures, a chart without an axis, or no rows', () => {
    expect(buildReportChartOption({ type: 'number', x: null, y: ['uploads'], series: null }, rows, COLUMNS)).toBeNull();
    expect(buildReportChartOption({ type: 'bar', x: null, y: ['uploads'], series: null }, rows, COLUMNS)).toBeNull();
    expect(buildReportChartOption({ type: 'bar', x: 'month', y: ['uploads'], series: null }, [], COLUMNS)).toBeNull();
  });
});
