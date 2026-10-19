import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiCyodRegisteredDevice,
  ApiOrganization,
  ApiOrganizationMe,
  ApiOrganizationMembership,
  ApiOrganizationNamespace,
  ApiStoreknoxOrganization,
} from '@irene/api/services/organization';

import { OrganizationEndpoints } from './endpoints';

/** Talks to the endpoints describing the organization a signed-in account works in. */
export default class OrganizationService {
  /**
   * Fetches the organizations this account belongs to.
   * @returns The organizations, and the total count.
   */
  public static readonly getOrganizations = async () => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganization>>(
      OrganizationEndpoints.list(),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches what this account may do within one organization.
   *
   * @param organizationId - The organization to ask about.
   * @returns The account's role and permissions there.
   */
  public static readonly getOrganizationMe = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationMe>(OrganizationEndpoints.me(organizationId), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /**
   * Fetches one account's membership of an organization.
   *
   * @param organizationId - The organization the membership is in.
   * @param userId - The account whose membership to read.
   * @returns Their role, and when they joined and were last seen.
   */
  public static readonly getOrganizationMembership = (
    organizationId: number | string,
    userId: number | string
  ) =>
    apiRequest.get<ApiOrganizationMembership>(
      OrganizationEndpoints.member(organizationId, userId),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

  /**
   * Fetches one namespace an organization has claimed.
   *
   * @param organizationId - The organization the namespace belongs to.
   * @param namespaceId - The namespace to read.
   * @returns The namespace; rejects when it has been rejected and removed.
   */
  public static readonly getOrganizationNamespace = (
    organizationId: number | string,
    namespaceId: number | string
  ) =>
    apiRequest.get<ApiOrganizationNamespace>(
      OrganizationEndpoints.namespace(organizationId, namespaceId)
    );

  /**
   * Approves a namespace, which lets uploads under it through.
   *
   * @param organizationId - The organization the namespace belongs to.
   * @param namespaceId - The namespace to approve.
   * @returns The approved namespace.
   */
  public static readonly approveOrganizationNamespace = (
    organizationId: number | string,
    namespaceId: number | string
  ) =>
    apiRequest.put<ApiOrganizationNamespace>(
      OrganizationEndpoints.namespace(organizationId, namespaceId),
      { is_approved: true }
    );

  /**
   * Rejects a namespace, which removes it.
   *
   * @param organizationId - The organization the namespace belongs to.
   * @param namespaceId - The namespace to reject.
   */
  public static readonly rejectOrganizationNamespace = (
    organizationId: number | string,
    namespaceId: number | string
  ) => apiRequest.delete<void>(OrganizationEndpoints.namespace(organizationId, namespaceId));

  /**
   * Fetches the CYOD devices registered to an organization. The list arrives in
   * `results` with no paging around it.
   *
   * Refused with a 403 when the organization holds no device-farm token of its
   * own, which callers read as "not configured" rather than as a failure.
   *
   * @param organizationId - The organization to ask about.
   * @returns The devices, online or not.
   */
  public static readonly getRegisteredDevices = async (organizationId: number | string) => {
    const response = await apiRequest.get<{ results: ApiCyodRegisteredDevice[] }>(
      OrganizationEndpoints.registeredDevices(organizationId),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return response.results;
  };

  /**
   * Fetches the StoreKnox organization an account belongs to.
   *
   * The endpoint lists them, and an account has at most one, so the first is
   * the one in use.
   *
   * @returns The StoreKnox organization, or null when the account is in none.
   */
  public static readonly getStoreknoxOrganization = async () => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiStoreknoxOrganization>>(
      OrganizationEndpoints.storeknoxOrganization(),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return transformPaginatedResponse(page).items[0] ?? null;
  };
}
