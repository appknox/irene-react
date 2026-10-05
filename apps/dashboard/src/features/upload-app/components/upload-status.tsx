import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';

import { prependRecordToPage } from '@irene/api/normalization';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';
import { AkTypography } from '@irene/ui/ak-typography';
import { useWebsocketRecord, useWebsocketSignal } from '@irene/websocket';
import type { ApiSubmission } from '@irene/api/services/submission';

import { submissionKeys, uploadsInFlightOptions } from '@/features/upload-app/queries/submission';
import { useUploadAppStore } from '@/features/upload-app/store';
import { buildUploadRows, countUploadOutcomes } from '@/features/upload-app/utils';

import { UploadRow } from './upload-row';
import { UploadStatusCounts } from './upload-status-counts';
import { UploadStatusTrigger } from './upload-status-trigger';

/** How long a submission waits before it is shown, so a row leaving and one arriving are not at once. */
const SUBMISSION_APPEARS_AFTER_MS = 300;

/**
 * The upload ring in the top bar, and the list of uploads behind it.
 *
 * It appears once the account has an upload to watch, and is hidden otherwise.
 */
export function UploadStatus() {
  const queryClient = useQueryClient();
  const { uploads, shouldOpenUploadList, setShouldOpenUploadList } = useUploadAppStore();

  const [wsSubmissionRecords, setWsSubmissionRecords] = useState(
    new Map<ApiSubmission['id'], ApiSubmission>()
  );

  const { data: submissionResponse, refetch: refetchSubmissions } = useQuery(
    uploadsInFlightOptions(queryClient)
  );

  const submissions = submissionResponse?.items ?? [];
  const uploadRows = buildUploadRows(submissions, uploads);
  const uploadGroupCounts = countUploadOutcomes(uploadRows);
  const hasUploads = uploadRows.length > 0;

  /* A counter event has no submission in it, so load the list again. */
  useWebsocketSignal('SubmissionCounter', refetchSubmissions);

  /* The server sends the whole submission when it creates one, so take it in. */
  useWebsocketRecord('submission', (submission: ApiSubmission) =>
    setWsSubmissionRecords((received) => new Map(received).set(submission.id, submission))
  );

  // Used to ensure that there's a slight delay between when the upload row
  // leaves and when the submission record is added to the popover.
  useEffect(() => {
    if (wsSubmissionRecords.size === 0) {
      return;
    }

    // Appends the websocket submission to the list in the query client.
    const timer = setTimeout(() => {
      wsSubmissionRecords.forEach((submission) =>
        prependRecordToPage(queryClient, submissionKeys.inFlight(), 'submission', submission)
      );

      setWsSubmissionRecords(new Map());
    }, SUBMISSION_APPEARS_AFTER_MS);

    return () => clearTimeout(timer);
  }, [wsSubmissionRecords, queryClient]);

  /*
    Close the popover once there is nothing to show. Without this it would open
    on its own when the next upload arrives, even one made in another tab.
  */
  useEffect(() => {
    if (!hasUploads && shouldOpenUploadList) {
      setShouldOpenUploadList(false);
    }
  }, [hasUploads, shouldOpenUploadList, setShouldOpenUploadList]);

  return (
    <Fragment>
      {hasUploads ? (
        <div className="flex items-center gap-2.5">
          <span className="h-7.5 border-l border-border-strong" aria-hidden />

          <AkPopover open={shouldOpenUploadList} onOpenChange={setShouldOpenUploadList}>
            <AkPopoverTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center"
                title={akMT('uploadStatus')}
                aria-label={akMT('uploadStatus')}
                data-test-upload-status-trigger
              >
                <UploadStatusTrigger counts={uploadGroupCounts} />
              </button>
            </AkPopoverTrigger>

            <AkPopoverContent
              arrow
              align="center"
              className="w-105 border-neutral-100 p-0 shadow-9"
              data-test-upload-status-popover
            >
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-1">
                  <AkIcon name="material-symbols:show-chart" className="size-3.5" />

                  <AkTypography variant="subtitle1">{akMT('uploadStatus')}</AkTypography>
                </div>

                <UploadStatusCounts counts={uploadGroupCounts} />
              </div>

              <AkDivider color="light" />

              <div
                className="
                  flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto p-3.5 scrollbar-gutter-stable
                "
              >
                {uploadRows.map((row) => (
                  <UploadRow key={row.key} row={row} />
                ))}
              </div>
            </AkPopoverContent>
          </AkPopover>
        </div>
      ) : null}
    </Fragment>
  );
}
