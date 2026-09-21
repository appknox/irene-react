import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse, type ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiDashboardConfig,
  ApiOrganization,
  ApiOrganizationMe,
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
      OrganizationEndpoints.list()
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
    apiRequest.get<ApiOrganizationMe>(OrganizationEndpoints.me(organizationId));

  /**
   * Fetches the StoreKnox organization.
   * @returns The StoreKnox organization; rejects on a deployment without one.
   */
  public static readonly getStoreknoxOrganization = () =>
    apiRequest.get<ApiStoreknoxOrganization>(OrganizationEndpoints.storeknoxOrganization());

  /**
   * Fetches the hosts the product links out to.
   * @returns The dashboard and device farm URLs, either of which may be absent.
   */
  public static readonly getDashboardConfig = () =>
    apiRequest.get<ApiDashboardConfig>(OrganizationEndpoints.dashboardConfig());
}
