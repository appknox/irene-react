import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for AI reporting's report requests, served by Luna under the v1 namespace as irene calls them. */
export const ReportRequestEndpoints = {
  /** Asks for a report from a question (POST). */
  list: () => `${API_NAMESPACES.v1}/ai_reporting/report_request` as const,

  /** Reads one request, which is polled while the report is generated (GET). */
  detail: (id: number | string) =>
    `${API_NAMESPACES.v1}/ai_reporting/report_request/${encodeURIComponent(id)}` as const,

  /** One page of the generated rows (POST). */
  preview: (id: number | string) => `${ReportRequestEndpoints.detail(id)}/preview` as const,

  /** A signed link to the rows as a file (POST). */
  downloadUrl: (id: number | string) => `${ReportRequestEndpoints.detail(id)}/download_url` as const,
};

/** The organization's own switch for AI reporting, which its owner turns on in Organization Settings. */
export const OrganizationAiSettingsEndpoints = {
  detail: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/ai_features` as const,
};
