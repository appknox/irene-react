import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for what an organization's scanning adds up to. */
export const AnalyticsEndpoints = {
  /** Every scan the organization has run, counted by platform and by kind. */
  scanCount: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/scancount` as const,

  /** One row per app per day it was scanned, within a date range. */
  appScan: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/appscan` as const,

  /** The vulnerabilities found most often across the organization's files. */
  recentIssues: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/recent_issues` as const,
};
