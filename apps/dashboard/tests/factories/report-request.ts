import { faker } from '@faker-js/faker';

import { ENUMS } from '@irene/enums';

import type { ApiReportPreview, ApiReportRequest } from '@irene/api/services/report-request';
import type { ApiReportRow, ApiSavedReportColumn } from '@irene/api/services/saved-report';

/** A question that has been answered with a report, unless a test pins another status. */
export const buildReportRequest = (overrides: Partial<ApiReportRequest> = {}): ApiReportRequest => ({
  id: faker.number.int({ min: 1, max: 99999 }),
  query: faker.lorem.sentence(),
  status: ENUMS.AI_REPORTING_REQUEST_STATUS.COMPLETED,
  is_relevant: true,
  error: false,
  error_message: null,
  report_type: 'xlsx',
  created_on: faker.date.recent().toISOString(),
  updated_on: faker.date.recent().toISOString(),
  ...overrides,
});

/** The columns of the default report: an app, its severity and its findings. */
export const buildReportColumns = (): ApiSavedReportColumn[] => [
  { field: 'app', label: faker.lorem.word(), type: 'string', is_default: true },
  { field: 'severity', label: faker.lorem.word(), type: 'string', is_default: true },
  { field: 'findings', label: faker.lorem.word(), type: 'integer', is_default: true },
  { field: 'id', label: faker.lorem.word(), type: 'integer', is_default: false },
];

/** A page of a generated report: its rows, the filters on offer and a bar chart of findings per app. */
export const buildReportPreview = (
  overrides: Partial<ApiReportPreview> = {},
  rows: ApiReportRow[] = [
    { app: faker.internet.domainName(), severity: 'High', findings: 3, id: 1 },
    { app: faker.internet.domainName(), severity: 'Low', findings: 1, id: 2 },
  ]
): ApiReportPreview => {
  const columns = overrides.columns ?? buildReportColumns();

  return {
    title: faker.lorem.words(4),
    columns,
    data: rows,
    pagination: { count: rows.length, limit: 10, offset: 0 },
    filter_details: [
      {
        id: 'report',
        model_name: 'Report Data',
        has_filters: true,
        fields: columns.map((column) => ({
          field: column.field,
          label: column.label,
          type: column.type,
          is_nullable: false,
          ...(column.field === 'severity'
            ? { choices: ['High', 'Low'].map((value) => ({ value, label: value })) }
            : {}),
        })),
      },
    ],
    chart: { type: 'bar', x: 'app', y: ['findings'], series: null },
    chart_data: rows,
    ...overrides,
  };
};
