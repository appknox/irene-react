import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { SubmissionService, type ApiSubmission } from '@irene/api/services/submission';
import { ENUMS } from '@irene/enums';
import type { ApiTaggedRecord } from '@irene/api/normalization';
import type { ApiPage } from '@irene/api/utils/pagination';

/** How many uploads in flight the status popover asks for. */
export const UPLOADS_IN_FLIGHT_LIMIT = 20;

/** An upload as the popover holds it, tagged so the server can update it in place. */
type CachedUpload = ApiTaggedRecord<ApiSubmission>;

/** The cache keys for the account's uploads. */
export const submissionKeys = {
  all: () => ['submission'] as const,
  inFlight: () => [...submissionKeys.all(), 'in-flight'] as const,
};

/**
 * Adds what the server just reported to what the popover is already showing.
 *
 * The request asks only for what is still validating, so an upload the server
 * has since finished with is absent from the answer. Replacing the list with
 * it would clear every row the account has watched this session, which is the
 * part they most want to see.
 *
 * @param shown - The uploads the popover is already showing.
 * @param fetched - The uploads the server just reported.
 * @returns Both, each upload once, as the server last described it.
 */
function withUploadsAlreadyShown(
  shown: ApiPage<CachedUpload> | undefined,
  fetched: ApiPage<CachedUpload>
): ApiPage<CachedUpload> {
  const reported = new Set(fetched.items.map((upload) => upload.id));
  const stillShown = (shown?.items ?? []).filter((upload) => !reported.has(upload.id));
  const items = [...fetched.items, ...stillShown];

  return { ...fetched, items, count: items.length };
}

/**
 * Builds the query behind the upload status: what the account has uploaded lately.
 *
 * The server reports an upload as validating until it becomes a file, so that
 * is what is asked for; everything the popover has already shown is kept
 * beside it. A row then progresses over the socket, which reaches it here
 * without this query running again.
 *
 * @param queryClient - The cache, read to keep what is already on screen.
 * @returns Query options resolving to the uploads to show.
 */
export const uploadsInFlightOptions = (queryClient: QueryClient) =>
  queryOptions({
    queryKey: submissionKeys.inFlight(),
    queryFn: async () => {
      const submissions = await SubmissionService.getSubmissions({
        limit: UPLOADS_IN_FLIGHT_LIMIT,
        offset: 0,
        status: ENUMS.SUBMISSION_STATUS.VALIDATING,
      });

      // Appends the validating submissions to the list of submissions already in the popover.
      return withUploadsAlreadyShown(
        queryClient.getQueryData<ApiPage<CachedUpload>>(submissionKeys.inFlight()),
        submissions
      );
    },
  });
