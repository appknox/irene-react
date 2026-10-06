import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for what a partner organization may do. */
export const PartnerEndpoints = {
  /** The partner record for one organization, carrying its access. */
  detail: (organizationId: number | string) =>
    `${API_NAMESPACES.v2}/partners/${encodeURIComponent(organizationId)}` as const,
};
