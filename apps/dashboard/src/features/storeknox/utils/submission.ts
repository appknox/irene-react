import type { ApiSubmission, ApiSubmissionStatus } from '@irene/api/services/submission';
import { ENUMS } from '@irene/enums';

/* irene's `submissionStatusProgressPercentage`; an unlisted stage has no percentage and reads as "not uploading". */
const PROGRESS_BY_STATUS: Partial<Record<ApiSubmissionStatus, number>> = {
  [ENUMS.SUBMISSION_STATUS.STORE_VALIDATING_URL]: 20,
  [ENUMS.SUBMISSION_STATUS.STORE_DOWNLOAD_PREPARE]: 30,
  [ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING]: 40,
  [ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_PREPARE]: 50,
  [ENUMS.SUBMISSION_STATUS.STORE_UPLOADING]: 60,
  [ENUMS.SUBMISSION_STATUS.VALIDATE_PREPARE]: 70,
  [ENUMS.SUBMISSION_STATUS.VALIDATING]: 80,
};

const FAILED_STATUSES: ReadonlySet<ApiSubmissionStatus> = new Set([
  ENUMS.SUBMISSION_STATUS.DOWNLOAD_FAILED,
  ENUMS.SUBMISSION_STATUS.VALIDATE_FAILED,
  ENUMS.SUBMISSION_STATUS.STORE_URL_VALIDATION_FAILED,
  ENUMS.SUBMISSION_STATUS.STORE_DOWNLOAD_FAILED,
  ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_FAILED,
]);

/**
 * A store upload's progress percentage, as irene's `SubmissionModel.progress`;
 * undefined rather than zero for an unlisted stage, since that means no upload is running.
 */
export const skSubmissionProgress = (submission: ApiSubmission | null | undefined) =>
  submission ? PROGRESS_BY_STATUS[submission.status] : undefined;

/** Whether a store upload stopped at a failed stage. */
export const skSubmissionFailed = (submission: ApiSubmission | null | undefined) =>
  Boolean(submission && FAILED_STATUSES.has(submission.status));

/** Whether the upload reached Appknox and the file is being analysed. */
export const skSubmissionIsAnalyzing = (submission: ApiSubmission | null | undefined) =>
  submission?.status === ENUMS.SUBMISSION_STATUS.ANALYZING;
