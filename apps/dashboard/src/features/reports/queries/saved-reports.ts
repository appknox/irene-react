import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { SavedReportService, type ApiReportFilterSection } from '@irene/api/services/saved-report';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';

/** How many saved reports the list asks for at once; Luna lets an account keep 50. */
export const SAVED_REPORTS_PAGE_SIZE = 50;

/** How often a refreshing report is read again, as Luna's design asks: the rows arrive in seconds. */
export const REFRESH_POLL_MS = 3000;

/** The cache keys for the account's saved reports. */
export const savedReportKeys = {
  all: () => ['saved-report'] as const,
  lists: () => [...savedReportKeys.all(), 'list'] as const,
  list: (search: string) => [...savedReportKeys.lists(), search] as const,
  detail: (id: number) => [...savedReportKeys.all(), 'detail', id] as const,
  previews: (id: number) => [...savedReportKeys.all(), 'preview', id] as const,
  preview: (
    id: number,
    page: { limit: number; offset: number },
    filters: ApiReportFilterSection[],
    refreshedAt: string
  ) => [...savedReportKeys.previews(id), page.limit, page.offset, JSON.stringify(filters), refreshedAt] as const,
};

/**
 * Builds the query for the Saved reports list.
 *
 * The previous answer stays on screen while a new search loads, so the list
 * does not blank out on every keystroke.
 *
 * @param search - What the account typed; empty lists every report.
 * @returns Query options resolving to the first page, pinned reports first.
 */
export const savedReportsOptions = (search: string) =>
  queryOptions({
    queryKey: savedReportKeys.list(search),
    queryFn: () => SavedReportService.getSavedReports({ search, limit: SAVED_REPORTS_PAGE_SIZE, offset: 0 }),
    placeholderData: keepPreviousData,
  });

/**
 * Builds the query for one saved report.
 *
 * While its rows are refreshing it is read again every few seconds until they
 * are ready or the refresh failed. A 404 is the answer (deleted, or never the
 * account's), so it is not retried.
 *
 * @param id - The saved report.
 * @returns Query options resolving to the report.
 */
export const savedReportOptions = (id: number) =>
  queryOptions({
    queryKey: savedReportKeys.detail(id),
    queryFn: () => SavedReportService.getSavedReport(id),
    refetchInterval: (query) =>
      query.state.data?.snapshot.status === 'refreshing' ? REFRESH_POLL_MS : false,
    retry: (failureCount, error) =>
      getApiErrorStatus(error) !== HTTP_STATUS_CODES.NOT_FOUND && failureCount < 2,
  });

/**
 * Builds the query for one page of a saved report's rows, narrowed by the
 * filters on screen.
 *
 * The key carries when the rows were fetched, so a finished refresh reads the
 * new rows rather than a cached page of the old ones.
 *
 * @param id - The saved report.
 * @param page - The page size and first row.
 * @param filters - The filter sections applied.
 * @param refreshedAt - When the report's rows were last fetched.
 * @returns Query options resolving to the page, with the chart's rows.
 */
export const savedReportPreviewOptions = (
  id: number,
  page: { limit: number; offset: number },
  filters: ApiReportFilterSection[],
  refreshedAt: string
) =>
  queryOptions({
    queryKey: savedReportKeys.preview(id, page, filters, refreshedAt),
    queryFn: () => SavedReportService.previewSavedReport(id, { ...page, filter_details: filters }),
    placeholderData: keepPreviousData,
  });
