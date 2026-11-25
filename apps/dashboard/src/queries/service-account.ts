import { queryOptions } from '@tanstack/react-query';

import {
  ServiceAccountService,
  type ServiceAccountPage,
} from '@irene/api/services/service-account';

/** The cache keys for the accounts an organization issues to its own systems. */
export const serviceAccountKeys = {
  all: () => ['service-account'] as const,

  /** Every page of the list, for invalidating them together. */
  list: () => [...serviceAccountKeys.all(), 'list'] as const,

  page: (page: ServiceAccountPage) => [...serviceAccountKeys.list(), page] as const,

  detail: (serviceAccountId: number | undefined) =>
    [...serviceAccountKeys.all(), serviceAccountId] as const,

  /** Every page of one account's projects, for invalidating them together. */
  projectsList: (serviceAccountId: number | undefined) =>
    [...serviceAccountKeys.detail(serviceAccountId), 'projects'] as const,

  projects: (serviceAccountId: number | undefined, page: Record<string, unknown>) =>
    [...serviceAccountKeys.projectsList(serviceAccountId), page] as const,
};

/**
 * Builds the query for one page of the organization's service accounts.
 *
 * @param page - Where the page starts, how many it holds, and which accounts it covers.
 * @returns Query options resolving to the page.
 */
export const serviceAccountsOptions = (page: ServiceAccountPage) =>
  queryOptions({
    queryKey: serviceAccountKeys.page(page),
    queryFn: () => ServiceAccountService.getServiceAccounts(page),
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for one service account.
 *
 * @param serviceAccountId - Which account to read, absent while none is open.
 * @returns Query options resolving to the account, which only run once one is open.
 */
export const serviceAccountOptions = (serviceAccountId: number | undefined) =>
  queryOptions({
    queryKey: serviceAccountKeys.detail(serviceAccountId),
    queryFn: () => ServiceAccountService.getServiceAccount(Number(serviceAccountId)),
    enabled: serviceAccountId !== undefined,
  });

/**
 * Builds the query for one page of the projects an account reaches.
 *
 * @param serviceAccountId - Whose projects to read, absent while none is open.
 * @param page - Where the page starts and how many it holds.
 * @returns Query options resolving to the page, which only run once an account is open.
 */
export const serviceAccountProjectsOptions = (
  serviceAccountId: number | undefined,
  page: { limit: number; offset: number }
) =>
  queryOptions({
    queryKey: serviceAccountKeys.projects(serviceAccountId, { ...page }),

    queryFn: () => ServiceAccountService.getServiceAccountProjects(Number(serviceAccountId), page),

    enabled: serviceAccountId !== undefined,
    placeholderData: (previous) => previous,
  });
