import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import {
  SERVICE_ACCOUNT_TYPE,
  type ApiServiceAccount,
  type ApiServiceAccountProject,
  type ApiServiceAccountScopes,
  type ServiceAccountPage,
  type ServiceAccountRequest,
  type ServiceAccountUpdateRequest,
} from './types';

import { ServiceAccountEndpoints } from './endpoints';

/** Talks to the endpoints behind an organization's service accounts. */
export default class ServiceAccountService {
  /**
   * Reads a page of the organization's service accounts.
   *
   * The accounts the system made are left out unless they are asked for, as
   * irene leaves them out, and the list narrows to the command line's accounts
   * only when that is asked for: neither filter is sent otherwise.
   *
   * @param page - Where the page starts, how many it holds, and which accounts it covers.
   * @returns The page of accounts, with how many there are in all.
   */
  public static readonly getServiceAccounts = async (page: ServiceAccountPage) => {
    const answered = await apiRequest.get<ApiPageEnvelope<ApiServiceAccount>>(
      ServiceAccountEndpoints.list(),
      {
        params: {
          limit: page.limit,
          offset: page.offset,
          ...(page.showSystemCreated ? {} : { service_account_type: SERVICE_ACCOUNT_TYPE.user }),
          ...(page.showCliEnabled ? { scope_cli: true } : {}),
        },
      }
    );

    return transformPaginatedResponse(answered);
  };

  /**
   * Reads one service account.
   *
   * @param serviceAccountId - Which account to read.
   * @returns The account.
   */
  public static readonly getServiceAccount = (serviceAccountId: number | string) =>
    apiRequest.get<ApiServiceAccount>(ServiceAccountEndpoints.detail(serviceAccountId));

  /**
   * Makes a service account.
   *
   * The secret comes back with it and is never sent again, so whatever asks
   * for one shows it before leaving the screen.
   *
   * @param details - What the account is called, when it expires, and what it reaches.
   * @returns The account, with its secret.
   */
  public static readonly createServiceAccount = (details: ServiceAccountRequest) =>
    apiRequest.post<ApiServiceAccount>(ServiceAccountEndpoints.list(), details);

  /**
   * Changes a service account: its name, its expiry, or what it may do.
   *
   * The endpoint takes the account entire, so the one that was read is sent
   * back with the changes written over it. Sending the changed fields alone
   * would leave the rest unset.
   *
   * @param serviceAccount - The account as it was read.
   * @param changes - The fields to write over it.
   * @returns The account as it now stands.
   */
  public static readonly updateServiceAccount = (
    serviceAccount: ApiServiceAccount,
    changes: Partial<ServiceAccountRequest & ApiServiceAccountScopes>
  ) => {
    const body: ServiceAccountUpdateRequest = {
      ...serviceAccount,
      ...changes,

      /* Answered once, when the account is made or its key is reset, so it is not sent back. */
      secret_access_key: undefined,
    };

    return apiRequest.put<ApiServiceAccount>(
      ServiceAccountEndpoints.detail(serviceAccount.id),
      body
    );
  };

  /**
   * Issues a new secret, which stops the one the account had from working.
   *
   * @param serviceAccountId - Which account to issue it for.
   * @param expiry - When the new secret stops working, or nothing where it does not expire.
   * @returns The account, with its new secret.
   */
  public static readonly resetServiceAccountKey = (
    serviceAccountId: number | string,
    expiry: string | null
  ) =>
    apiRequest.put<ApiServiceAccount>(ServiceAccountEndpoints.keyReset(serviceAccountId), {
      expiry,
    });

  /**
   * Withdraws a service account.
   *
   * @param serviceAccountId - Which account to withdraw.
   */
  public static readonly deleteServiceAccount = (serviceAccountId: number | string) =>
    apiRequest.delete(ServiceAccountEndpoints.detail(serviceAccountId));

  /**
   * Reads the projects one account reaches, a page at a time.
   *
   * @param serviceAccountId - Whose projects to read.
   * @param page - Where the page starts and how many it holds.
   * @returns The page of projects, with how many there are in all.
   */
  public static readonly getServiceAccountProjects = async (
    serviceAccountId: number | string,
    page: { limit: number; offset: number }
  ) => {
    const answered = await apiRequest.get<ApiPageEnvelope<ApiServiceAccountProject>>(
      ServiceAccountEndpoints.projects(serviceAccountId),
      { params: page }
    );

    return transformPaginatedResponse(answered);
  };

  /**
   * Gives an account one more project to reach.
   *
   * @param serviceAccountId - Which account to add it to.
   * @param projectId - The project.
   * @returns The project's place on the account.
   */
  public static readonly addServiceAccountProject = (
    serviceAccountId: number | string,
    projectId: number
  ) =>
    apiRequest.post<ApiServiceAccountProject>(ServiceAccountEndpoints.projects(serviceAccountId), {
      project_id: projectId,
    });

  /**
   * Takes a project away from an account.
   *
   * @param serviceAccountProjectId - The project's place on the account, not the project itself.
   */
  public static readonly deleteServiceAccountProject = (serviceAccountProjectId: number | string) =>
    apiRequest.delete(ServiceAccountEndpoints.project(serviceAccountProjectId));
}
