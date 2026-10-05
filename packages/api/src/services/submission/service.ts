import { tagPaginatedRecordsForCaching } from '@irene/api/normalization';
import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiSubmission, ApiSubmissionListRequest } from '@irene/api/services/submission';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import { SubmissionEndpoints } from './endpoints';

/** Talks to the submission endpoints. */
export default class SubmissionService {
  /**
   * Fetches a page of the account's uploads.
   *
   * The rows are tagged, because the server pushes a submission again as it
   * progresses: a tagged row is found and updated wherever it sits.
   *
   * @param params - The page size, offset, and a status to filter by.
   * @returns The submissions on the page, and the total.
   */
  public static readonly getSubmissions = async (params: ApiSubmissionListRequest) => {
    const response = await apiRequest.get<ApiPageEnvelope<ApiSubmission>>(
      SubmissionEndpoints.list(),
      { params }
    );

    return tagPaginatedRecordsForCaching('submission', transformPaginatedResponse(response));
  };
}
