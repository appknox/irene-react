import type { ENUMS } from '@irene/enums';

/*
  Both read `BASE_VALUES`, which is the group as declared. Reading `keyof`
  instead would take in the extras the enums package derives — `VALUES`,
  `CHOICES` and `UNKNOWN` — none of which the server sends.
*/

/** How far an upload has got. `status_humanized` is the server's own wording for it. */
export type ApiSubmissionStatus = (typeof ENUMS.SUBMISSION_STATUS)['BASE_VALUES'][number];

/** Where an upload came from. */
export type ApiSubmissionSource = (typeof ENUMS.SUBMISSION_SOURCE)['BASE_VALUES'][number];

/** What the server could read out of the binary, or off the store listing. */
export interface ApiSubmissionAppData {
  package_name: string;
  platform: number;
  name: string;
  version: string;
  version_code: string;
  icon_url: string;
  store_name: string;
  country: string;
  release_date: string;
}

/** One upload on its way to becoming a file. */
export interface ApiSubmission {
  id: number;
  file: number | null;
  reason: string;
  status: ApiSubmissionStatus;
  package_name: string;
  url: string;
  source: ApiSubmissionSource;
  status_humanized: string;
  created_on: string;
  app_data: ApiSubmissionAppData | null;
}

/** What the list endpoint accepts. */
export interface ApiSubmissionListRequest {
  limit: number;
  offset: number;
  status?: ApiSubmissionStatus;
}
