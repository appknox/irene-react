import { apiRequest } from '@irene/api/request';
import type { ApiPartner } from '@irene/api/services/partner';

import { PartnerEndpoints } from './endpoints';

/** Talks to the partner endpoints. */
export default class PartnerService {
  /**
   * Fetches the partner record for one organization.
   *
   * @param organizationId - The organization to read.
   * @returns The partner, and what it is allowed to do.
   */
  public static readonly getPartner = (organizationId: number | string) =>
    apiRequest.get<ApiPartner>(PartnerEndpoints.detail(organizationId));
}
