import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';

import type {
  ApiOrganizationAiSettings,
  ApiReportDownloadRequest,
  ApiReportPreview,
  ApiReportPreviewRequest,
  ApiReportRequest,
} from '@irene/api/services/report-request';

import { OrganizationAiSettingsEndpoints, ReportRequestEndpoints } from './endpoints';

/**
 * Talks to Luna about AI reporting's questions and the reports generated from them.
 *
 * Asking costs the organization one AI report from its monthly allowance; every
 * other call reads what was generated.
 */
export default class ReportRequestService {
  /**
   * Asks for a report. Luna answers at once and generates it in the background,
   * so the request is read again until it is completed or failed.
   *
   * @param query - The question, in the user's words.
   * @returns The new request.
   */
  public static readonly createReportRequest = (query: string) =>
    apiRequest.post<ApiReportRequest>(ReportRequestEndpoints.list(), { query });

  /**
   * Reads one request.
   *
   * @param id - The request.
   * @returns The request and its status.
   */
  public static readonly getReportRequest = (id: number | string) =>
    apiRequest.get<ApiReportRequest>(ReportRequestEndpoints.detail(id), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /**
   * Fetches a page of the generated rows, narrowed by filters, with the columns,
   * the filters on offer and every row the chart draws.
   *
   * @param id - The request.
   * @param body - The page and the filters.
   * @returns The page.
   */
  public static readonly previewReportRequest = (id: number | string, body: ApiReportPreviewRequest) =>
    apiRequest.post<ApiReportPreview>(ReportRequestEndpoints.preview(id), body, {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /**
   * Prepares the generated rows as a file, in the columns and with the filters shown.
   *
   * @param id - The request.
   * @param body - The columns, the format and the filters.
   * @returns A short-lived signed link to the file.
   */
  public static readonly getReportDownloadUrl = async (
    id: number | string,
    body: ApiReportDownloadRequest
  ) => {
    const response = await apiRequest.post<{ url: string }>(ReportRequestEndpoints.downloadUrl(id), body);

    return response.url;
  };

  /**
   * Reads the organization's own AI settings, which decide whether reports can be
   * generated at all, beyond what the organization is entitled to.
   *
   * @param organizationId - The organization.
   * @returns Its AI settings.
   */
  public static readonly getOrganizationAiSettings = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationAiSettings>(OrganizationAiSettingsEndpoints.detail(organizationId), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });
}
