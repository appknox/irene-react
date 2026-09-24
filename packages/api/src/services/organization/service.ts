import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiOrganization,
  ApiOrganizationMe,
  ApiOrganizationMembership,
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
      { timeout: REQUEST_ABORT_TIMEOUT_MS }
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
      timeout: REQUEST_ABORT_TIMEOUT_MS,
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
      { timeout: REQUEST_ABORT_TIMEOUT_MS }
    );

  /**
   * Fetches the StoreKnox organization.
   * @returns The StoreKnox organization; rejects on a deployment without one.
   */
  public static readonly getStoreknoxOrganization = () =>
    apiRequest.get<ApiStoreknoxOrganization>(OrganizationEndpoints.storeknoxOrganization(), {
      timeout: REQUEST_ABORT_TIMEOUT_MS,
    });
}
