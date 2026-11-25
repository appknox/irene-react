import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the accounts an organization issues to its own systems. */
export const ServiceAccountEndpoints = {
  /** Every service account the organization holds, a page at a time, and where a new one is made. */
  list: () => `${API_NAMESPACES.v1}/service_accounts` as const,

  /** One service account: read, changed and withdrawn here. */
  detail: (serviceAccountId: number | string) =>
    `${API_NAMESPACES.v1}/service_accounts/${encodeURIComponent(serviceAccountId)}` as const,

  /** Issues a new secret for one account, which invalidates the one it had. */
  keyReset: (serviceAccountId: number | string) =>
    `${API_NAMESPACES.v1}/service_accounts/${encodeURIComponent(serviceAccountId)}/key_reset` as const,

  /** The projects one account reaches, and where another is added to it. */
  projects: (serviceAccountId: number | string) =>
    `${API_NAMESPACES.v1}/service_accounts/${encodeURIComponent(serviceAccountId)}/service_account_projects` as const,

  /** One project's place on an account, which is taken away here. */
  project: (serviceAccountProjectId: number | string) =>
    `${API_NAMESPACES.v1}/service_account_projects/${encodeURIComponent(serviceAccountProjectId)}` as const,
};
