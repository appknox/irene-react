import { queryOptions } from '@tanstack/react-query';
import { OrganizationService } from '@irene/api/services/organization';

/** The cache keys for the organization a signed-in account works in. */
export const organizationKeys = {
  all: () => ['organization'] as const,
  list: () => [...organizationKeys.all(), 'list'] as const,
  storeknox: () => [...organizationKeys.all(), 'storeknox'] as const,

  me: (organizationId: number | string) =>
    [...organizationKeys.all(), 'me', organizationId] as const,

  membership: (organizationId: number | string, userId: number | string) =>
    [...organizationKeys.all(), 'membership', organizationId, userId] as const,
};

/**
 * Builds the query for the organizations this account belongs to.
 *
 * @returns Query options resolving to one page of organizations.
 */
export const organizationsOptions = () =>
  queryOptions({
    queryKey: organizationKeys.list(),
    queryFn: () => OrganizationService.getOrganizations(),
    staleTime: Infinity,
  });

/**
 * Builds the query for what this account may do in one organization.
 *
 * @param organizationId - The organization to ask about.
 * @returns Query options resolving to the account's role and permissions.
 */
export const organizationMeOptions = (organizationId: number | string) =>
  queryOptions({
    queryKey: organizationKeys.me(organizationId),
    queryFn: () => OrganizationService.getOrganizationMe(organizationId),
    staleTime: Infinity,
  });

/**
 * Builds the query for one account's membership of an organization.
 *
 * @param organizationId - The organization the membership is in.
 * @param userId - The account whose membership to read.
 * @returns Query options resolving to their role, and when they joined.
 */
export const organizationMembershipOptions = (
  organizationId: number | string,
  userId: number | string
) =>
  queryOptions({
    queryKey: organizationKeys.membership(organizationId, userId),
    queryFn: () => OrganizationService.getOrganizationMembership(organizationId, userId),
    staleTime: Infinity,
  });

/**
 * Builds the query for the StoreKnox organization.
 *
 * Fails on a deployment without StoreKnox, which is not an error: the caller
 * carries on without it.
 *
 * @returns Query options resolving to the StoreKnox organization.
 */
export const storeknoxOrganizationOptions = () =>
  queryOptions({
    queryKey: organizationKeys.storeknox(),
    queryFn: () => OrganizationService.getStoreknoxOrganization(),
    staleTime: Infinity,
    retry: false,
  });
