import { queryOptions } from '@tanstack/react-query';
import { OrganizationService } from '@irene/api/services/organization';

/** The cache keys for the organization a signed-in account works in. */
export const organizationKeys = {
  all: () => ['organization'] as const,
  list: () => [...organizationKeys.all(), 'list'] as const,
  storeknox: () => [...organizationKeys.all(), 'storeknox'] as const,
  me: (orgId: number | string) => [...organizationKeys.all(), 'me', orgId] as const,

  membership: (orgId: number | string, userId: number | string) =>
    [...organizationKeys.all(), 'membership', orgId, userId] as const,

  namespace: (orgId: number | undefined, namespaceId: number) =>
    [...organizationKeys.all(), orgId, 'namespace', namespaceId] as const,
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
 * @param orgId - The organization to ask about.
 * @returns Query options resolving to the account's role and permissions.
 */
export const organizationMeOptions = (orgId: number | string) =>
  queryOptions({
    queryKey: organizationKeys.me(orgId),
    queryFn: () => OrganizationService.getOrganizationMe(orgId),
    staleTime: Infinity,
  });

/**
 * Builds the query for one account's membership of an organization.
 *
 * @param orgId - The organization the membership is in.
 * @param userId - The account whose membership to read.
 * @returns Query options resolving to their role, and when they joined.
 */
export const organizationMembershipOptions = (orgId: number | string, userId: number | string) =>
  queryOptions({
    queryKey: organizationKeys.membership(orgId, userId),
    queryFn: () => OrganizationService.getOrganizationMembership(orgId, userId),
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

/**
 * Builds the query for one namespace an organization has claimed.
 *
 * The namespace-request notifications read it to state whether the request is
 * still open. It is not retried: a rejected namespace is removed, and the 404
 * that follows is the answer rather than a failure.
 *
 * @param orgId - The organization the namespace belongs to, absent until one is selected.
 * @param namespaceId - The namespace to read.
 * @returns Query options resolving to the namespace, which only run once an organization is selected.
 */
export const organizationNamespaceOptions = (orgId: number | undefined, namespaceId: number) =>
  queryOptions({
    queryKey: organizationKeys.namespace(orgId, namespaceId),
    queryFn: () => OrganizationService.getOrganizationNamespace(Number(orgId), namespaceId),
    enabled: orgId !== undefined,
    retry: false,
  });
