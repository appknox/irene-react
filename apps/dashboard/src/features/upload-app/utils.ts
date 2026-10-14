import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import type { ApiSubmission, ApiSubmissionStatus } from '@irene/api/services/submission';
import type { FileBeingUploaded } from '@/features/upload-app/store';

/** What has become of an upload. */
export type UploadOutcome = 'failed' | 'running' | 'completed';

/** How many uploads fall under each outcome. */
export type UploadOutcomeCounts = Record<UploadOutcome, number>;

/** One row of the popover: a file this tab is sending, or an upload the server reported. */
export type UploadRow = { key: string; outcome: UploadOutcome; sentAt: number } & (
  { kind: 'sending'; file: FileBeingUploaded } | { kind: 'reported'; submission: ApiSubmission }
);

/** The statuses that mean an upload will never become a file. */
const FAILED_STATUSES: Set<ApiSubmissionStatus> = new Set([
  ENUMS.SUBMISSION_STATUS.DOWNLOAD_FAILED,
  ENUMS.SUBMISSION_STATUS.VALIDATE_FAILED,
  ENUMS.SUBMISSION_STATUS.STORE_URL_VALIDATION_FAILED,
  ENUMS.SUBMISSION_STATUS.STORE_DOWNLOAD_FAILED,
  ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_FAILED,
]);

/** How far along the server reports each stage to be, as a percentage. */
const PROGRESS_BY_STATUS: Partial<Record<ApiSubmissionStatus, number>> = {
  [ENUMS.SUBMISSION_STATUS.STORE_VALIDATING_URL]: 20,
  [ENUMS.SUBMISSION_STATUS.STORE_DOWNLOAD_PREPARE]: 30,
  [ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING]: 40,
  [ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_PREPARE]: 50,
  [ENUMS.SUBMISSION_STATUS.STORE_UPLOADING]: 60,
  [ENUMS.SUBMISSION_STATUS.VALIDATE_PREPARE]: 70,
  [ENUMS.SUBMISSION_STATUS.VALIDATING]: 80,
};

/** The order rows are shown in: what needs attention first, what is done last. */
const OUTCOME_ORDER: UploadOutcome[] = ['failed', 'running', 'completed'];

/** The row for an upload the server has created. */
function _rowForSubmission(submission: ApiSubmission): UploadRow {
  return {
    kind: 'reported',
    key: `submission-${submission.id}`,
    outcome: uploadOutcome(submission),
    sentAt: Date.parse(submission.created_on),
    submission,
  };
}

/** The row for a file this tab is still sending. */
function _rowForFile(file: FileBeingUploaded): UploadRow {
  return {
    kind: 'sending',
    key: file.id,
    outcome: 'running',
    sentAt: Date.parse(file.startedAt),
    file,
  };
}

/** Orders two rows: by what became of them, then newest first. */
function _orderByOutcomeThenNewest(one: UploadRow, other: UploadRow) {
  const byOutcome = OUTCOME_ORDER.indexOf(one.outcome) - OUTCOME_ORDER.indexOf(other.outcome);

  return byOutcome === 0 ? other.sentAt - one.sentAt : byOutcome;
}

/**
 * What has become of an upload.
 *
 * Analysing means the server has made a file of it and the upload is done with;
 * anything the server calls a failure will not become one.
 *
 * @param submission - The upload as the server last reported it.
 * @returns Whether it failed, finished, or is still running.
 */
export function uploadOutcome(submission: ApiSubmission): UploadOutcome {
  if (FAILED_STATUSES.has(submission.status)) {
    return 'failed';
  }

  return submission.status === ENUMS.SUBMISSION_STATUS.ANALYZING ? 'completed' : 'running';
}

/**
 * Whether an upload belongs to the list being shown.
 *
 * The two products list their uploads separately, and the server filters its
 * answer accordingly. A pushed upload arrives unfiltered, so it is checked
 * here against the list it would be added to.
 *
 * @param submission - The upload as the server reported it.
 * @param isOffsec - Whether the list being shown is the offensive-security one.
 * @returns Whether that list is where this upload goes.
 */
export function isUploadInQueue(submission: ApiSubmission, isOffsec?: boolean) {
  const isOffsecUpload = submission.source === ENUMS.SUBMISSION_SOURCE.OFFSEC;

  return isOffsecUpload === Boolean(isOffsec);
}

/**
 * How an outcome is shown: what it is called, and the icon and colour for it.
 *
 * @param outcome - Whether the upload failed, finished, or is still running.
 * @returns What to draw for it.
 */
export function getUploadStatusDisplayProps(outcome: UploadOutcome) {
  switch (outcome) {
    case 'failed':
      return {
        label: akMT('failed'),
        icon: 'material-symbols:error',
        color: 'text-danger',
      } as const;

    case 'completed':
      return {
        label: akMT('completed'),
        icon: 'material-symbols:download-done',
        color: 'text-success',
      } as const;

    default:
      return {
        label: akMT('inProgress'),
        icon: 'material-symbols:downloading',
        color: 'text-info',
      } as const;
  }
}

/**
 * How far along an upload is.
 *
 * The server names a stage rather than a percentage, so each stage carries the
 * share of the work it stands for. A stage with no share reads as none done.
 *
 * @param submission - The upload as the server last reported it.
 * @returns The percentage to show.
 */
export function getSubmissionUploadProgress(submission: ApiSubmission) {
  return PROGRESS_BY_STATUS[submission.status] ?? 0;
}

/**
 * The rows the popover shows, in the order it shows them.
 *
 * A file this tab is sending has a row of its own until the upload finishes,
 * at which point the submission it became takes its place.
 *
 * @param submissions - The uploads the server has reported.
 * @param files - The files this tab is sending.
 * @returns One row per upload, ordered as the popover shows them.
 */
export function buildUploadRows(submissions: ApiSubmission[], files: FileBeingUploaded[]) {
  return [...submissions.map(_rowForSubmission), ...files.map(_rowForFile)].sort(
    _orderByOutcomeThenNewest
  );
}

/**
 * Counts the rows by what has become of each upload.
 *
 * @param rows - The rows the popover is showing.
 * @returns How many failed, how many are running, and how many finished.
 */
export function countUploadOutcomes(rows: UploadRow[]) {
  return rows.reduce<UploadOutcomeCounts>(
    (counts, row) => ({ ...counts, [row.outcome]: counts[row.outcome] + 1 }),
    { failed: 0, running: 0, completed: 0 }
  );
}
