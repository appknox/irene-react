import type { ENUMS } from '@irene/enums';
import type {
  ApiReportChart,
  ApiReportFilterSection,
  ApiReportRow,
  ApiSavedReportColumn,
} from '@irene/api/services/saved-report';

/** Where a report request stands: pending, processing, completed or failed. */
export type ApiReportRequestStatus = (typeof ENUMS.AI_REPORTING_REQUEST_STATUS)['BASE_VALUES'][number];

/** A question asked of AI reporting, and how far Luna has got answering it. */
export interface ApiReportRequest {
  id: number;
  query: string;
  status: ApiReportRequestStatus;
  /** Whether the question could be answered with a report; false until it is. */
  is_relevant: boolean;
  /** Whether generating it failed. */
  error: boolean;
  error_message: string | null;
  report_type: 'csv' | 'xlsx' | null;
  created_on: string;
  updated_on: string;
}

/** One field a report can be filtered on. */
export interface ApiReportFilterField {
  field: string;
  filter_key?: string;
  label: string;
  type: string;
  is_nullable: boolean;
  /** The values an enum or boolean column takes, as the data holds them. */
  choices?: { value: string; label: string }[];
}

/** The filters a report offers, in sections; Luna sends one section for the report's own columns. */
export interface ApiReportFilterDetail {
  id: string;
  model_name: string;
  has_filters: boolean;
  fields: ApiReportFilterField[];
}

/** A page of a generated report's rows, with every row the chart draws. */
export interface ApiReportPreview {
  title: string;
  columns: ApiSavedReportColumn[];
  data: ApiReportRow[];
  pagination: { count: number; limit: number; offset: number };
  filter_details: ApiReportFilterDetail[];
  chart: ApiReportChart | null;
  chart_data: ApiReportRow[];
}

/** What a preview asks for. */
export interface ApiReportPreviewRequest {
  limit: number;
  offset: number;
  filter_details?: ApiReportFilterSection[];
}

/** What a download asks for: the columns in order, the format, and the filters. */
export interface ApiReportDownloadRequest {
  columns: { field: string; label: string }[];
  report_type: 'csv' | 'xlsx';
  filter_details?: ApiReportFilterSection[];
}

/** The organization's AI settings, as its owner sets them. */
export interface ApiOrganizationAiSettings {
  reporting: boolean;
  pii: boolean;
}
