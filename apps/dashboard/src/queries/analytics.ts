import { queryOptions } from '@tanstack/react-query';
import { AnalyticsService } from '@irene/api/services/analytics';

/** How many of the commonest vulnerabilities the top issues panel lists. */
export const TOP_ISSUES_LIMIT = 10;

/** The cache keys for what an organization's scanning adds up to. */
export const analyticsKeys = {
  all: () => ['analytics'] as const,
  scanCount: (orgId: number | string) => [...analyticsKeys.all(), 'scan-count', orgId] as const,

  appScans: (orgId: number | string, startDate: string, endDate: string) =>
    [...analyticsKeys.all(), 'app-scans', orgId, startDate, endDate] as const,

  recentIssues: (orgId: number | string) =>
    [...analyticsKeys.all(), 'recent-issues', orgId] as const,
};

/**
 * Builds the query for what the organization's scanning adds up to.
 *
 * @param orgId - The organization to count, empty before one is selected.
 * @returns Query options resolving to the counts by platform and by kind.
 */
export const scanCountOptions = (orgId: number | string) =>
  queryOptions({
    queryKey: analyticsKeys.scanCount(orgId),
    queryFn: () => AnalyticsService.getScanCount(orgId),
    enabled: Boolean(orgId),
  });

/**
 * Builds the query for the apps scanned within a range.
 *
 * The range is part of the key, so moving the dates reads a different entry
 * rather than discarding the one on screen.
 *
 * @param orgId - The organization to read, empty before one is selected.
 * @param startDate - The first day to include, as an ISO timestamp.
 * @param endDate - The last day to include, as an ISO timestamp.
 * @returns Query options resolving to a row per app per day it was scanned.
 */
export const appScansOptions = (orgId: number | string, startDate: string, endDate: string) =>
  queryOptions({
    queryKey: analyticsKeys.appScans(orgId, startDate, endDate),
    queryFn: () =>
      AnalyticsService.getAppScans(orgId, { start_date: startDate, end_date: endDate }),
    enabled: Boolean(orgId),
  });

/**
 * Builds the query for the vulnerabilities found most often.
 *
 * @param orgId - The organization to read, empty before one is selected.
 * @returns Query options resolving to the commonest vulnerabilities, with their counts.
 */
export const recentIssuesOptions = (orgId: number | string) =>
  queryOptions({
    queryKey: analyticsKeys.recentIssues(orgId),
    queryFn: () => AnalyticsService.getRecentIssues(orgId, { limit: TOP_ISSUES_LIMIT, offset: 0 }),
    enabled: Boolean(orgId),
  });
