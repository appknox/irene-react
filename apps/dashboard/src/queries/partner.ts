import { queryOptions } from '@tanstack/react-query';
import { PartnerService } from '@irene/api/services/partner';

/** The cache keys for the partner an organization is. */
export const partnerKeys = {
  all: () => ['partner'] as const,
  detail: (orgId: number | string) => [...partnerKeys.all(), orgId] as const,
};

/**
 * Builds the query for what a partner organization may do.
 *
 * It is not retried: an organization that is not a partner is answered with a
 * 404, which is the answer rather than a failure.
 *
 * @param orgId - The organization to read, absent until one is selected.
 * @returns Query options resolving to the partner's access.
 */
export const partnerOptions = (orgId: number | string) =>
  queryOptions({
    queryKey: partnerKeys.detail(orgId),
    queryFn: () => PartnerService.getPartner(orgId),
    enabled: Boolean(orgId),
    staleTime: Infinity,
    retry: false,
  });
