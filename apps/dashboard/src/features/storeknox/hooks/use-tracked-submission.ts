import { useQuery } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import type { ApiSubmission } from '@irene/api/services/submission';

import { skSubmissionOptions } from '@/features/storeknox/queries/inventory';

/**
 * The upload an app or version points at, followed as pushed statuses reach its query.
 * A 404 means the account cannot see it, which irene reads as "someone else started it".
 *
 * @returns `follow` switches to an upload this account just started.
 */
export function useTrackedSubmission(
  submissionId: number | null,
  onStatusChange: (submission: ApiSubmission) => void
) {
  const [startedId, setStartedId] = useState<number | null>(null);
  const followedId = startedId ?? submissionId;

  const query = useQuery({
    ...skSubmissionOptions(followedId ?? ''),
    enabled: followedId !== null,
  });

  const submission = query.data;
  const lastSeen = useRef<Pick<ApiSubmission, 'id' | 'status'> | undefined>(undefined);
  const onChange = useEffectEvent(onStatusChange);

  useEffect(() => {
    if (!submission) {
      return;
    }

    /* A switch to another upload records its status without calling it a move. */
    if (lastSeen.current?.id === submission.id && lastSeen.current.status !== submission.status) {
      onChange(submission);
    }

    lastSeen.current = { id: submission.id, status: submission.status };
  }, [submission]);

  const cannotSee = getApiErrorStatus(query.error) === HTTP_STATUS_CODES.NOT_FOUND;

  return {
    submission,
    isLoading: followedId !== null && query.isPending,
    userCanAccessSubmission: Boolean(submission) || (query.isError && !cannotSee),
    /* A no-op with no upload, as irene's `resolveVersionSubmission`. */
    refetch: () => {
      if (followedId !== null) {
        void query.refetch();
      }
    },
    follow: setStartedId,
  };
}
