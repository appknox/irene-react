import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the reports an account kept from AI reporting, served by Luna under the v1 namespace as irene's report requests are. */
export const SavedReportEndpoints = {
  /** Lists the account's saved reports (GET), and saves a generated report (POST). */
  list: () => `${API_NAMESPACES.v1}/ai_reporting/saved_reports` as const,

  /** Reads (GET), renames, re-configures or pins (PATCH), and deletes (DELETE) one saved report. */
  detail: (id: number | string) =>
    `${API_NAMESPACES.v1}/ai_reporting/saved_reports/${encodeURIComponent(id)}` as const,

  /** Saves a copy under a new name, without its email schedule (POST). */
  copy: (id: number | string) => `${SavedReportEndpoints.detail(id)}/copy` as const,

  /** Undoes a delete (POST). */
  restore: (id: number | string) => `${SavedReportEndpoints.detail(id)}/restore` as const,

  /** Re-runs the report's stored query without the AI (POST); the report is polled until it is ready. */
  refresh: (id: number | string) => `${SavedReportEndpoints.detail(id)}/refresh` as const,

  /** One page of the saved rows (POST), with the chart's rows beside it. */
  preview: (id: number | string) => `${SavedReportEndpoints.detail(id)}/preview` as const,

  /** A signed link to the saved rows as a file (POST). */
  downloadUrl: (id: number | string) => `${SavedReportEndpoints.detail(id)}/download_url` as const,
};
