import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiAppScan,
  ApiAppScanRequest,
  ApiRecentIssue,
  ApiScanCount,
} from '@irene/api/services/analytics';

import { AnalyticsEndpoints } from './endpoints';

/** Talks to the analytics endpoints. */
export default class AnalyticsService {
  /**
   * Fetches what the organization's scanning adds up to.
   *
   * @param organizationId - The organization to count.
   * @returns The counts, by platform and by kind of scan.
   */
  public static readonly getScanCount = (organizationId: number | string) =>
    apiRequest.get<ApiScanCount>(AnalyticsEndpoints.scanCount(organizationId));

  /**
   * Fetches one row per app per day it was scanned.
   *
   * The endpoint answers an unpaginated `results` list, so the whole range
   * arrives at once however long it is.
   *
   * @param organizationId - The organization to read.
   * @param params - The range to read, as ISO timestamps.
   * @returns Every app scanned in the range, a row per app per day.
   */
  public static readonly getAppScans = async (
    organizationId: number | string,
    params: ApiAppScanRequest
  ) => {
    const response = await apiRequest.get<{ results: ApiAppScan[] }>(
      AnalyticsEndpoints.appScan(organizationId),
      { params }
    );

    return response.results;
  };

  /**
   * Fetches the vulnerabilities found most often, the commonest first.
   *
   * @param organizationId - The organization to read.
   * @param params - The page size and offset.
   * @returns One page of vulnerabilities, each with how many files carry it.
   */
  public static readonly getRecentIssues = async (
    organizationId: number | string,
    params: { limit: number; offset: number }
  ) => {
    const response = await apiRequest.get<ApiPageEnvelope<ApiRecentIssue>>(
      AnalyticsEndpoints.recentIssues(organizationId),
      { params }
    );

    return transformPaginatedResponse(response);
  };
}
