import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the uploads an account has made. */
export const SubmissionEndpoints = {
  /** Every submission of the signed-in account, newest first. */
  list: () => `${API_NAMESPACES.v1}/submissions` as const,

  /** One submission, which a page follows to show an upload's progress. */
  detail: (submissionId: number | string) =>
    `${API_NAMESPACES.v1}/submissions/${encodeURIComponent(submissionId)}` as const,
};
