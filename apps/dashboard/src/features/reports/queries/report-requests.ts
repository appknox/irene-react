import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { ReportRequestService, type ApiReportRequest } from '@irene/api/services/report-request';
import type { ApiReportFilterSection } from '@irene/api/services/saved-report';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';

/** How often a report being generated is read again, as irene polls it. */
export const GENERATE_POLL_MS = 3000;

/** The cache keys for AI reporting's report requests. */
export const reportRequestKeys = {
  all: () => ['report-request'] as const,
  detail: (id: number) => [...reportRequestKeys.all(), 'detail', id] as const,
  preview: (id: number, page: { limit: number; offset: number }, filters: ApiReportFilterSection[]) =>
    [...reportRequestKeys.all(), 'preview', id, page.limit, page.offset, JSON.stringify(filters)] as const,
  aiSettings: (organizationId: number | string) => ['organization-ai-settings', organizationId] as const,
};

/**
 * Whether Luna has finished with a request, either way.
 *
 * @param request - The request.
 * @returns True once it is completed or failed.
 */
export const isReportRequestDone = (request: ApiReportRequest) =>
  request.status === ENUMS.AI_REPORTING_REQUEST_STATUS.COMPLETED ||
  request.status === ENUMS.AI_REPORTING_REQUEST_STATUS.FAILED;

/**
 * Builds the query for one report request, read again every few seconds until
 * Luna has finished with it. A 404 is the answer (not the account's), so it is
 * not retried.
 *
 * @param id - The request.
 * @returns Query options resolving to the request.
 */
export const reportRequestOptions = (id: number) =>
  queryOptions({
    queryKey: reportRequestKeys.detail(id),
    queryFn: () => ReportRequestService.getReportRequest(id),
    refetchInterval: (query) =>
      query.state.data && isReportRequestDone(query.state.data) ? false : GENERATE_POLL_MS,
    retry: (failureCount, error) =>
      getApiErrorStatus(error) !== HTTP_STATUS_CODES.NOT_FOUND && failureCount < 2,
  });

/**
 * Builds the query for one page of a generated report, narrowed by filters.
 * The previous page stays on screen while the next loads.
 *
 * @param id - The request.
 * @param page - The page size and first row.
 * @param filters - The filter sections applied.
 * @returns Query options resolving to the page.
 */
export const reportPreviewOptions = (
  id: number,
  page: { limit: number; offset: number },
  filters: ApiReportFilterSection[]
) =>
  queryOptions({
    queryKey: reportRequestKeys.preview(id, page, filters),
    queryFn: () => ReportRequestService.previewReportRequest(id, { ...page, filter_details: filters }),
    placeholderData: keepPreviousData,
  });

/**
 * Builds the query for the organization's own AI settings, which decide whether
 * reports can be generated, beyond what the organization is entitled to.
 *
 * @param organizationId - The organization.
 * @returns Query options resolving to its AI settings.
 */
export const organizationAiSettingsOptions = (organizationId: number | string) =>
  queryOptions({
    queryKey: reportRequestKeys.aiSettings(organizationId),
    queryFn: () => ReportRequestService.getOrganizationAiSettings(organizationId),
  });
