import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';

import type {
  ApiSaveReportRequest,
  ApiSavedReport,
  ApiSavedReportDownloadRequest,
  ApiSavedReportListResponse,
  ApiSavedReportPreview,
  ApiSavedReportPreviewRequest,
  ApiSavedReportSnapshot,
  ApiSavedReportUpdate,
  ApiSavedReportViewConfig,
} from '@irene/api/services/saved-report';

import { SavedReportEndpoints } from './endpoints';

/** What the list is narrowed and paged by. */
export interface SavedReportListParams {
  search?: string;
  limit: number;
  offset: number;
}

/**
 * Talks to Luna about the reports an account kept from AI reporting.
 *
 * Every call is about the signed-in account's own reports in its organization;
 * Luna answers 404 for anyone else's, and 403 while the organization has saved
 * reports switched off. None of them uses AI.
 */
export default class SavedReportService {
  /**
   * Fetches a page of the account's saved reports, pinned first.
   *
   * @param params - The search text and the page.
   * @returns The page, and how many reports the account may keep.
   */
  public static readonly getSavedReports = async ({ search, limit, offset }: SavedReportListParams) => {
    const response = await apiRequest.get<ApiSavedReportListResponse>(SavedReportEndpoints.list(), {
      params: { limit, offset, ...(search ? { search } : {}) },
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

    return { ...transformPaginatedResponse(response), maxSavedReports: response.max_saved_reports };
  };

  /**
   * Fetches one saved report: its question, columns, chart, view settings and rows' state.
   *
   * @param id - The saved report.
   * @returns The report.
   */
  public static readonly getSavedReport = (id: number | string) =>
    apiRequest.get<ApiSavedReport>(SavedReportEndpoints.detail(id), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /**
   * Saves a generated report under a name, with the rows it showed.
   *
   * @param body - The report request, the name and the view settings.
   * @returns The saved report.
   */
  public static readonly saveReport = (body: ApiSaveReportRequest) =>
    apiRequest.post<ApiSavedReport>(SavedReportEndpoints.list(), body);

  /**
   * Renames a saved report, replaces its view settings, or pins or unpins it.
   *
   * @param id - The saved report.
   * @param changes - Only the fields that change.
   * @returns The report as it now is.
   */
  public static readonly updateSavedReport = (id: number | string, changes: ApiSavedReportUpdate) =>
    apiRequest.patch<ApiSavedReport>(SavedReportEndpoints.detail(id), changes);

  /**
   * Saves a saved report, with the view on screen, as a new report under a new
   * name; the original stays exactly as it was.
   *
   * @param id - The saved report to copy.
   * @param body - The new name and view settings.
   * @returns The new report.
   */
  public static readonly copySavedReport = (
    id: number | string,
    body: { name: string; view_config?: ApiSavedReportViewConfig }
  ) => apiRequest.post<ApiSavedReport>(SavedReportEndpoints.copy(id), body);

  /**
   * Deletes a saved report. Luna keeps it, so `restoreSavedReport` can undo this.
   *
   * @param id - The saved report.
   * @returns Resolves once it is deleted.
   */
  public static readonly deleteSavedReport = (id: number | string) =>
    apiRequest.delete<void>(SavedReportEndpoints.detail(id));

  /**
   * Brings back a report deleted a moment ago.
   *
   * @param id - The deleted report.
   * @returns The report.
   */
  public static readonly restoreSavedReport = (id: number | string) =>
    apiRequest.post<ApiSavedReport>(SavedReportEndpoints.restore(id));

  /**
   * Asks Luna to fetch the report's rows again. It answers at once; the report
   * reads `refreshing` until the rows arrive or the refresh fails.
   *
   * @param id - The saved report.
   * @returns The rows' state right after asking.
   */
  public static readonly refreshSavedReport = (id: number | string) =>
    apiRequest.post<ApiSavedReportSnapshot>(SavedReportEndpoints.refresh(id));

  /**
   * Fetches one page of the saved rows, narrowed by filters, with every row the chart draws.
   *
   * @param id - The saved report.
   * @param body - The page and the filters.
   * @returns The page.
   */
  public static readonly previewSavedReport = (id: number | string, body: ApiSavedReportPreviewRequest) =>
    apiRequest.post<ApiSavedReportPreview>(SavedReportEndpoints.preview(id), body, {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /**
   * Prepares the saved rows as a file. Columns and filters sent replace the saved
   * ones, so unsaved edits download as they are shown.
   *
   * @param id - The saved report.
   * @param body - The format, and the columns and filters on screen.
   * @returns A short-lived signed link to the file.
   */
  public static readonly getSavedReportDownloadUrl = async (
    id: number | string,
    body: ApiSavedReportDownloadRequest
  ) => {
    const response = await apiRequest.post<{ url: string }>(SavedReportEndpoints.downloadUrl(id), body);

    return response.url;
  };
}
