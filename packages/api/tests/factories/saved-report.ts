import { faker } from '@faker-js/faker';

import type {
  ApiReportRow,
  ApiSavedReport,
  ApiSavedReportPreview,
  ApiSavedReportSnapshot,
  ApiSavedReportSummary,
} from '@irene/api/services/saved-report';

/** The state of a saved report's rows; ready unless a test pins another. */
export const buildSavedReportSnapshot = (
  overrides: Partial<ApiSavedReportSnapshot> = {}
): ApiSavedReportSnapshot => ({
  status: 'ready',
  row_count: faker.number.int({ min: 1, max: 500 }),
  refreshed_at: faker.date.recent().toISOString(),
  error: '',
  ...overrides,
});

/** One row of the Saved reports list. */
export const buildSavedReportSummary = (
  overrides: Partial<ApiSavedReportSummary> = {}
): ApiSavedReportSummary => ({
  id: faker.number.int({ min: 1, max: 99999 }),
  name: faker.lorem.words(3),
  query: faker.lorem.sentence(),
  report_request: faker.number.int({ min: 1, max: 99999 }),
  pinned: false,
  pinned_at: null,
  has_chart: true,
  created_on: faker.date.past().toISOString(),
  updated_on: faker.date.recent().toISOString(),
  snapshot: buildSavedReportSnapshot(),
  schedule: null,
  ...overrides,
});

/** One saved report in full: a bar chart of findings per app, by default. */
export const buildSavedReport = (overrides: Partial<ApiSavedReport> = {}): ApiSavedReport => ({
  ...buildSavedReportSummary(),
  title: faker.lorem.words(4),
  description: faker.lorem.sentence(),
  columns: [
    { field: 'app', label: faker.lorem.word(), type: 'string', is_default: true },
    { field: 'findings', label: faker.lorem.word(), type: 'integer', is_default: true },
  ],
  chart: { type: 'bar', x: 'app', y: ['findings'], series: null },
  view_config: { version: 1, columns: null, filters: [], chart: null },
  ...overrides,
});

/** A row of the default report: one app and its findings. */
export const buildReportRow = (overrides: ApiReportRow = {}): ApiReportRow => ({
  app: faker.internet.domainName(),
  findings: faker.number.int({ min: 0, max: 50 }),
  ...overrides,
});

/** A page of a saved report's rows, with the chart drawn from all of them. */
export const buildSavedReportPreview = (
  report: ApiSavedReport,
  rows: ApiReportRow[] = [buildReportRow(), buildReportRow()]
): ApiSavedReportPreview => ({
  title: report.title,
  columns: report.columns,
  data: rows,
  pagination: { count: rows.length, limit: 10, offset: 0 },
  filter_details: [
    {
      id: 'report',
      model_name: 'Report Data',
      has_filters: true,
      fields: report.columns.map((column) => ({
        field: column.field,
        label: column.label,
        type: column.type,
        is_nullable: false,
      })),
    },
  ],
  chart: report.chart,
  chart_data: report.chart ? rows : [],
  snapshot: report.snapshot,
});
