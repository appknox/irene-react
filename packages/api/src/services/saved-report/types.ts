import type { ApiReportPreview } from '@irene/api/services/report-request';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

/** Where a saved report's rows stand: kept as they are, being fetched again, or a refresh that failed. */
export type ApiSavedReportSnapshotStatus = 'ready' | 'refreshing' | 'failed';

/** The saved rows' state; the rows themselves come through the preview. */
export interface ApiSavedReportSnapshot {
  status: ApiSavedReportSnapshotStatus;
  row_count: number;
  /** When the rows were last fetched, as an ISO 8601 timestamp. */
  refreshed_at: string;
  /** Why the last refresh failed, written for the reader; empty otherwise. */
  error: string;
}

/** One row of the Saved reports list. */
export interface ApiSavedReportSummary {
  id: number;
  name: string;
  /** The question the report was generated from. */
  query: string;
  report_request: number;
  pinned: boolean;
  pinned_at: string | null;
  /** Whether the report draws a chart, so the list can say "Table + chart" rather than "Table". */
  has_chart: boolean;
  created_on: string;
  updated_on: string;
  snapshot: ApiSavedReportSnapshot;
  /** Email schedules are not built yet, so this is always null. */
  schedule: null;
}

/** A column the report can show. */
export interface ApiSavedReportColumn {
  field: string;
  label: string;
  type: string;
  is_default: boolean;
}

/** The chart Luna picked for the report, by fixed rules: which columns go where. */
export interface ApiReportChart {
  type: 'number' | 'line' | 'bar' | 'stacked_bar';
  x: string | null;
  y: string[];
  series: string | null;
}

/** One filter section, as the preview takes it. */
export interface ApiReportFilterSection {
  id: string;
  filter_details: Record<string, unknown>;
}

/** The table and chart choices saved with a report. */
export interface ApiSavedReportViewConfig {
  version?: 1;
  /** The shown columns in order; null shows the report's defaults. */
  columns?: string[] | null;
  filters?: ApiReportFilterSection[];
  chart?: Record<string, unknown> | null;
}

/** One saved report in full. */
export interface ApiSavedReport extends ApiSavedReportSummary {
  title: string;
  description: string;
  columns: ApiSavedReportColumn[];
  chart: ApiReportChart | null;
  view_config: ApiSavedReportViewConfig;
}

/** The list as the endpoint sends it: a page, and how many reports an account may keep. */
export interface ApiSavedReportListResponse extends ApiPageEnvelope<ApiSavedReportSummary> {
  max_saved_reports: number;
}

/** What can change on a saved report. */
export interface ApiSavedReportUpdate {
  name?: string;
  view_config?: ApiSavedReportViewConfig;
  pinned?: boolean;
}

/** What saving a generated report sends. */
export interface ApiSaveReportRequest {
  report_request: number;
  name: string;
  view_config?: ApiSavedReportViewConfig;
}

/** One row of a report: column field to value. */
export type ApiReportRow = Record<string, unknown>;

/** A page of the saved rows, with every row the chart draws, and where the rows stand. */
export interface ApiSavedReportPreview extends ApiReportPreview {
  snapshot: ApiSavedReportSnapshot;
}

/** What a saved report's download asks for; columns and filters left out use the saved ones. */
export interface ApiSavedReportDownloadRequest {
  report_type: 'csv' | 'xlsx';
  columns?: string[];
  filter_details?: ApiReportFilterSection[];
}

/** What a preview asks for. */
export interface ApiSavedReportPreviewRequest {
  limit: number;
  offset: number;
  filter_details?: ApiReportFilterSection[];
}

/** A Luna refusal: a message written for the reader, and a code naming the case. */
export interface ApiLunaError {
  error: true;
  message: string;
  status_code: number;
  error_code?: string;
}
