import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the organization an account belongs to, and what it is entitled to. */
export const OrganizationEndpoints = {
  list: () => `${API_NAMESPACES.v1}/organizations` as const,

  /** The signed-in account's standing within one organization: role, permissions, last seen. */
  me: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/me` as const,

  /** The StoreKnox organization, which not every deployment has. */
  storeknoxOrganization: () => `${API_NAMESPACES.v2}/sk_organization` as const,

  /** Hosts the product links out to, such as the device farm. */
  dashboardConfig: () => `${API_NAMESPACES.v2}/dashboard_configuration` as const,
};
