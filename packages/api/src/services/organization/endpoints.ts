import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the organization an account belongs to, and what it is entitled to. */
export const OrganizationEndpoints = {
  list: () => `${API_NAMESPACES.v1}/organizations` as const,

  /** The signed-in account's standing within one organization: role, permissions, last seen. */
  me: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/me` as const,

  /** One member's standing: their role, when they joined, and when they were last seen. */
  member: (organizationId: number | string, userId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}` as const,

  /** The StoreKnox organization, which not every deployment has. */
  storeknoxOrganization: () => `${API_NAMESPACES.v2}/sk_organization` as const,
};
