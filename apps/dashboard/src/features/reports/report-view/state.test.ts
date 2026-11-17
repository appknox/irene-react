import { describe, expect, it } from 'vitest';

import type { ApiReportFilterField } from '@irene/api/services/report-request';
import type { ApiSavedReportColumn } from '@irene/api/services/saved-report';

import {
  buildViewColumns,
  describeViewChanges,
  fromFilterSections,
  getFilterOperators,
  getFreeReportName,
  hasViewChanges,
  isConditionComplete,
  normaliseCondition,
  toFilterSections,
  toViewConfig,
  type FilterCondition,
} from './state';

const COLUMNS: ApiSavedReportColumn[] = [
  { field: 'app', label: 'App', type: 'string', is_default: true },
  { field: 'severity', label: 'Severity', type: 'string', is_default: true },
  { field: 'findings', label: 'Findings', type: 'integer', is_default: true },
  { field: 'id', label: 'ID', type: 'integer', is_default: false },
];

const field = (overrides: Partial<ApiReportFilterField>): ApiReportFilterField => ({
  field: 'x',
  label: 'X',
  type: 'string',
  is_nullable: false,
  ...overrides,
});

const shown = (columns: ReturnType<typeof buildViewColumns>) =>
  columns.filter((column) => column.selected).map((column) => column.field);

describe('getFilterOperators', () => {
  it('offers comparisons that fit the column', () => {
    expect(getFilterOperators(field({ choices: [{ value: 'High', label: 'High' }] }))).toEqual([
      'eq',
      'neq',
      'in',
      'not_in',
    ]);

    expect(getFilterOperators(field({ type: 'boolean' }))).toEqual(['eq', 'neq', 'in', 'not_in']);
    expect(getFilterOperators(field({ type: 'integer' }))).toContain('gte');
    expect(getFilterOperators(field({ type: 'datetime' }))[0]).toBe('gte');
    expect(getFilterOperators(field({ type: 'string' }))[0]).toBe('icontains');
  });

  it('offers "is empty" only where a value can be missing', () => {
    expect(getFilterOperators(field({ is_nullable: true }))).toContain('isnull');
    expect(getFilterOperators(field({ is_nullable: false }))).not.toContain('isnull');
  });
});

describe('buildViewColumns', () => {
  it('shows the report’s defaults when nothing was saved', () => {
    expect(shown(buildViewColumns(COLUMNS))).toEqual(['app', 'severity', 'findings']);
  });

  it('shows every column when none is a default', () => {
    const columns = COLUMNS.map((column) => ({ ...column, is_default: false }));

    expect(shown(buildViewColumns(columns))).toHaveLength(4);
  });

  it('follows the saved order, drops names the report lost and keeps the rest hidden', () => {
    const columns = buildViewColumns(COLUMNS, { columns: ['findings', 'gone', 'app'] });

    expect(columns.map((column) => column.field)).toEqual(['findings', 'app', 'severity', 'id']);
    expect(shown(columns)).toEqual(['findings', 'app']);
  });
});

describe('filter sections', () => {
  const filters: FilterCondition[] = [
    { field: 'severity', operator: 'in', value: ['High'] },
    { field: 'findings', operator: 'gte', value: 2 },
  ];

  it('round-trips the conditions', () => {
    expect(fromFilterSections(toFilterSections(filters))).toEqual(filters);
  });

  it('sends no section without conditions', () => {
    expect(toFilterSections([])).toEqual([]);
  });

  it('reads plain values as "is" and skips nested groups', () => {
    expect(
      fromFilterSections([{ id: 'report', filter_details: { severity: 'High', OR: { app: 'x' } } }])
    ).toEqual([{ field: 'severity', operator: 'eq', value: 'High' }]);

    expect(fromFilterSections(undefined)).toEqual([]);
  });
});

describe('toViewConfig', () => {
  it('saves the shown columns in order and the filters', () => {
    const columns = buildViewColumns(COLUMNS, { columns: ['findings', 'app'] });

    expect(toViewConfig(columns, [{ field: 'app', operator: 'eq', value: 'x' }])).toEqual({
      version: 1,
      columns: ['findings', 'app'],
      filters: [{ id: 'report', filter_details: { app: { operator: 'eq', value: 'x' } } }],
      chart: null,
    });
  });
});

describe('describeViewChanges', () => {
  const saved = { columns: buildViewColumns(COLUMNS), filters: [] };

  it('finds nothing when nothing changed', () => {
    expect(hasViewChanges(describeViewChanges(saved, saved))).toBe(false);
  });

  it('counts hidden and shown columns, a new order and changed filters', () => {
    const current = {
      columns: buildViewColumns(COLUMNS, { columns: ['findings', 'app', 'id'] }),
      filters: [{ field: 'app', operator: 'eq' as const, value: 'x' }],
    };

    expect(describeViewChanges(saved, current)).toEqual({
      hiddenColumns: 1,
      shownColumns: 1,
      reordered: true,
      filtersChanged: true,
    });
  });
});

describe('getFreeReportName', () => {
  it('keeps a free name and numbers a taken one, ignoring case', () => {
    expect(getFreeReportName('Apps', ['Other'], 80)).toBe('Apps');
    expect(getFreeReportName('Apps', ['apps'], 80)).toBe('Apps (2)');
    expect(getFreeReportName('Apps', ['Apps', 'Apps (2)'], 80)).toBe('Apps (3)');
  });

  it('stays within the length limit', () => {
    const long = 'x'.repeat(80);

    expect(getFreeReportName(long, [long], 80)).toHaveLength(80);
  });
});

describe('conditions', () => {
  it('sends numbers as numbers for number columns', () => {
    expect(normaliseCondition({ field: 'f', operator: 'gte', value: '3' }, field({ type: 'integer' })).value).toBe(3);

    expect(normaliseCondition({ field: 'f', operator: 'eq', value: 'abc' }, field({ type: 'integer' })).value).toBe(
      'abc'
    );

    expect(normaliseCondition({ field: 'f', operator: 'eq', value: '3' }, field({})).value).toBe('3');
    expect(normaliseCondition({ field: 'f', operator: 'isnull', value: null }, field({})).value).toBe(true);
  });

  it('knows when a condition is ready', () => {
    expect(isConditionComplete({ field: 'f', operator: 'eq', value: '' })).toBe(false);
    expect(isConditionComplete({ field: 'f', operator: 'in', value: [] })).toBe(false);
    expect(isConditionComplete({ field: 'f', operator: 'isnull', value: null })).toBe(true);
    expect(isConditionComplete({ field: 'f', operator: 'eq', value: false })).toBe(true);
  });
});
